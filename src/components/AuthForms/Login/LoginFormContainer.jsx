// Libs
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../../firebase-config";
// components
import LoginFormPresentational from './LoginFormPresentational';
import { setUserInfo } from "../../../features/user/userSlice";
import { getErrorMessage } from "../../../utils/ErrorMessage";
import { validateLoginForm } from "../../../utils/FormValidator";

export default function LoginFormContainer({ onSwitchToRegister }) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate()
    // Refs for form inputs
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const dispatch = useDispatch();
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/");
            }
        });
    }, [navigate]);

    const handleSignIn = async (e) => {
        e?.preventDefault();

        // Get values from refs
        const emailValue = emailRef.current?.value || "";
        const passwordValue = passwordRef.current?.value || "";

        const validationErrors = validateLoginForm({ email: emailValue, password: passwordValue });
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                emailValue,
                passwordValue,
            );
            const token = await userCredential.user.getIdToken();
            dispatch(setUserInfo({ user: userCredential.user, token }));
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect") || "/";
            navigate(redirect, { replace: true });
        } catch (error) {
            console.error("Login error:", error);
            toast.error(getErrorMessage(error.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSignIn(e);
        }
    };
    const handleSkipAuth = async () => {
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                "ahmedgamal5565@gmail.com",
                "123456"
            );
            const token = await userCredential.user.getIdToken();
            dispatch(setUserInfo({ user: userCredential.user, token }));
            toast.success("Signed in successfully!");
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect") || "/";
            navigate(redirect, { replace: true });
        } catch (error) {
            console.error("Skip auth login error:", error);
            toast.error(error.message || "Failed to sign in automatically");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LoginFormPresentational
            onSwitchToRegister={onSwitchToRegister}
            handleSignIn={handleSignIn}
            handleSkipAuth={handleSkipAuth}
            handleKeyPress={handleKeyPress}
            setShowPassword={setShowPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            errors={errors}
            // Refs
            emailRef={emailRef}
            passwordRef={passwordRef}
        />
    )
}
