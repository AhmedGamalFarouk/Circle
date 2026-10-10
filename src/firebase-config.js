import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, doc, getDoc, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// End-to-end tests run against local Firebase emulators, never live data.
// Set VITE_USE_FIREBASE_EMULATORS=true (see .env.e2e) to enable.
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const emulatorProjectId = "demo-circle";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW0f0DzBx3e769VkVdUimATL6-gnW4cTo",
  authDomain: "circle-26a87.firebaseapp.com",
  databaseURL: "https://circle-26a87-default-rtdb.firebaseio.com/", // Try this first
  projectId: "circle-26a87",
  storageBucket: "circle-26a87.firebasestorage.app",
  messagingSenderId: "141731835688",
  appId: "1:141731835688:web:69bd763eeda258b0eb6a1d",
};

if (useEmulators) {
  // "demo-" projects never reach production services.
  firebaseConfig.projectId = emulatorProjectId;
  firebaseConfig.authDomain = `${emulatorProjectId}.firebaseapp.com`;
  firebaseConfig.databaseURL = `https://${emulatorProjectId}-default-rtdb.firebaseio.com`;
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const database = getDatabase(app); // Export Realtime Database
export const auth = getAuth(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectDatabaseEmulator(database, "127.0.0.1", 9000);
}
export const GoogleProvider = new GoogleAuthProvider();

export async function checkIfBlocked(user) {
  if (!user) {
    return false;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return false;
    }

    const userData = userDocSnap.data();

    return userData.isBlocked === true;
  } catch (error) {
    console.error("Error checking blocked status:", error);
    return false;
  }
}
export default app;
