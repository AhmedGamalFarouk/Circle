import { getFirestore, doc, setDoc, collection, getDoc, serverTimestamp } from "firebase/firestore";

export async function addMembersToCircle(circleId, creatorUid, creatorProfile, selectedMembers, user) {
    const db = getFirestore();
    const membersColRef = collection(db, "circles", circleId, "members");

    // Add creator as owner and admin
    await setDoc(doc(membersColRef, creatorUid), {
        email: creatorProfile.email || user.email,
        isOwner: true, // <-- new field
        isAdmin: true,
        username: creatorProfile.username || user.username || "",
        photoURL: creatorProfile.photoURL || creatorProfile.photoUrl || user.photoURL || "",
        // Same shape as mobile member docs
        userId: creatorUid,
        joinedAt: serverTimestamp(),
    });

    // Add selected members (not owner, not admin by default)
    for (const member of selectedMembers) {
        const memberUid = member.value;
        if (memberUid !== creatorUid) {
            let memberProfile = {};
            try {
                const memberDocRef = doc(db, "users", memberUid);
                const memberDocSnap = await getDoc(memberDocRef);
                if (memberDocSnap.exists()) {
                    memberProfile = memberDocSnap.data();
                }
            } catch (err) {
                console.error(`Error fetching member profile for ${memberUid}:`, err);
            }

            await setDoc(doc(membersColRef, memberUid), {
                email: memberProfile.email || "",
                isOwner: false, // <-- new field
                isAdmin: false,
                username: memberProfile.username || "",
                photoURL: memberProfile.photoURL || memberProfile.photoUrl || memberProfile.avatarPhoto || "",
                userId: memberUid,
                joinedAt: serverTimestamp(),
            });
        }
    }
}
