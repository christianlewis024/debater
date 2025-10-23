import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Enable offline persistence with error handling
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, {
    forceOwnership: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Browser does not support persistence');
    } else {
      console.error('Error enabling persistence:', err);
    }
  });
}

// Connect to Firebase Emulators if in development mode
if (process.env.REACT_APP_USE_EMULATORS === 'true') {
  console.log('🔧 Connecting to Firebase Emulators...');

  // Connect to Auth Emulator
  const authPort = process.env.REACT_APP_AUTH_EMULATOR_PORT || 9099;
  connectAuthEmulator(auth, `http://localhost:${authPort}`, { disableWarnings: true });
  console.log(`✅ Auth Emulator: http://localhost:${authPort}`);

  // Connect to Firestore Emulator
  const firestorePort = process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080;
  connectFirestoreEmulator(db, 'localhost', firestorePort);
  console.log(`✅ Firestore Emulator: http://localhost:${firestorePort}`);

  // Connect to Realtime Database Emulator
  const databasePort = process.env.REACT_APP_DATABASE_EMULATOR_PORT || 9000;
  connectDatabaseEmulator(rtdb, 'localhost', databasePort);
  console.log(`✅ Database Emulator: http://localhost:${databasePort}`);

  console.log('🎉 All Firebase Emulators connected!');
  console.log('📊 Emulator UI: http://localhost:4000');
}

export default app;
