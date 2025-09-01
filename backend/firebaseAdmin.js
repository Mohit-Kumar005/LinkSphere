import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Helper to find the correct path to the JSON file in an ES Module
const __filename = fileURLToPath(import.meta.url); // <-- CORRECTED TYPO HERE
const __dirname = dirname(__filename);

// Read and parse the JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync(join(__dirname, 'serviceAccountKey.json'))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export the initialized services
export const db = admin.firestore();
export const auth = admin.auth();
export { admin as default };
