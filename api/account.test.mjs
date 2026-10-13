// Runs api/delete-account.js and api/delete-media.js against the Auth and
// Firestore emulators: npm run test:api
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getAuth } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "./_lib/admin.js";
import { DEMO_EMAIL } from "./_lib/auth.js";
import { parseCloudinaryUrl } from "./_lib/cloudinary.js";
import { POST as deleteAccount } from "./delete-account.js";
import { POST as deleteMedia } from "./delete-media.js";

process.env.CIRCLE_TEST_MODE = "1";
Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: "demo-cloud", CLOUDINARY_API_KEY: "k", CLOUDINARY_API_SECRET: "s" });
const db = getDb();
const auth = getAuth();

// Cloudinary calls are recorded, not sent.
const cloudinaryCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://api.cloudinary.com/")) {
        cloudinaryCalls.push(`${init.method} ${decodeURIComponent(String(url))}`);
        return new Response("{}", { status: 200 });
    }
    return realFetch(url, init);
};

// A real emulator sign-in, so auth_time comes after the account was created.
async function signIn(user) {
    const res = await realFetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, password: "Passw0rd!", returnSecureToken: true }),
    });
    return (await res.json()).idToken;
}
// authAgeSec: pretend the sign-in happened that many seconds ago.
const call = async (route, user, { headers = {}, body = {}, authAgeSec = 0 } = {}) => {
    const token = user && await signIn(user);
    const realNow = Date.now;
    if (authAgeSec) Date.now = () => realNow() + authAgeSec * 1000;
    try {
        return await route(new Request("http://localhost/api/x", {
            method: "POST",
            headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
            body: JSON.stringify(body),
        }));
    } finally {
        Date.now = realNow;
    }
};

async function makeUser(uid, extra = {}) {
    await auth.createUser({ uid, email: extra.email || `${uid}@example.com`, password: "Passw0rd!" });
    await db.doc(`users/${uid}`).set({ username: uid, connections: [], connectionRequests: [], stats: { connections: 0 }, ...extra.profile });
    return { uid, email: extra.email || `${uid}@example.com` };
}
const member = (circleId, uid, extra = {}) => db.doc(`circles/${circleId}/members/${uid}`).set({ userId: uid, isAdmin: false, isOwner: false, joinedAt: Timestamp.now(), ...extra });

beforeEach(async () => {
    for (const c of ["circles", "users", "circleRequests"]) await db.recursiveDelete(db.collection(c));
    const { users } = await auth.listUsers();
    if (users.length) await auth.deleteUsers(users.map((u) => u.uid));
    cloudinaryCalls.length = 0;
});

test("refuses a missing token, a stale sign-in and the demo account", async () => {
    const u = await makeUser("u1");
    const demo = await makeUser("demo", { email: DEMO_EMAIL });
    assert.equal((await call(deleteAccount, null)).status, 401);
    const stale = await call(deleteAccount, u, { authAgeSec: 301 });
    assert.equal(stale.status, 401);
    assert.equal((await stale.json()).error, "reauth");
    assert.equal((await call(deleteAccount, demo)).status, 403);
    assert.equal((await call(deleteMedia, demo)).status, 403);
    assert.ok((await db.doc("users/u1").get()).exists);
    assert.ok((await db.doc("users/demo").get()).exists);
});

test("an owner with another member: the circle survives under the new owner, the user is gone", async () => {
    const me = await makeUser("me", { profile: { avatarPhoto: "https://res.cloudinary.com/demo-cloud/image/upload/v1/avatars/me.jpg" } });
    await makeUser("pal", { profile: { connections: ["me", "x"], connectionRequests: [{ uid: "me", username: "me" }], stats: { connections: 2 } } });
    await makeUser("old", { profile: { friends: ["me"], friendRequests: { sent: ["me"], received: [] }, stats: { connections: 1 } } });
    await db.doc("circles/c1").set({ createdBy: "me", circlePrivacy: "private" });
    await member("c1", "me", { isOwner: true, isAdmin: true });
    await member("c1", "pal");
    await db.doc("circles/c1/polls/p").set({ stage: "Planning the Activity", activityPoll: { votes: { me: "A", pal: "B" } } });
    await db.doc("circles/c2").set({ createdBy: "pal" });
    await member("c2", "me");
    await member("c2", "pal", { isOwner: true });
    await db.doc("circleRequests/r1").set({ requesterId: "me", circleId: "c2", status: "pending" });
    await db.doc("users/me/notifications/n1").set({ type: "x" });
    await db.doc("users/me/private/profile").set({ dateOfBirth: "2000-01-01" });

    const res = await call(deleteAccount, me);
    assert.deepEqual(await res.json(), { ok: true });

    assert.equal((await db.doc("circles/c1").get()).data().createdBy, "pal");
    assert.equal((await db.doc("circles/c1/members/pal").get()).data().isOwner, true);
    assert.equal((await db.doc("circles/c1/members/me").get()).exists, false);
    assert.equal((await db.doc("circles/c2/members/me").get()).exists, false);
    assert.deepEqual((await db.doc("circles/c1/polls/p").get()).data().activityPoll.votes, { pal: "B" });
    const pal = (await db.doc("users/pal").get()).data();
    assert.deepEqual(pal.connections, ["x"]);
    assert.deepEqual(pal.connectionRequests, []);
    assert.equal(pal.stats.connections, 1);
    const old = (await db.doc("users/old").get()).data();
    assert.deepEqual([old.friends, old.friendRequests.sent, old.stats.connections], [[], [], 0]);
    assert.equal((await db.doc("circleRequests/r1").get()).exists, false);
    assert.equal((await db.collection("users/me/notifications").get()).size, 0);
    assert.equal((await db.collection("users/me/private").get()).size, 0);
    assert.equal((await db.doc("users/me").get()).exists, false);
    await assert.rejects(auth.getUser("me"), { code: "auth/user-not-found" });
    assert.ok(cloudinaryCalls.includes("DELETE https://api.cloudinary.com/v1_1/demo-cloud/resources/image/upload?public_ids[]=avatars/me"));
});

test("a sole-member owner: the circle, its subcollections and its pending invitations are gone", async () => {
    const me = await makeUser("me");
    await db.doc("circles/solo").set({ createdBy: "me" });
    await member("solo", "me", { isOwner: true, isAdmin: true });
    await db.doc("circles/solo/chat/m").set({ text: "hi" });
    await db.doc("circles/solo/events/e").set({ status: "pending" });
    await db.doc("circleRequests/inv").set({ type: "invitation", circleId: "solo", inviterId: "me", invitedUserId: "z", status: "pending" });

    assert.deepEqual(await (await call(deleteAccount, me)).json(), { ok: true });
    assert.equal((await db.doc("circles/solo").get()).exists, false);
    assert.equal((await db.collection("circles/solo/chat").get()).size, 0);
    assert.equal((await db.collection("circles/solo/events").get()).size, 0);
    assert.equal((await db.doc("circleRequests/inv").get()).exists, false);
});

test("a failed step reports itself, and a retry resumes and finishes", async () => {
    const me = await makeUser("me");
    await db.doc("circles/c").set({ createdBy: "other" });
    await member("c", "me");
    const failed = await call(deleteAccount, me, { headers: { "x-test-fail-step": "memberships" } });
    assert.equal(failed.status, 500);
    assert.deepEqual(await failed.json(), { ok: false, failedStep: "memberships", retryable: true });
    assert.deepEqual((await db.doc("users/me/private/deletionJob").get()).data().done, ["ownedCircles", "votes"]);
    assert.ok((await db.doc("circles/c/members/me").get()).exists);

    assert.deepEqual(await (await call(deleteAccount, me)).json(), { ok: true });
    assert.equal((await db.doc("circles/c/members/me").get()).exists, false);
    assert.equal((await db.doc("users/me/private/deletionJob").get()).exists, false);
});

test("the forced-failure header does nothing outside test mode", async () => {
    const me = await makeUser("me");
    delete process.env.CIRCLE_TEST_MODE;
    try {
        assert.deepEqual(await (await call(deleteAccount, me, { headers: { "x-test-fail-step": "votes" } })).json(), { ok: true });
    } finally {
        process.env.CIRCLE_TEST_MODE = "1";
    }
});

test("delete-media removes the user's prefix in all three resource types plus URL assets", async () => {
    const me = await makeUser("me", { profile: {
        photoUrl: "https://res.cloudinary.com/demo-cloud/image/upload/c_fill,w_200/v17/legacy/pic.png",
        coverPhoto: "https://res.cloudinary.com/other-cloud/image/upload/v1/x.jpg",
    } });
    assert.deepEqual(await (await call(deleteMedia, me)).json(), { ok: true });
    const base = "DELETE https://api.cloudinary.com/v1_1/demo-cloud/resources";
    assert.deepEqual(cloudinaryCalls, [
        `${base}/image/upload?prefix=profile_images/me/`,
        `${base}/video/upload?prefix=profile_images/me/`,
        `${base}/raw/upload?prefix=profile_images/me/`,
        `${base}/image/upload?public_ids[]=legacy/pic`,
    ]);
    assert.ok((await db.doc("users/me").get()).exists); // media only
});

test("parseCloudinaryUrl keeps only our cloud's public ids", () => {
    assert.deepEqual(parseCloudinaryUrl("https://res.cloudinary.com/c/image/upload/v12/a/b.jpg", "c"), { type: "image", publicId: "a/b" });
    assert.deepEqual(parseCloudinaryUrl("https://res.cloudinary.com/c/video/upload/q_auto/v1/clip.mp4", "c"), { type: "video", publicId: "clip" });
    assert.deepEqual(parseCloudinaryUrl("https://res.cloudinary.com/c/raw/upload/v1/doc.pdf", "c"), { type: "raw", publicId: "doc.pdf" });
    assert.equal(parseCloudinaryUrl("https://res.cloudinary.com/x/image/upload/v1/a.jpg", "c"), null);
    assert.equal(parseCloudinaryUrl("https://example.com/a.jpg", "c"), null);
    assert.equal(parseCloudinaryUrl(undefined, "c"), null);
});
