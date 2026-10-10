import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import CirclesRequistsPresentational from "./CirclesRequestsPresentational";
import { useDispatch } from "react-redux";
import { fetchUserProfile } from "../../features/userProfile/profileSlice";

// Circles (from the user's joinedCircles) where they are owner or admin.
async function getAdminCircleIds(db, uid) {
    const profileSnap = await getDoc(doc(db, "users", uid));
    const joined = profileSnap.exists() ? profileSnap.data().joinedCircles || [] : [];
    const checks = await Promise.all(
        joined.map(async (circleId) => {
            const memberSnap = await getDoc(doc(db, "circles", circleId, "members", uid));
            const member = memberSnap.exists() ? memberSnap.data() : null;
            return member && (member.isAdmin || member.isOwner) ? circleId : null;
        }),
    );
    return checks.filter(Boolean);
}

function CirclesRequistsContainer() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const [requestType, setRequestType] = useState("join-request");
    const [actionLoading, setActionLoading] = useState({}); // { [id]: "accept" | "cancel" }

    useEffect(() => {
        async function fetchRequests() {
            if (!user) return;
            setLoading(true);
            const db = getFirestore();
            const pending = [where("status", "==", "pending"), where("type", "==", requestType)];
            try {
                let docs;
                if (requestType === "join-request") {
                    // Requests name the owner as approver, but every circle
                    // admin may decide them, so also look per admin circle.
                    const adminCircleIds = await getAdminCircleIds(db, user.uid);
                    const snapshots = await Promise.all([
                        getDocs(query(collection(db, "circleRequests"), where("approverId", "==", user.uid), ...pending)),
                        ...adminCircleIds.map((circleId) =>
                            getDocs(query(collection(db, "circleRequests"), where("circleId", "==", circleId), ...pending)),
                        ),
                    ]);
                    const byId = new Map();
                    snapshots.forEach((snap) => snap.docs.forEach((d) => byId.set(d.id, d)));
                    docs = [...byId.values()];
                } else {
                    const snapshot = await getDocs(
                        query(collection(db, "circleRequests"), where("invitedUserId", "==", user.uid), ...pending),
                    );
                    docs = snapshot.docs;
                }
                setRequests(docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error loading circle requests:", error);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        }
        fetchRequests();
    }, [user, requestType]);

    // Accept request
    async function handleAccept(requestId) {
        const db = getFirestore();
        const request = requests.find(r => r.id === requestId);
        if (!request) return;
        setActionLoading(prev => ({ ...prev, [requestId]: "accept" }));

        let memberId, memberData;
        if (requestType === "join-request") {
            memberId = request.requesterId;
            memberData = {
                email: request.requesterEmail,
                isAdmin: false,
                isOwner: false,
                photoUrl: request.requesterPhotoUrl,
                username: request.requesterUsername,
            };
        } else {
            memberId = request.invitedUserId;
            memberData = {
                email: request.invitedUserEmail,
                isAdmin: false,
                isOwner: false,
                photoUrl: request.invitedUserPhotoUrl,
                username: request.invitedUserUsername,
                // The rules only let you add yourself by naming the pending
                // invitation you were sent.
                invitationId: request.id,
            };
        }
        // Mobile finds members by userId.
        memberData.userId = memberId;
        memberData.joinedAt = new Date();

        const circleRef = doc(db, "circles", request.circleId);
        const circleSnap = await getDoc(circleRef);

        if (circleSnap.exists()) {
            await setDoc(
                doc(circleRef, "members", memberId),
                memberData
            );
        } else {
            console.warn("Circle does not exist, cannot add member.");
        }
        // Update request status
        const requestRef = doc(db, "circleRequests", requestId);
        await updateDoc(requestRef, { status: "accepted" });

        // Update joinedCircles for the user
        const userRef = doc(db, "users", memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const joinedCircles = userData.joinedCircles || [];
            if (!joinedCircles.includes(request.circleId)) {
                await updateDoc(userRef, {
                    joinedCircles: [...joinedCircles, request.circleId]
                });
            }
        }

        await deleteDoc(requestRef);


        setRequests(prev => prev.filter(req => req.id !== requestId));
        dispatch(fetchUserProfile(user.uid));
        setActionLoading(prev => ({ ...prev, [requestId]: undefined }));
    }

    // Cancel request
    async function handleCancel(requestId) {
        const db = getFirestore();
        const requestRef = doc(db, "circleRequests", requestId);
        await deleteDoc(requestRef);
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setActionLoading(prev => ({ ...prev, [requestId]: undefined }));
    }

    return (
        <CirclesRequistsPresentational
            requests={requests}
            loading={loading}
            onAccept={handleAccept}
            onCancel={handleCancel}
            requestType={requestType}
            setRequestType={setRequestType}
            actionLoading={actionLoading}
        />
    );
}

export default CirclesRequistsContainer;
