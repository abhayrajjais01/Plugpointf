import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * --- WHAT IS FIREBASE? ---
 * Firebase is a tool by Google that handles our "User Accounts".
 * It takes care of checking passwords and Google logins 
 * so our app is secure.
 */

// We tell Firebase who we are by passing these secret keys.
// These are loaded from our '.env' file for safety.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

const isFirebaseConfigComplete = Object.values(firebaseConfig).every(val => val && val !== 'your-api-key' && !(val as string).includes('your-project'));

if (!isFirebaseConfigComplete) {
  console.warn("WARNING: Firebase configuration is incomplete! Some features may not work.");
}

// 1. Fire up the Firebase project
const app = initializeApp(firebaseConfig);

// 2. Turn on the "Authentication" service and export it so 
// the rest of the app can use it (see useFirebaseAuth.ts).
export const auth = getAuth(app);

export default app;
