// Mobile writes media to `mediaUrl` and never sets `sentTime`, while web
// reads `imageUrl` / `videoUrl` / `sentTime`. Fill the gaps so messages sent
// from either app render the same here.
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
