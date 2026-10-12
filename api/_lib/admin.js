// Shared by the routes in api/. Folders starting with "_" are not deployed as functions.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Set up on first use, not at import, so a route can still answer 401 when the key is missing.
// Vercel env FIREBASE_SERVICE_ACCOUNT holds the service-account JSON; the emulators need only a project id.
export function getDb() {
    if (!getApps().length) {
        if (process.env.FIRESTORE_EMULATOR_HOST) {
            initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-circle" });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
        } else {
            throw new Error("FIREBASE_SERVICE_ACCOUNT is not set in this Vercel environment.");
        }
    }
    return getFirestore();
}
