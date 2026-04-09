/**
 * E2E Encryption using @noble/curves (ECDH P-256) + @noble/ciphers (AES-256-GCM)
 *
 * Drop-in replacement for the Web Crypto API version.
 * Works on Hermes (React Native), iOS, Android, and Web.
 *
 * Wire format: base64(iv):base64(ciphertext) — identical to the web version.
 */

import { p256 } from '@noble/curves/p256';
import { gcm } from '@noble/ciphers/aes';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ── Storage helpers ──────────────────────────────────────────
async function storePut(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

// ── Base64 helpers ───────────────────────────────────────────
function toBase64(bytes: Uint8Array): string {
  if (Platform.OS === 'web') {
    return btoa(String.fromCharCode(...bytes));
  }
  // React Native doesn't have btoa for binary, use Buffer polyfill approach
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(b64: string): Uint8Array {
  if (Platform.OS === 'web') {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

// ── Key generation ───────────────────────────────────────────
export function generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey, false); // uncompressed
  return { privateKey, publicKey };
}

export function exportPublicKey(publicKey: Uint8Array): string {
  return toBase64(publicKey);
}

export function exportPrivateKey(privateKey: Uint8Array): string {
  return toBase64(privateKey);
}

export function importPublicKey(b64: string): Uint8Array {
  return fromBase64(b64);
}

export function importPrivateKey(b64: string): Uint8Array {
  return fromBase64(b64);
}

// ── Key persistence ──────────────────────────────────────────
export async function storeKeys(userId: string, keyPair: { privateKey: Uint8Array; publicKey: Uint8Array }): Promise<void> {
  const pub = exportPublicKey(keyPair.publicKey);
  const priv = exportPrivateKey(keyPair.privateKey);
  await storePut(`keypair_pub_${userId}`, pub);
  await storePut(`keypair_priv_${userId}`, priv);
}

export async function loadKeys(userId: string): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyB64: string;
} | null> {
  const pub = await storeGet(`keypair_pub_${userId}`);
  const priv = await storeGet(`keypair_priv_${userId}`);
  if (!pub || !priv) return null;
  return {
    publicKey: importPublicKey(pub),
    privateKey: importPrivateKey(priv),
    publicKeyB64: pub,
  };
}

// ── Key exchange ─────────────────────────────────────────────
function deriveSharedSecret(myPrivateKey: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array {
  // ECDH: shared point x-coordinate (32 bytes)
  const shared = p256.getSharedSecret(myPrivateKey, recipientPublicKey);
  // Use first 32 bytes as AES-256 key
  return shared.slice(1, 33); // strip 0x04 prefix
}

// ── Encryption / Decryption ──────────────────────────────────
export function encryptMessage(plaintext: string, sharedKey: Uint8Array): { ciphertext: string; iv: string } {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = gcm(sharedKey, iv);
  const encrypted = cipher.encrypt(encoded);
  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv),
  };
}

export function decryptMessage(ciphertextB64: string, ivB64: string, sharedKey: Uint8Array): string | null {
  try {
    const ciphertext = fromBase64(ciphertextB64);
    const iv = fromBase64(ivB64);
    const cipher = gcm(sharedKey, iv);
    const decrypted = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function serializeCiphertext(encrypted: { ciphertext: string; iv: string }): string {
  return `${encrypted.iv}:${encrypted.ciphertext}`;
}

export function deserializeCiphertext(serialized: string): { iv: string; ciphertext: string } {
  const colonIdx = serialized.indexOf(':');
  return {
    iv: serialized.slice(0, colonIdx),
    ciphertext: serialized.slice(colonIdx + 1),
  };
}

// ── High-level helpers ───────────────────────────────────────
export async function encryptForRecipient(
  myUserId: string,
  recipientPublicKeyB64: string,
  plaintext: string
): Promise<string> {
  const myKeys = await loadKeys(myUserId);
  if (!myKeys) throw new Error('Local keys not found. Please re-generate.');
  const recipientPublicKey = importPublicKey(recipientPublicKeyB64);
  const sharedKey = deriveSharedSecret(myKeys.privateKey, recipientPublicKey);
  const encrypted = encryptMessage(plaintext, sharedKey);
  return serializeCiphertext(encrypted);
}

export async function decryptFromSender(
  myUserId: string,
  senderPublicKeyB64: string,
  serializedCiphertext: string
): Promise<string> {
  const myKeys = await loadKeys(myUserId);
  if (!myKeys) return '[encrypted]';
  const senderPublicKey = importPublicKey(senderPublicKeyB64);
  const sharedKey = deriveSharedSecret(myKeys.privateKey, senderPublicKey);
  const { iv, ciphertext } = deserializeCiphertext(serializedCiphertext);
  const plaintext = decryptMessage(ciphertext, iv, sharedKey);
  return plaintext ?? '[decryption failed]';
}

export async function initUserKeys(userId: string): Promise<string> {
  let keys = await loadKeys(userId);
  if (!keys) {
    const keyPair = generateKeyPair();
    await storeKeys(userId, keyPair);
    keys = await loadKeys(userId);
  }
  return keys!.publicKeyB64;
}
