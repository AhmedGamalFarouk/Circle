// Caller checks shared by the user-facing routes (SPEC B1). Routes call
// verifyCaller(request, options) and turn a thrown HttpError into its status.
import { getAuth } from "firebase-admin/auth";
import { getDb } from "./admin.js";

// Same account as src/utils/demoAccount.js; store reviewers use it, so routes
// that destroy data refuse it.
export const DEMO_EMAIL = "demo@circle-26a87.firebaseapp.com";

export class HttpError extends Error {
    constructor(status, code) {
        super(code);
        this.status = status;
        this.code = code;
    }
}

export const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Returns the decoded ID token. Throws HttpError:
//   401 "no-token" / "bad-token": missing, forged, expired or revoked token
//   401 "reauth": signed in more than maxAuthAgeSec ago (sensitive routes)
//   403 "demo": the demo account, when refuseDemo is set
export async function verifyCaller(request, { maxAuthAgeSec, refuseDemo = false } = {}) {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "no-token");
    let decoded;
    try {
        getDb(); // initializes the Admin app
        decoded = await getAuth().verifyIdToken(token);
    } catch {
        throw new HttpError(401, "bad-token");
    }
    // Stale sign-in first: the client's answer to both is to sign in again.
    if (maxAuthAgeSec && Date.now() / 1000 - decoded.auth_time > maxAuthAgeSec) {
        throw new HttpError(401, "reauth");
    }
    try {
        await getAuth().verifyIdToken(token, true); // revoked tokens / disabled users
    } catch {
        throw new HttpError(401, "bad-token");
    }
    if (refuseDemo && decoded.email === DEMO_EMAIL) throw new HttpError(403, "demo");
    return decoded;
}
