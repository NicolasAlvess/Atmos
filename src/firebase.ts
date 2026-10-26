
import 'dotenv/config';

import {
  getApps,
  initializeApp,
  cert
} from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n')
  .trim();

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    'Faltam variáveis de ambiente do Firebase no Render.'
  );
}

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });

export const db = getFirestore(app);
