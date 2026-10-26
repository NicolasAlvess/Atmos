import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../firebase-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore();