// Deletes a user's profile media from Cloudinary (SPEC C2) through the Admin
// REST API. Chat media (chat_media/{circleId}) and circle covers stay with the circle.
// Vercel env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.

const RESOURCE_TYPES = ["image", "video", "raw"];

// "https://res.cloudinary.com/<cloud>/image/upload/c_fill,w_200/v123/profile_images/u1/abc.jpg"
// -> { type: "image", publicId: "profile_images/u1/abc" }. Other hosts and clouds -> null.
export function parseCloudinaryUrl(url, cloudName) {
    const m = typeof url === "string"
        && url.match(/^https?:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video|raw)\/upload\/(.+)$/);
    if (!m || m[1] !== cloudName) return null;
    // Drop transformation segments and the version, keep the public id.
    const parts = m[3].split("/");
    const v = parts.findIndex((p) => /^v\d+$/.test(p));
    const rest = (v >= 0 ? parts.slice(v + 1) : parts.filter((p) => !p.includes(","))).join("/");
    if (!rest) return null;
    // Raw files keep their extension in the public id; images and videos don't.
    const publicId = m[2] === "raw" ? rest : rest.replace(/\.[^./]+$/, "");
    return { type: m[2], publicId: decodeURIComponent(publicId) };
}

export async function deleteUserMedia(uid, profile = {}, fetchImpl = fetch) {
    const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
    if (!cloud || !key || !secret) {
        // Local emulator runs (e2e) have no Cloudinary account; production must.
        if (process.env.FIRESTORE_EMULATOR_HOST) return;
        throw new Error("Cloudinary credentials are not set.");
    }
    const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
    const base = `https://api.cloudinary.com/v1_1/${cloud}/resources`;
    const call = async (url) => {
        const res = await fetchImpl(url, { method: "DELETE", headers: { authorization: auth } });
        if (!res.ok) throw new Error(`Cloudinary ${res.status} for ${url}`);
    };

    // Everything uploaded under the user's folder (trailing slash: never another uid's prefix).
    for (const type of RESOURCE_TYPES) {
        await call(`${base}/${type}/upload?prefix=${encodeURIComponent(`profile_images/${uid}/`)}`);
    }
    // Profile photos uploaded elsewhere (older uploads), by the ids in their URLs.
    const urls = [profile.photoUrl, profile.photoURL, profile.avatarPhoto, profile.coverPhoto];
    const byType = {};
    for (const url of urls) {
        const asset = parseCloudinaryUrl(url, cloud);
        if (asset) (byType[asset.type] ||= new Set()).add(asset.publicId);
    }
    for (const [type, ids] of Object.entries(byType)) {
        const query = [...ids].map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&");
        await call(`${base}/${type}/upload?${query}`);
    }
}
