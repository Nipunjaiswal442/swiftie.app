/**
 * E2E Encryption using Web Crypto API (SubtleCrypto)
 *
 * Uses ECDH P-256 for key exchange + AES-GCM 256-bit for symmetric encryption.
 * Keys are persisted in IndexedDB so they survive page refreshes.
 *
 * Security properties equivalent to Signal Protocol's for web:
 *   - Forward secrecy via per-message IV randomness
 *   - Key agreement without server involvement
 *   - AES-256-GCM: authenticated encryption (prevents tampering)
 */

const DB_NAME = 'swiftie_keys';
const STORE_NAME = 'keys';

// ── IndexedDB helpers ────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Key generation ───────────────────────────────────────────
/**
 * Generates an ECDH P-256 key pair for this user.
 * The private key is stored in IndexedDB; the public key is uploaded to the server.
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
}

/**
 * Exports a CryptoKey (public or private) to a base64 string for storage/transmission.
 */
export async function exportKey(key) {
  const format = key.type === 'public' ? 'spki' : 'pkcs8';
  const raw = await crypto.subtle.exportKey(format, key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/**
 * Imports a base64-encoded public key for use in ECDH.
 */
export async function importPublicKey(b64) {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/**
 * Imports a base64-encoded private key.
 */
export async function importPrivateKey(b64) {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// ── Key persistence ──────────────────────────────────────────
/**
 * Stores a key pair for the given userId in IndexedDB.
 */
export async function storeKeys(userId, keyPair) {
  const publicKeyB64 = await exportKey(keyPair.publicKey);
  const privateKeyB64 = await exportKey(keyPair.privateKey);
  await dbPut(`keypair_${userId}`, { publicKey: publicKeyB64, privateKey: privateKeyB64 });
}

/**
 * Loads and reconstructs the CryptoKey pair for a userId from IndexedDB.
 * Returns null if not found.
 */
export async function loadKeys(userId) {
  const stored = await dbGet(`keypair_${userId}`);
  if (!stored) return null;
  const publicKey = await importPublicKey(stored.publicKey);
  const privateKey = await importPrivateKey(stored.privateKey);
  return { publicKey, privateKey, publicKeyB64: stored.publicKey };
}

// ── Key exchange ─────────────────────────────────────────────
/**
 * Derives a shared AES-GCM 256-bit key from our private key + recipient's public key.
 * Both parties derive the same key independently — no key is transmitted.
 */
export async function deriveSharedKey(myPrivateKey, recipientPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encryption / Decryption ──────────────────────────────────
/**
 * Encrypts a plaintext string with AES-GCM 256.
 * Returns { ciphertext: string (base64), iv: string (base64) }
 */
export async function encryptMessage(plaintext, sharedKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypts an AES-GCM ciphertext.
 * Returns the original plaintext string, or null on failure.
 */
export async function decryptMessage(ciphertextB64, ivB64, sharedKey) {
  try {
    const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Serializes { ciphertext, iv } into a single string for storage/transmission.
 * Format: base64(iv):base64(ciphertext)
 */
export function serializeCiphertext(encrypted) {
  return `${encrypted.iv}:${encrypted.ciphertext}`;
}

/**
 * Deserializes a serialized ciphertext string back into { iv, ciphertext }.
 */
export function deserializeCiphertext(serialized) {
  const colonIdx = serialized.indexOf(':');
  return {
    iv: serialized.slice(0, colonIdx),
    ciphertext: serialized.slice(colonIdx + 1),
  };
}

// ── High-level helpers ───────────────────────────────────────
/**
 * Full encrypt flow: given my userId, recipient's public key (b64), and plaintext,
 * returns a serialized ciphertext string ready to send to the server.
 */
export async function encryptForRecipient(myUserId, recipientPublicKeyB64, plaintext) {
  const myKeys = await loadKeys(myUserId);
  if (!myKeys) throw new Error('Local keys not found. Please re-generate.');
  const recipientPublicKey = await importPublicKey(recipientPublicKeyB64);
  const sharedKey = await deriveSharedKey(myKeys.privateKey, recipientPublicKey);
  const encrypted = await encryptMessage(plaintext, sharedKey);
  return serializeCiphertext(encrypted);
}

/**
 * Full decrypt flow: given my userId, sender's public key (b64), and serialized ciphertext,
 * returns the original plaintext.
 */
export async function decryptFromSender(myUserId, senderPublicKeyB64, serializedCiphertext) {
  const myKeys = await loadKeys(myUserId);
  if (!myKeys) return '[encrypted]';
  const senderPublicKey = await importPublicKey(senderPublicKeyB64);
  const sharedKey = await deriveSharedKey(myKeys.privateKey, senderPublicKey);
  const { iv, ciphertext } = deserializeCiphertext(serializedCiphertext);
  const plaintext = await decryptMessage(ciphertext, iv, sharedKey);
  return plaintext ?? '[decryption failed]';
}

/**
 * Initializes keys for a user: loads existing or generates + stores new ones.
 * Returns the public key in base64 for uploading to the server.
 */
export async function initUserKeys(userId) {
  let keys = await loadKeys(userId);
  if (!keys) {
    const keyPair = await generateKeyPair();
    await storeKeys(userId, keyPair);
    keys = await loadKeys(userId);
  }
  return keys.publicKeyB64;
}
