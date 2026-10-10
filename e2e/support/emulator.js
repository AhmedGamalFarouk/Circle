// Helpers that talk straight to the Firebase emulators. Admin SDK calls
// bypass security rules, so tests use them only to seed and inspect data.
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export const PROJECT_ID = "demo-circle";
const FIRESTORE = "127.0.0.1:8080";
const AUTH = "127.0.0.1:9099";
const DATABASE = "127.0.0.1:9000";

process.env.GCLOUD_PROJECT ??= PROJECT_ID;
process.env.METADATA_SERVER_DETECTION ??= "none";
process.env.FIRESTORE_EMULATOR_HOST ??= FIRESTORE;
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH;
process.env.FIREBASE_DATABASE_EMULATOR_HOST ??= DATABASE;

const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export { Timestamp };

export async function resetEmulators() {
  await Promise.all([
    fetch(
      `http://${FIRESTORE}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: "DELETE" },
    ),
    fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
      method: "DELETE",
    }),
    fetch(`http://${DATABASE}/.json?ns=${PROJECT_ID}-default-rtdb`, {
      method: "PUT",
      headers: { Authorization: "Bearer owner" },
      body: "{}",
    }),
  ]);
}

let counter = 0;
export function uniqueName(prefix) {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`.toLowerCase();
}

// Creates an auth account plus the profile document both apps expect.
export async function createUser(overrides = {}) {
  const username = overrides.username ?? uniqueName("user");
  const email = overrides.email ?? `${username}@example.com`;
  const password = overrides.password ?? "Passw0rd!";
  const { uid } = await adminAuth.createUser({
    email,
    password,
    displayName: username,
  });
  const profile = {
    uid,
    email,
    username,
    provider: "email",
    bio: "",
    location: "Cairo",
    photoUrl: null,
    avatarPhoto: "",
    isBlocked: false,
    isAdmin: false,
    interests: ["football"],
    joinedCircles: [],
    joinedEvents: [],
    connections: [],
    connectionRequests: [],
    stats: { circles: 0, connections: 0, events: 0 },
    createdAt: Timestamp.now(),
    ...overrides.profile,
  };
  await adminDb.doc(`users/${uid}`).set(profile);
  return { uid, email, password, username };
}

// Creates a circle owned by `owner`, with every user in `members` added.
export async function createCircle(owner, overrides = {}, members = []) {
  const ref = adminDb.collection("circles").doc();
  const circle = {
    circleName: overrides.circleName ?? uniqueName("Circle "),
    description: "A circle made by the e2e suite",
    circlePrivacy: "public",
    circleType: "permanent",
    interests: ["football"],
    createdBy: owner.uid,
    admins: [owner.uid],
    members: [owner.uid, ...members.map((m) => m.uid)],
    imageUrl: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    expiresAt: null,
    ...overrides,
  };
  await ref.set(circle);
  await addMember(ref.id, owner, { isAdmin: true, isOwner: true });
  for (const m of members) await addMember(ref.id, m);
  return { id: ref.id, ...circle };
}

export async function addMember(circleId, user, extra = {}) {
  await adminDb.doc(`circles/${circleId}/members/${user.uid}`).set({
    uid: user.uid,
    username: user.username,
    email: user.email,
    isAdmin: false,
    isOwner: false,
    joinedAt: Timestamp.now(),
    ...extra,
  });
  await adminDb.doc(`users/${user.uid}`).set(
    { joinedCircles: (await import("firebase-admin/firestore")).FieldValue.arrayUnion(circleId) },
    { merge: true },
  );
}

export async function getDoc(path) {
  const snap = await adminDb.doc(path).get();
  return snap.exists ? snap.data() : null;
}

export async function listDocs(path) {
  const snap = await adminDb.collection(path).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Profile shape written by the Expo app's sign-up screen (no photoUrl,
// string dates, friends instead of connections).
export function mobileProfile(username, email) {
  return {
    username,
    email,
    phoneNumber: "",
    avatarPhoto: "",
    coverPhoto: "",
    bio: "",
    dateOfBirth: "1995-05-05T00:00:00.000Z",
    location: "Cairo, Egypt",
    interests: ["football"],
    createdAt: new Date().toISOString(),
    friends: [],
    friendRequests: { sent: [], received: [] },
    joinedCircles: [],
    joinedEvents: [],
    stats: { circles: 0, connections: 0, events: 0 },
    reported: 0,
    isBlocked: false,
  };
}

export async function createMobileUser() {
  const username = uniqueName("mobile");
  const email = `${username}@example.com`;
  const user = await createUser({ username, email });
  await adminDb.doc(`users/${user.uid}`).set(mobileProfile(username, email));
  return user;
}

// A client SDK signed in as `user`, subject to the security rules, for
// checking what a signed-in user could do outside the UI.
export async function clientFor(user) {
  const { initializeApp: initClient } = await import("firebase/app");
  const { getAuth: getClientAuth, connectAuthEmulator, signInWithEmailAndPassword } =
    await import("firebase/auth");
  const firestore = await import("firebase/firestore");
  const app = initClient({ projectId: PROJECT_ID, apiKey: "demo-key" }, `client-${user.uid}-${Date.now()}`);
  const auth = getClientAuth(app);
  connectAuthEmulator(auth, `http://${AUTH}`, { disableWarnings: true });
  await signInWithEmailAndPassword(auth, user.email, user.password);
  const db = firestore.getFirestore(app);
  firestore.connectFirestoreEmulator(db, "127.0.0.1", 8080);
  return { db, ...firestore };
}
