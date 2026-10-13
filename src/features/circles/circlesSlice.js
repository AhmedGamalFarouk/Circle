import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getFirestore, collection, collectionGroup, getDocs, doc, getDoc, onSnapshot,
    query, where, orderBy, limit, startAfter,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { normalizeCircle } from "../../shared/schema.mjs";
import { clearUserInfo } from "../user/userSlice";

export const PUBLIC_PAGE_SIZE = 24;

const isoOrRaw = (value) =>
    value && typeof value.toDate === "function" ? value.toDate().toISOString() : value || null;

function toCircle(snap) {
    const data = snap.data();
    return {
        ...normalizeCircle(data),
        id: snap.id,
        expiresAt: isoOrRaw(data.expiresAt),
        updatedAt: isoOrRaw(data.updatedAt),
        createdAt: isoOrRaw(data.createdAt),
    };
}

const myMembersQuery = (uid) =>
    query(collectionGroup(getFirestore(), "members"), where("userId", "==", uid));

// ponytail: the public-page cursor is a DocumentSnapshot (not serializable), so it
// lives here instead of Redux. Reset by fetchPublicCircles and resetCircles.
let publicCursor = null;
// Joined and public loads can overlap (listener + mutations, refresh + load more);
// only the latest request's result is applied.
let joinedRequest = 0;
let publicRequest = 0;

// Re-reads the circle docs for the current joinedIds. The membership listener
// (listenToMyMemberships) keeps joinedIds current; before it has delivered, this
// runs the member query itself. Name kept for the existing mutation callers.
export const fetchCircles = createAsyncThunk(
    "circles/fetchCircles",
    async (_, { getState }) => {
        const request = ++joinedRequest;
        const uid = getAuth().currentUser?.uid;
        if (!uid) return { request, circles: [], joinedIds: [] };

        let { joinedIds, joinedIdsLoaded } = getState().circles;
        if (!joinedIdsLoaded) {
            const snap = await getDocs(myMembersQuery(uid));
            joinedIds = snap.docs.map((d) => d.ref.parent.parent.id);
        }
        const db = getFirestore();
        // A deleted circle or one we can no longer read must not fail the rest.
        const circles = await Promise.all(joinedIds.map(async (id) => {
            try {
                const snap = await getDoc(doc(db, "circles", id));
                return snap.exists() ? toCircle(snap) : null;
            } catch {
                return null;
            }
        }));
        return { request, circles: circles.filter(Boolean), joinedIds };
    }
);

export const fetchPublicCircles = createAsyncThunk(
    "circles/fetchPublicCircles",
    async () => {
        const request = ++publicRequest;
        publicCursor = null;
        const snap = await getDocs(query(
            collection(getFirestore(), "circles"),
            where("circlePrivacy", "==", "public"),
            orderBy("createdAt", "desc"),
            limit(PUBLIC_PAGE_SIZE),
        ));
        if (request === publicRequest && snap.docs.length) publicCursor = snap.docs[snap.docs.length - 1];
        return { request, page: snap.docs.map(toCircle), hasMore: snap.docs.length === PUBLIC_PAGE_SIZE };
    }
);

export const fetchMorePublicCircles = createAsyncThunk(
    "circles/fetchMorePublicCircles",
    async () => {
        const request = publicRequest;
        const snap = await getDocs(query(
            collection(getFirestore(), "circles"),
            where("circlePrivacy", "==", "public"),
            orderBy("createdAt", "desc"),
            startAfter(publicCursor),
            limit(PUBLIC_PAGE_SIZE),
        ));
        if (request === publicRequest && snap.docs.length) publicCursor = snap.docs[snap.docs.length - 1];
        return { request, page: snap.docs.map(toCircle), hasMore: snap.docs.length === PUBLIC_PAGE_SIZE };
    },
    {
        condition: (_, { getState }) => {
            const { loadingMore, hasMorePublic, publicStatus } = getState().circles;
            return !loadingMore && hasMorePublic && publicStatus === "succeeded" && !!publicCursor;
        },
    }
);

export const fetchCircleById = createAsyncThunk(
    'circles/fetchCircleById',
    async (circleId) => {
        const snapshot = await getDoc(doc(getFirestore(), 'circles', circleId));
        if (!snapshot.exists()) {
            throw new Error("Circle not found");
        }
        return toCircle(snapshot);
    }
);

// Live list of the circles the user is in: being added to or removed from a
// circle shows up without a reload. Returns the unsubscribe function.
export const listenToMyMemberships = (uid) => (dispatch) =>
    onSnapshot(
        myMembersQuery(uid),
        (snapshot) => {
            dispatch(setJoinedIds(snapshot.docs.map((d) => d.ref.parent.parent.id)));
            dispatch(fetchCircles());
        },
        (error) => {
            console.error("Membership listener failed:", error);
            dispatch(fetchCircles());
        }
    );

const initialState = {
    // Union of joined and loaded public circles, deduped; what most screens read.
    circles: [],
    joinedCircles: [],
    joinedIds: [],
    joinedIdsLoaded: false,
    status: 'idle',          // joined circles
    listError: null,         // 'joined' | null
    publicPages: [],         // one array per fetched page, in fetch order
    publicStatus: 'idle',
    publicError: null,       // 'public' | null
    hasMorePublic: false,
    loadingMore: false,
    loadMoreError: null,     // 'more' | null
    selectedCircle: null,
    selectedCircleStatus: 'idle',
    error: null,             // fetchCircleById only
};

function rebuildUnion(state) {
    const seen = new Set();
    state.circles = [...state.joinedCircles, ...state.publicPages.flat()].filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });
}

function resetState() {
    publicCursor = null;
    joinedRequest++;
    publicRequest++;
    return initialState;
}

const circlesSlice = createSlice({
    name: "circles",
    initialState,
    reducers: {
        setSelectedCircle(state, action) {
            state.selectedCircle = action.payload;
        },
        setJoinedIds(state, action) {
            state.joinedIds = action.payload;
            state.joinedIdsLoaded = true;
        },
        resetCircles: resetState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(clearUserInfo, resetState)

            // Joined circles. Background refreshes (listener, mutations) keep the
            // current list on screen instead of going back to 'loading'.
            .addCase(fetchCircles.pending, (state) => {
                if (state.status !== 'succeeded') state.status = 'loading';
            })
            .addCase(fetchCircles.fulfilled, (state, action) => {
                const { request, circles, joinedIds } = action.payload;
                if (request !== joinedRequest) return;
                state.status = 'succeeded';
                state.listError = null;
                state.joinedCircles = circles;
                state.joinedIds = joinedIds;
                rebuildUnion(state);
            })
            .addCase(fetchCircles.rejected, (state) => {
                state.status = 'failed';
                state.listError = 'joined';
            })

            // Public circles, first page.
            .addCase(fetchPublicCircles.pending, (state) => {
                if (state.publicStatus !== 'succeeded') state.publicStatus = 'loading';
                state.loadingMore = false;
                state.loadMoreError = null;
            })
            .addCase(fetchPublicCircles.fulfilled, (state, action) => {
                const { request, page, hasMore } = action.payload;
                if (request !== publicRequest) return;
                state.publicStatus = 'succeeded';
                state.publicError = null;
                state.publicPages = [page];
                state.hasMorePublic = hasMore;
                rebuildUnion(state);
            })
            .addCase(fetchPublicCircles.rejected, (state) => {
                state.publicStatus = 'failed';
                state.publicError = 'public';
            })

            // Public circles, next page.
            .addCase(fetchMorePublicCircles.pending, (state) => {
                state.loadingMore = true;
                state.loadMoreError = null;
            })
            .addCase(fetchMorePublicCircles.fulfilled, (state, action) => {
                const { request, page, hasMore } = action.payload;
                state.loadingMore = false;
                if (request !== publicRequest) return;
                state.publicPages.push(page);
                state.hasMorePublic = hasMore;
                rebuildUnion(state);
            })
            // Keeps the cursor and hasMorePublic, so the button works as Retry.
            .addCase(fetchMorePublicCircles.rejected, (state) => {
                state.loadingMore = false;
                state.loadMoreError = 'more';
            })

            //  fetchCircleById
            // Tracked apart from the list status so a missing circle doesn't
            // look like a failed list load (and vice versa).
            .addCase(fetchCircleById.pending, (state) => {
                state.selectedCircleStatus = 'loading';
                state.error = null;
                state.selectedCircle = null;
            })
            .addCase(fetchCircleById.fulfilled, (state, action) => {
                state.selectedCircleStatus = 'succeeded';
                state.selectedCircle = action.payload;
            })
            .addCase(fetchCircleById.rejected, (state, action) => {
                state.selectedCircleStatus = 'failed';
                state.error = action.error.message;
            });
    },
});

export default circlesSlice.reducer;
export const { setSelectedCircle, setJoinedIds, resetCircles } = circlesSlice.actions;
