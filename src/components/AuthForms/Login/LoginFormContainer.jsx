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
    // Already signed in: leave the login page, honouring ?redirect=.
    // Read ?redirect= once on mount: the auth listener and the sign-in
    // handlers both navigate, and whichever runs second must not see a URL
    // the first already changed.
    const [redirect] = useState(
        () => new URLSearchParams(window.location.search).get("redirect") || "/",
    );
    useEffect(() => {
        let active = true;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && active) {
                navigate(redirect, { replace: true });
            }
        });
        return () => {
            active = false;
            unsubscribe();
        };
    }, [navigate, redirect]);

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
