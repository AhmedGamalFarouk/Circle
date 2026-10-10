// firebase/profileFunctions.js
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase-config";

export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profileData,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      // Keep the mobile avatar field in sync
      ...(updates.photoUrl !== undefined ? { avatarPhoto: updates.photoUrl || "" } : {}),
      // The rules only let other users touch relationship fields on a
      // profile (connections, joinedCircles...), so only stamp our own.
      ...(auth.currentUser?.uid === userId ? { updatedAt: new Date() } : {}),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    // Callers revert optimistic UI on failure, so don't swallow it.
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  if (!userId) throw new Error("No userId provided to getUserProfile");

  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Accounts created on mobile store the avatar in avatarPhoto
        photoUrl: data.photoUrl || data.photoURL || data.avatarPhoto || null,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};
