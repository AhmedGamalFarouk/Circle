// Runs api/cron.js against the Firestore emulator: npm run test:api
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "./_lib/admin.js";
import { GET } from "./cron.js";

process.env.CRON_SECRET = "test-secret";
const call = (auth) => GET(new Request("http://localhost/api/cron", { headers: auth ? { authorization: auth } : {} }));
const ago = (h) => Timestamp.fromMillis(Date.now() - h * 3600e3);
const db = getDb();

beforeEach(async () => {
    for (const c of ["circles", "users", "circleRequests"]) await db.recursiveDelete(db.collection(c));
    // Expired flash circle with a member, a message and a pending invitation.
    await db.doc("circles/flash").set({ circleType: "flash", expiresAt: ago(1) });
    await db.doc("circles/flash/members/u1").set({ userId: "u1" });
    await db.doc("circles/flash/chat/m1").set({ text: "hi" });
    await db.doc("users/u1").set({ joinedCircles: ["flash", "keep"] });
    await db.doc("circleRequests/r1").set({ circleId: "flash", status: "pending" });
    await db.doc("circleRequests/r2").set({ circleId: "keep", status: "pending" });
    // Live circle: one expired activity poll with votes, one without votes, one not due yet.
    await db.doc("circles/keep").set({ circleType: "permanent" });
    await db.doc("circles/keep/polls/due").set({ stage: "Planning the Activity", activityPoll: { deadline: ago(1), votes: { a: "Cinema", b: "Cinema", c: "Bowling" } } });
    await db.doc("circles/keep/polls/novotes").set({ stage: "Planning the Activity", activityPoll: { deadline: ago(1), votes: {} } });
    await db.doc("circles/keep/polls/later").set({ stage: "Planning the Place", placePoll: { deadline: ago(-1), votes: { a: "Park" } } });
});

test("answers 401 even when no service account is configured (production before env setup)", () => {
    const env = { ...process.env, CRON_SECRET: "s" };
    delete env.FIRESTORE_EMULATOR_HOST;
    delete env.FIREBASE_SERVICE_ACCOUNT;
    const out = execFileSync("node", ["--input-type=module", "-e",
        `const { GET } = await import(${JSON.stringify(new URL("./cron.js", import.meta.url).href)});
         console.log((await GET(new Request("http://x/api/cron"))).status);`], { env, encoding: "utf8" });
    assert.equal(out.trim(), "401");
});

test("refuses calls without the cron secret", async () => {
    assert.equal((await call()).status, 401);
    assert.equal((await call("Bearer wrong")).status, 401);
    assert.ok((await db.doc("circles/flash").get()).exists);
});

test("deletes expired flash circles and closes due polls, once", async () => {
    const res = await call("Bearer test-secret");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { deletedFlashCircles: 1, closedPolls: 1 });

    assert.equal((await db.doc("circles/flash").get()).exists, false);
    assert.equal((await db.doc("circles/flash/chat/m1").get()).exists, false);
    assert.deepEqual((await db.doc("users/u1").get()).data().joinedCircles, ["keep"]);
    assert.equal((await db.doc("circleRequests/r1").get()).exists, false);
    assert.ok((await db.doc("circleRequests/r2").get()).exists);

    const due = (await db.doc("circles/keep/polls/due").get()).data();
    assert.equal(due.stage, "Activity Poll Closed");
    assert.equal(due.winningActivity, "Cinema");
    assert.equal((await db.doc("circles/keep/polls/novotes").get()).data().stage, "Planning the Activity");
    assert.equal((await db.doc("circles/keep/polls/later").get()).data().stage, "Planning the Place");
    const chat = await db.collection("circles/keep/chat").get();
    assert.deepEqual(chat.docs.map((d) => d.data().text), ['📊 Activity poll closed! "Cinema" won.']);

    // A second run finds nothing left to do.
    assert.deepEqual(await (await call("Bearer test-secret")).json(), { deletedFlashCircles: 0, closedPolls: 0 });
    assert.equal((await db.collection("circles/keep/chat").get()).size, 1);
});
