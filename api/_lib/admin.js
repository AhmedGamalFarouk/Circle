// Shared by the routes in api/. Folders starting with "_" are not deployed as functions.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Vercel env FIREBASE_SERVICE_ACCOUNT holds the service-account JSON; the emulators need only a project id.
const app =
    getApps()[0] ??
    initializeApp(
        process.env.FIRESTORE_EMULATOR_HOST
            ? { projectId: process.env.GCLOUD_PROJECT || "demo-circle" }
            : { credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }
    );

export const db = getFirestore(app);
