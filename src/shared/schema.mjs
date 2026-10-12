// Shared data shapes for the Circle web and mobile apps.
//
// Web (WEB/Circle/src/shared/schema.mjs) is the source of truth. Mobile keeps a
// byte-for-byte copy plus the web commit it came from; its CI fails if they
// differ. To change this file: merge the web PR first, then open a mobile PR
// that copies the file and bumps the SHA. Plain ESM with no imports, so Vite,
// React Native and Node all load it. To add a field: document it below, read it
// through a normalizer here, and add a case to schema.test.mjs.
//
// Canonical shapes (what new code writes):
//   user       connections: [uid]
//              connectionRequests: [{uid, email, username, sentAt}]  (incoming)
//              age: number (dateOfBirth lives in users/{uid}/private/profile)
//   circle     circlePrivacy: "public" | "private"; circleType: "flash" | "permanent"
//   poll       activityPoll / placePoll: {question, options, deadline, votes: {uid: optionText}}
//   message    timeStamp, mediaUrl or imageUrl/videoUrl/audioUrl, react
//
// Legacy shapes the readers still accept (old mobile builds keep writing them):
//   user       friends: [uid]; friendRequests: {sent, received} or [..];
//              request entries as plain uid strings; public dateOfBirth
//   circle     circlePrivacy "عام"/"خاص" (old web) or missing (= public)
//   message    mobile mediaUrl, reactions, messageType "voice", no sentTime

// ---------- messages ----------

// Mobile writes media to `mediaUrl` and never sets `sentTime`, while web
// reads `imageUrl` / `videoUrl` / `sentTime`. Fill the gaps so messages sent
// from either app render the same.
const formatSentTime = (timeStamp) => {
    const date = timeStamp?.toDate ? timeStamp.toDate() : null;
    if (!date) return undefined;
    return date
        .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        .replace(/\./g, "");
};

// Web stores reactions in `react`, mobile in `reactions` (same shape).
const mergeReactions = (a = [], b = []) => {
    const seen = new Set();
    return [...a, ...b].filter((r) => {
        const key = `${r?.userId}-${r?.emoji}`;
        if (!r || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export function normalizeMessage(msg) {
    return {
        ...msg,
        react: mergeReactions(msg.react, msg.reactions),
        imageUrl: msg.imageUrl || (msg.messageType === "image" ? msg.mediaUrl : undefined),
        videoUrl: msg.videoUrl || (msg.messageType === "video" ? msg.mediaUrl : undefined),
        audioUrl: msg.audioUrl || (msg.messageType === "audio" || msg.messageType === "voice" ? msg.mediaUrl : undefined),
        messageType: msg.messageType === "voice" ? "audio" : msg.messageType,
        sentTime: msg.sentTime || formatSentTime(msg.timeStamp),
    };
}

// ---------- circles ----------

const LEGACY_PRIVACY = { "عام": "public", "خاص": "private" };

export function normalizeCircle(data) {
    return {
        ...data,
        circlePrivacy: LEGACY_PRIVACY[data.circlePrivacy] || data.circlePrivacy || "public",
        // Older web builds also saved the misspelled "permenent".
        circleType: data.circleType === "flash" ? "flash" : data.circleType ? "permanent" : data.circleType,
    };
}

// ---------- users ----------

const toRequest = (entry) => (typeof entry === "string" ? { uid: entry } : entry);

const uniqueBy = (items, key) => {
    const seen = new Set();
    return items.filter((item) => {
        const k = key(item);
        if (k == null || seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

const toDate = (value) => (value?.toDate ? value.toDate() : value ? new Date(value) : null);

export function ageFrom(dateOfBirth, now = new Date()) {
    const dob = toDate(dateOfBirth);
    if (!dob || Number.isNaN(dob.getTime())) return null;
    let age = now.getFullYear() - dob.getFullYear();
    const birthdayPassed =
        now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
    return birthdayPassed ? age : age - 1;
}

// Merges mobile's `friends` / `friendRequests` into web's `connections` /
// `connectionRequests`. When both exist, the result is their union by uid.
export function normalizeUser(data, now = new Date()) {
    const legacyRequests = Array.isArray(data.friendRequests)
        ? data.friendRequests
        : data.friendRequests?.received || [];
    return {
        ...data,
        connections: [...new Set([...(data.connections || []), ...(data.friends || [])])],
        connectionRequests: uniqueBy(
            [...(data.connectionRequests || []), ...legacyRequests].map(toRequest),
            (r) => r?.uid
        ),
        age: data.age ?? ageFrom(data.dateOfBirth, now),
    };
}

// ---------- polls ----------

// votes: {uid: optionText}; non-string values are ignored. Ties go to the
// option counted last.
export function getWinningOption(votes) {
    if (!votes || Object.keys(votes).length === 0) return null;
    const counts = Object.values(votes).reduce((acc, opt) => {
        if (typeof opt === "string" && opt) acc[opt] = (acc[opt] || 0) + 1;
        return acc;
    }, {});
    const options = Object.keys(counts);
    if (options.length === 0) return null;
    return options.reduce((a, b) => (counts[a] > counts[b] ? a : b));
}
