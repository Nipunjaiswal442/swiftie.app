import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let initialized = false;

export function getFirebaseAdmin(): admin.app.App {
  if (initialized) return admin.app();

  // Production: FIREBASE_SERVICE_ACCOUNT_JSON env var holds raw JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // Development: path to a local service account file
    const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json');
    if (!fs.existsSync(saPath)) {
      throw new Error(`Firebase service account file not found at: ${saPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  initialized = true;
  console.log('[firebase-admin] initialized');
  return admin.app();
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = getFirebaseAdmin();
  return app.auth().verifyIdToken(idToken);
}
