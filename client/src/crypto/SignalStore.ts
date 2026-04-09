import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'swiftie-signal';
const DB_VERSION = 1;

const STORES = {
  IDENTITY_KEYS: 'identityKeys',
  PRE_KEYS: 'preKeys',
  SIGNED_PRE_KEYS: 'signedPreKeys',
  SESSIONS: 'sessions',
  CONFIG: 'config',
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        Object.values(STORES).forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        });
      },
    });
  }
  return dbPromise;
};

export class SignalProtocolStore {
  async getIdentityKeyPair(): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer } | undefined> {
    const db = await getDB();
    return db.get(STORES.CONFIG, 'identityKeyPair');
  }

  async getLocalRegistrationId(): Promise<number | undefined> {
    const db = await getDB();
    return db.get(STORES.CONFIG, 'registrationId');
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: number
  ): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get(STORES.IDENTITY_KEYS, identifier);
    if (!existing) return true;

    const existingBytes = new Uint8Array(existing);
    const newBytes = new Uint8Array(identityKey);
    if (existingBytes.length !== newBytes.length) return false;
    return existingBytes.every((byte, i) => byte === newBytes[i]);
  }

  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get(STORES.IDENTITY_KEYS, identifier);
    await db.put(STORES.IDENTITY_KEYS, identityKey, identifier);
    return !!existing;
  }

  async loadPreKey(keyId: number): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer } | undefined> {
    const db = await getDB();
    return db.get(STORES.PRE_KEYS, keyId);
  }

  async storePreKey(keyId: number, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }): Promise<void> {
    const db = await getDB();
    await db.put(STORES.PRE_KEYS, keyPair, keyId);
  }

  async removePreKey(keyId: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.PRE_KEYS, keyId);
  }

  async loadSignedPreKey(keyId: number): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer } | undefined> {
    const db = await getDB();
    return db.get(STORES.SIGNED_PRE_KEYS, keyId);
  }

  async storeSignedPreKey(keyId: number, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }): Promise<void> {
    const db = await getDB();
    await db.put(STORES.SIGNED_PRE_KEYS, keyPair, keyId);
  }

  async removeSignedPreKey(keyId: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.SIGNED_PRE_KEYS, keyId);
  }

  async loadSession(identifier: string): Promise<string | undefined> {
    const db = await getDB();
    return db.get(STORES.SESSIONS, identifier);
  }

  async storeSession(identifier: string, record: string): Promise<void> {
    const db = await getDB();
    await db.put(STORES.SESSIONS, record, identifier);
  }

  async removeSession(identifier: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.SESSIONS, identifier);
  }

  async removeAllSessions(identifier: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORES.SESSIONS, 'readwrite');
    const keys = await tx.store.getAllKeys();
    for (const key of keys) {
      if (String(key).startsWith(identifier)) {
        await tx.store.delete(key);
      }
    }
    await tx.done;
  }

  async storeIdentityKeyPair(keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, keyPair, 'identityKeyPair');
  }

  async storeLocalRegistrationId(registrationId: number): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, registrationId, 'registrationId');
  }
}

export const signalStore = new SignalProtocolStore();
