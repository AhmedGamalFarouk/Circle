// POST /api/delete-media (SPEC C2): deletes the caller's profile media on
// Cloudinary. /api/delete-account runs the same code as its step 6.
import { getDb } from "./_lib/admin.js";
import { HttpError, json, verifyCaller } from "./_lib/auth.js";
import { deleteUserMedia } from "./_lib/cloudinary.js";

export async function POST(request) {
    let caller;
    try {
        caller = await verifyCaller(request, { refuseDemo: true });
    } catch (e) {
        if (e instanceof HttpError) return json({ ok: false, error: e.code }, e.status);
        throw e;
    }
    try {
        const profile = (await getDb().doc(`users/${caller.uid}`).get()).data();
        await deleteUserMedia(caller.uid, profile || {});
        return json({ ok: true });
    } catch (e) {
        console.error(`delete-media ${caller.uid}:`, e.message);
        return json({ ok: false, error: "cloudinary" }, 502);
    }
}
