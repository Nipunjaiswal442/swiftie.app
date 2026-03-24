import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
} from '@privacyresearch/libsignal-protocol-typescript';
import { signalStore, SignalProtocolStore } from './SignalStore';
import { arrayBufferToBase64, base64ToArrayBuffer } from './keyUtils';
import { uploadKeyBundle, getKeyBundle, replenishKeys } from '../services/keyService';
import { SerializedPreKeyBundle } from '../types/signal';

const NUM_PRE_KEYS = 100;

export class SignalManager {
  private store: SignalProtocolStore;

  constructor() {
    this.store = signalStore;
  }

  async initialize(): Promise<void> {
    const existing = await this.store.getIdentityKeyPair();
    if (existing) return;

    const registrationId = KeyHelper.generateRegistrationId();
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, 1);

    await this.store.storeLocalRegistrationId(registrationId);
    await this.store.storeIdentityKeyPair(identityKeyPair);
    await this.store.storeSignedPreKey(1, signedPreKey.keyPair);

    const oneTimePreKeys: Array<{ keyId: number; publicKey: string }> = [];

    for (let i = 1; i <= NUM_PRE_KEYS; i++) {
      const preKey = await KeyHelper.generatePreKey(i);
      await this.store.storePreKey(i, preKey.keyPair);
      oneTimePreKeys.push({
        keyId: i,
        publicKey: arrayBufferToBase64(preKey.keyPair.pubKey),
      });
    }

    await uploadKeyBundle({
      registrationId,
      identityKey: arrayBufferToBase64(identityKeyPair.pubKey),
      signedPreKey: {
        keyId: 1,
        publicKey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
        signature: arrayBufferToBase64(signedPreKey.signature),
      },
      oneTimePreKeys,
    });
  }

  async encryptMessage(recipientId: string, plaintext: string): Promise<{
    ciphertext: string;
    messageType: number;
  }> {
    const address = new SignalProtocolAddress(recipientId, 1);
    const sessionCipher = new SessionCipher(this.store as any, address);

    const existingSession = await this.store.loadSession(`${recipientId}.1`);
    if (!existingSession) {
      await this.establishSession(recipientId);
    }

    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext).buffer;
    const encrypted = await sessionCipher.encrypt(plaintextBuffer);

    return {
      ciphertext: encrypted.body!,
      messageType: encrypted.type,
    };
  }

  async decryptMessage(
    senderId: string,
    ciphertext: string,
    messageType: number
  ): Promise<string> {
    const address = new SignalProtocolAddress(senderId, 1);
    const sessionCipher = new SessionCipher(this.store as any, address);

    let decrypted: ArrayBuffer;

    if (messageType === 3) {
      decrypted = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext, 'binary');
    } else {
      decrypted = await sessionCipher.decryptWhisperMessage(ciphertext, 'binary');
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private async establishSession(recipientId: string): Promise<void> {
    const bundle: SerializedPreKeyBundle = await getKeyBundle(recipientId);
    const address = new SignalProtocolAddress(recipientId, 1);
    const sessionBuilder = new SessionBuilder(this.store as any, address);

    const preKeyBundle: any = {
      registrationId: bundle.registrationId,
      identityKey: base64ToArrayBuffer(bundle.identityKey),
      signedPreKey: {
        keyId: bundle.signedPreKey.keyId,
        publicKey: base64ToArrayBuffer(bundle.signedPreKey.publicKey),
        signature: base64ToArrayBuffer(bundle.signedPreKey.signature),
      },
    };

    if (bundle.oneTimePreKey) {
      preKeyBundle.preKey = {
        keyId: bundle.oneTimePreKey.keyId,
        publicKey: base64ToArrayBuffer(bundle.oneTimePreKey.publicKey),
      };
    }

    await sessionBuilder.processPreKey(preKeyBundle);
  }

  async generateAndUploadPreKeys(startId: number, count: number = 50): Promise<void> {
    const identityKeyPair = await this.store.getIdentityKeyPair();
    if (!identityKeyPair) return;

    const oneTimePreKeys: Array<{ keyId: number; publicKey: string }> = [];

    for (let i = startId; i < startId + count; i++) {
      const preKey = await KeyHelper.generatePreKey(i);
      await this.store.storePreKey(i, preKey.keyPair);
      oneTimePreKeys.push({
        keyId: i,
        publicKey: arrayBufferToBase64(preKey.keyPair.pubKey),
      });
    }

    await replenishKeys(oneTimePreKeys);
  }
}

export const signalManager = new SignalManager();
