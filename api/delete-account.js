// POST /api/delete-account (SPEC C1). The client re-authenticates first, then
// calls this with its fresh ID token and, optionally, who should own each circle
// it owns: { newOwners: { [circleId]: uid } }. Missing choices fall back to an
// admin, then the longest-standing member.
//
// Progress lives in users/{uid}/private/deletionJob, so a retry after a timeout or
// a failed step resumes where it stopped. Every step is safe to run twice.
// Answers { ok: true } or { ok: false, failedStep, retryable }.
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./_lib/admin.js";
import { HttpError, json, verifyCaller } from "./_lib/auth.js";
import { deleteUserMedia } from "./_lib/cloudinary.js";

export const STEPS = ["ownedCircles", "votes", "memberships", "relationships", "requests", "media", "profile", "auth"];

const REAUTH_SECONDS = 300;
const memberUid = (doc) => doc.data().userId || doc.id;
const owns = (entry, uid) => entry === uid || (entry && typeof entry === "object" && entry.uid === uid);

// Pick the next owner: the client's choice if still a member, else an admin, else the earliest joiner.
function pickOwner(others, choice) {
    if (choice && others.some((m) => memberUid(m) === choice)) return choice;
    const byJoin = [...others].sort((a, b) =>
        (a.data().joinedAt?.toMillis?.() ?? 0) - (b.data().joinedAt?.toMillis?.() ?? 0));
    return memberUid(byJoin.find((m) => m.data().isAdmin || m.data().isOwner) || byJoin[0]);
}

const RUN = {
    // 1. Hand owned circles to another member, or delete them when nobody else is left.
    async ownedCircles(db, uid, job) {
        for (const circleId of job.circleIds) {
            const circleRef = db.doc(`circles/${circleId}`);
            const circle = await circleRef.get();
            if (!circle.exists) continue;
            const members = (await circleRef.collection("members").get()).docs;
            const mine = members.find((m) => memberUid(m) === uid);
            const isOwner = circle.data().createdBy === uid || mine?.data().isOwner === true;
            if (!isOwner) continue;
            const others = members.filter((m) => memberUid(m) !== uid);
            if (others.length) {
                const next = pickOwner(others, job.newOwners?.[circleId]);
                const nextDoc = others.find((m) => memberUid(m) === next);
                const batch = db.batch();
                batch.update(circleRef, { createdBy: next });
                batch.update(nextDoc.ref, { isOwner: true, isAdmin: true });
                if (mine) batch.update(mine.ref, { isOwner: false, isAdmin: false });
                await batch.commit();
            } else {
                const pending = await db.collection("circleRequests").where("circleId", "==", circleId).get();
                for (const r of pending.docs) await r.ref.delete();
                await db.recursiveDelete(circleRef);
            }
        }
    },

    // 2. Take the user's votes out of every sub-poll in the circles that remain.
    async votes(db, uid, job) {
        for (const circleId of job.circleIds) {
            const polls = await db.collection(`circles/${circleId}/polls`).get();
            for (const poll of polls.docs) {
                const update = {};
                for (const sub of ["activityPoll", "placePoll"]) {
                    if (poll.data()[sub]?.votes?.[uid] !== undefined) update[`${sub}.votes.${uid}`] = FieldValue.delete();
                }
                if (Object.keys(update).length) await poll.ref.update(update);
            }
        }
    },

    // 3. Leave every circle that still exists.
    async memberships(db, uid, job) {
        for (const circleId of job.circleIds) {
            const mine = await db.collection(`circles/${circleId}/members`).where("userId", "==", uid).get();
            for (const m of mine.docs) await m.ref.delete();
            await db.doc(`circles/${circleId}/members/${uid}`).delete();
        }
    },

    // 4. Remove the user from everyone else's relationship fields, all shapes.
    // ponytail: full users scan, fine at current scale; index connections if it grows.
    async relationships(db, uid) {
        const users = await db.collection("users").get();
        for (const user of users.docs) {
            if (user.id === uid) continue;
            const d = user.data();
            const update = {};
            let lostConnection = false;
            for (const field of ["connections", "connectionRequests", "friends"]) {
                if (!Array.isArray(d[field])) continue;
                const kept = d[field].filter((e) => !owns(e, uid));
                if (kept.length !== d[field].length) {
                    update[field] = kept;
                    if (field !== "connectionRequests") lostConnection = true;
                }
            }
            const fr = d.friendRequests;
            if (Array.isArray(fr) && fr.some((e) => owns(e, uid))) update.friendRequests = fr.filter((e) => !owns(e, uid));
            for (const half of ["sent", "received"]) {
                if (fr && !Array.isArray(fr) && Array.isArray(fr[half]) && fr[half].some((e) => owns(e, uid))) {
                    update[`friendRequests.${half}`] = fr[half].filter((e) => !owns(e, uid));
                }
            }
            if (lostConnection && (d.stats?.connections ?? 0) > 0) update["stats.connections"] = FieldValue.increment(-1);
            if (Object.keys(update).length) await user.ref.update(update);
        }
    },

    // 5. The user's own join requests / invitations, and their notifications.
    async requests(db, uid) {
        for (const field of ["requesterId", "invitedUserId", "userId"]) {
            const rs = await db.collection("circleRequests").where(field, "==", uid).get();
            for (const r of rs.docs) await r.ref.delete();
        }
        await db.recursiveDelete(db.collection(`users/${uid}/notifications`));
    },

    // 6. Profile media on Cloudinary (C2).
    async media(db, uid) {
        const profile = (await db.doc(`users/${uid}`).get()).data();
        await deleteUserMedia(uid, profile || {});
    },

    // 7. Private docs (except this job) and the profile itself.
    async profile(db, uid) {
        const privateDocs = await db.collection(`users/${uid}/private`).get();
        for (const p of privateDocs.docs) if (p.id !== "deletionJob") await db.recursiveDelete(p.ref);
        await db.doc(`users/${uid}`).delete();
    },

    // 8. The sign-in account. Already gone counts as done.
    async auth(db, uid) {
        await getAuth().deleteUser(uid).catch((e) => {
            if (e.code !== "auth/user-not-found") throw e;
        });
    },
};

// Test-only: make a step fail on demand (never active outside the emulators).
function forcedFailure(request) {
    if (process.env.CIRCLE_TEST_MODE !== "1" || !process.env.FIRESTORE_EMULATOR_HOST) return null;
    return request.headers.get("x-test-fail-step");
}

export async function POST(request) {
    let caller;
    try {
        caller = await verifyCaller(request, { maxAuthAgeSec: REAUTH_SECONDS, refuseDemo: true });
    } catch (e) {
        if (e instanceof HttpError) return json({ ok: false, error: e.code }, e.status);
        throw e;
    }
    const uid = caller.uid;
    const body = await request.json().catch(() => ({}));
    const db = getDb();
    const jobRef = db.doc(`users/${uid}/private/deletionJob`);

    // Step 0: record which circles to clean up, so later steps don't depend on
    // member docs that earlier steps delete.
    let job = (await jobRef.get()).data();
    if (!job) {
        const memberships = await db.collectionGroup("members").where("userId", "==", uid).get();
        const created = await db.collection("circles").where("createdBy", "==", uid).get();
        const circleIds = [...new Set([
            ...memberships.docs.map((m) => m.ref.parent.parent.id),
            ...created.docs.map((c) => c.id),
        ])];
        job = { circleIds, newOwners: body.newOwners || {}, done: [], startedAt: FieldValue.serverTimestamp() };
        await jobRef.set(job);
    }

    const failAt = forcedFailure(request);
    for (const step of STEPS) {
        if (job.done.includes(step)) continue;
        try {
            if (failAt === step) throw new Error(`forced failure at ${step}`);
            await RUN[step](db, uid, job);
        } catch (e) {
            console.error(`delete-account ${uid}: ${step} failed:`, e.message);
            return json({ ok: false, failedStep: step, retryable: true }, 500);
        }
        job.done.push(step);
        if (step !== "auth") await jobRef.update({ done: FieldValue.arrayUnion(step) });
    }
    // 9. The job doc goes last; the Auth user is already gone, so nothing can retry after this.
    await jobRef.delete().catch(() => {});
    return json({ ok: true });
}
