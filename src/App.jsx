import React, { useEffect, useRef } from "react";
import AuthProvider from "../AuthProvider";
import RoutesPages from "./routes/routes";
import { useDispatch } from "react-redux";
import { fetchCircles } from "./features/circles/circlesSlice";
import { fetchUserProfile } from "./features/userProfile/profileSlice";
import { onAuthStateChanged } from "firebase/auth";
import { auth, checkIfBlocked } from "./firebase-config";
import BlockedModal from "./components/ui/Modal/BlockModal/BlockedModal";
import { OnlinePresenceProvider } from "./contexts/OnlinePresenceContext";
import { useAuth } from "./hooks/useAuth";
import { PendingRequestsProvider } from "./contexts/PendingRequests";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const dispatch = useDispatch();
  const blockedModalRef = useRef();
  const [isUserBlocked, setIsUserBlocked] = React.useState(false);
  const { user } = useAuth();

  useEffect(() => {
    dispatch(fetchUserProfile(user?.uid));
  }, [dispatch, user?.uid]);

  // Circles are only readable when signed in, so (re)load them per user.
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchCircles());
    }
  }, [dispatch, user?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const blocked = await checkIfBlocked(user);
        if (blocked) {
          setIsUserBlocked(true);
          blockedModalRef.current?.open();
        } else {
          setIsUserBlocked(false);
        }
      } else {
        setIsUserBlocked(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleBlockedConfirm = async () => {
    await auth.signOut();
  };

  return (
    <>
      <ThemeProvider>
        <AuthProvider />
        <PendingRequestsProvider>
          <OnlinePresenceProvider>
            {!isUserBlocked && <RoutesPages />}
            <BlockedModal
              ref={blockedModalRef}
              onConfirm={handleBlockedConfirm}
            />
          </OnlinePresenceProvider>
        </PendingRequestsProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
