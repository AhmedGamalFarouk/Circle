import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFirestore, collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";

// Older web builds saved translated labels ("عام"/"خاص") and the misspelled
// "permenent". Mobile and the filters only understand the canonical values.
const LEGACY_PRIVACY = { "عام": "public", "خاص": "private" };
const normalizeCircleEnums = (data) => ({
    circlePrivacy: LEGACY_PRIVACY[data.circlePrivacy] || data.circlePrivacy,
    circleType: data.circleType === "flash" ? "flash" : data.circleType ? "permanent" : data.circleType,
});

// Fetch all circles
export const fetchCircles = createAsyncThunk(
    'circles/fetchCircles',
    async () => {
        const db = getFirestore();
        const circlesCol = collection(db, 'circles');
        const snapshot = await getDocs(circlesCol);

        return snapshot.docs
            .filter(doc => doc.exists())
            .map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    ...normalizeCircleEnums(data),
                    id: doc.id,
                    expiresAt: data.expiresAt && typeof data.expiresAt.toDate === "function"
                        ? data.expiresAt.toDate().toISOString()
                        : data.expiresAt || null,
                    updatedAt: data.updatedAt && typeof data.updatedAt.toDate === "function"
                        ? data.updatedAt.toDate().toISOString()
                        : data.updatedAt || null,
                    createdAt: data.createdAt && typeof data.createdAt.toDate === "function"
                        ? data.createdAt.toDate().toISOString()
                        : data.createdAt || null,
                };
            });
    }
);


export const fetchCircleById = createAsyncThunk(
    'circles/fetchCircleById',
    async (circleId) => {
        const db = getFirestore();
        const circleDoc = doc(db, 'circles', circleId);
        const snapshot = await getDoc(circleDoc);
        if (!snapshot.exists()) {
            throw new Error("Circle not found");
        }
        const data = snapshot.data();
        return {
            ...data,
            ...normalizeCircleEnums(data),
            id: snapshot.id,
            expiresAt: data.expiresAt?.toDate().toISOString() || null,
            createdAt: data.createdAt?.toDate()?.toISOString() || null,
        };
    }
);

export const listenToCircles = () => (dispatch) => {
    const db = getFirestore();
    const unsubscribe = onSnapshot(collection(db, "circles"), (snapshot) => {
        const circlesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                ...normalizeCircleEnums(data),
                id: doc.id,
                expiresAt: data.expiresAt && typeof data.expiresAt.toDate === "function"
                    ? data.expiresAt.toDate().toISOString()
                    : data.expiresAt || null,
                updatedAt: data.updatedAt && typeof data.updatedAt.toDate === "function"
                    ? data.updatedAt.toDate().toISOString()
                    : data.updatedAt || null,
                createdAt: data.createdAt && typeof data.createdAt.toDate === "function"
                    ? data.createdAt.toDate().toISOString()
                    : data.createdAt || null,
            };
        });
        dispatch(setCircles(circlesData));
    });
    return unsubscribe;
};

const circlesSlice = createSlice({
    name: "circles",
    initialState: {
        circles: [],
        status: 'idle',
        selectedCircle: null,
        selectedCircleStatus: 'idle',
        error: null,
    },
    reducers: {
        setSelectedCircle(state, action) {
            state.selectedCircle = action.payload;
        },
        setCircles(state, action) {
            state.circles = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchCircles
            .addCase(fetchCircles.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCircles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.circles = action.payload;
            })
            .addCase(fetchCircles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
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
export const { setSelectedCircle, setCircles } = circlesSlice.actions;
