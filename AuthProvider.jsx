import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import {
  setUserInfo,
  clearUserInfo,
  setAuthLoading,
} from "./src/features/user/userSlice";
import { auth } from "./src/firebase-config";
import { getUserProfile } from "./src/fire_base/profileController/profileController";

/**
 * AuthProvider: Listens to Firebase auth changes and updates Redux store.
 */
const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setAuthLoading(true));
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let username = currentUser.displayName || null;
        try {
          const profile = await getUserProfile(currentUser.uid);
          username = profile?.username || currentUser.displayName || null;
        } catch (profileError) {
          console.error("Error fetching Firestore profile:", profileError);
        }
        const serializableUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          username: username,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          phoneNumber: currentUser.phoneNumber,
          providerId: currentUser.providerId,
        };
        try {
          const token = await currentUser.getIdToken();

          dispatch(
            setUserInfo({
              user: serializableUser,
              token: token,
            }),
          );
        } catch (error) {
          dispatch(
            setUserInfo({
              user: serializableUser,
              token: null,
            }),
          );
        }
      } else {
        dispatch(clearUserInfo());
      }
    });
    // setUserInfo/clearUserInfo end the loading state once Firebase answers.
    return () => unsubscribe();
  }, [dispatch]);

  return children;
};

export default AuthProvider;
