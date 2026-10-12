// Daily cleanup (SPEC B3), scheduled in vercel.json. Vercel sends
// "Authorization: Bearer $CRON_SECRET"; anything else gets 401.
// Every step is safe to re-run, so a run that stops halfway is finished the next day.
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./_lib/admin.js";
import { getWinningOption, isFlashExpired } from "../src/shared/schema.mjs";

// Same stage names and messages as the apps' "end voting" (CircleScreen.jsx).
const SUB_POLLS = [
    { key: "activityPoll", open: "Planning the Activity", closed: "Activity Poll Closed", field: "winningActivity", message: (w) => `📊 Activity poll closed! "${w}" won.` },
    { key: "placePoll", open: "Planning the Place", closed: "Place Poll Closed", field: "winningPlace", message: (w) => `📍 Place poll closed! "${w}" won.` },
];

async function deleteFlashCircle(db, circle) {
    const members = await circle.ref.collection("members").get();
    for (const member of members.docs) {
        await db.doc(`users/${member.data().userId || member.id}`)
            .update({ joinedCircles: FieldValue.arrayRemove(circle.id) })
            .catch(() => {}); // profile already gone
    }
    const invites = await db.collection("circleRequests").where("circleId", "==", circle.id).where("status", "==", "pending").get();
    for (const invite of invites.docs) await invite.ref.delete();
    await db.recursiveDelete(circle.ref);
}

async function closeExpiredPolls(db, circle, now) {
    let closed = 0;
    const polls = await circle.ref.collection("polls").get();
    for (const poll of polls.docs) {
        const data = poll.data();
        if (data.archived) continue;
        const sub = SUB_POLLS.find((s) => data.stage === s.open);
        const deadline = sub && data[sub.key]?.deadline?.toDate?.();
        if (!deadline || deadline > now) continue;
        const winner = getWinningOption(data[sub.key].votes);
        // With no votes there is no result to write; the apps already show the poll as closed.
        if (!winner) continue;
        await poll.ref.update({ stage: sub.closed, [sub.field]: winner });
        await circle.ref.collection("chat").add({
            messageType: "system", text: sub.message(winner),
            timestamp: FieldValue.serverTimestamp(), timeStamp: FieldValue.serverTimestamp(),
        });
        closed++;
    }
    return closed;
}

export async function GET(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
        return new Response("Unauthorized", { status: 401 });
    }
    const db = getDb();
    const now = new Date();
    let deleted = 0, closed = 0;
    // shortcut: full scan, fine at a few hundred circles; add a collection-group index past that
    const circles = await db.collection("circles").get();
    for (const circle of circles.docs) {
        if (isFlashExpired(circle.data(), now)) {
            await deleteFlashCircle(db, circle);
            deleted++;
        } else {
            closed += await closeExpiredPolls(db, circle, now);
        }
    }
    console.log(`cron: deleted ${deleted} expired flash circles, closed ${closed} polls`);
    return Response.json({ deletedFlashCircles: deleted, closedPolls: closed });
}
