import { useState, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase-config";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../../features/user/userSlice";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
// components
import LandingPresentational from "./LandingPresentational";

function LandingContainer() {
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authModalRef = useRef();
  const createCircleModalRef = useRef();
  const [isSkipLoading, setIsSkipLoading] = useState(false);

  function openCCircleModal() {
    createCircleModalRef.current.open();
  }
  function closeCCircleModal() {
    createCircleModalRef.current.close();
  }

  const handleSkipAuth = async () => {
    setIsSkipLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        "ahmedgamal5565@gmail.com",
        "123456"
      );
      const token = await userCredential.user.getIdToken();
      dispatch(setUserInfo({ user: userCredential.user, token }));
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Skip auth login error:", error);
      toast.error(error.message || "Failed to sign in automatically");
    } finally {
      setIsSkipLoading(false);
    }
  };

  return (
    <LandingPresentational
      t={t}
      isLoggedIn={isLoggedIn}
      openCCircleModal={openCCircleModal}
      closeCCircleModal={closeCCircleModal}
      createCircleModalRef={createCircleModalRef}
      authModalRef={authModalRef}
      handleSkipAuth={handleSkipAuth}
      isSkipLoading={isSkipLoading}
    />
  );
}

export default memo(LandingContainer);
