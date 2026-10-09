// Libs
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, GoogleProvider } from "../../../firebase-config";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../../../features/user/userSlice";
import { getErrorMessage } from "../../../utils/ErrorMessage";
import {
  validateText,
  validateEmail,
  validatePassword,
} from "../../../utils/FormValidator";
import { validateUsername } from "../../../utils/usernameValidator";
import { createUserProfile, getUserProfile } from "../../../fire_base/profileController/profileController";
import interests from "../../../constants/interests";

// components
import RegisterFormPresentional from "./RegisterFormPresentional";
import { Timestamp } from "firebase/firestore";

function RegisterFormContainer({ onSwitchToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAge, setUserAge] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: null,
    message: "",
    isChecking: false,
  });
  const [search, setSearch] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectCity, setSelectCity] = useState(true);
  const interestOptions = interests;

  // Refs for form inputs
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const searchRef = useRef(null);

  const filteredInterests = interestOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Username validation with useEffect
  useEffect(() => {
    const validateUsernameAsync = async () => {
      if (!userName || userName.length < 3) {
        setUsernameValidation({
          isValid: null,
          message: "",
          isChecking: false,
        });
        return;
      }

      setUsernameValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        const validation = await validateUsername(userName);
        setUsernameValidation({
          isValid: validation.isValid,
          message: validation.message,
          isChecking: false,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Username validation error:", error);
        setUsernameValidation({
          isValid: false,
          message: "Error checking username availability",
          isChecking: false,
        });
      }
    };

    // Add a small delay to avoid too many API calls while typing
    const timeoutId = setTimeout(validateUsernameAsync, 500);

    return () => clearTimeout(timeoutId);
  }, [userName]);

  // Handle search input change with ref
  const handleSearchChange = () => {
    setSearch(searchRef.current?.value || "");
  };

  // Clear specific field errors
  const clearFieldError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Handle location change and clear error
  const handleLocationChange = (value) => {
    setLocation(value);
    if (value) {
      clearFieldError("location");
    }
  };

  // Handle interests change and clear error
  const handleInterestsChange = (newInterests) => {
    setSelectedInterests(newInterests);
    if (newInterests.length > 0) {
      clearFieldError("interests");
    }
  };

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();

    // Get values from refs
    const emailValue = emailRef.current?.value || "";
    const passwordValue = passwordRef.current?.value || "";
    const confirmPasswordValue = confirmPasswordRef.current?.value || "";

    // Validate all fields
    const validationErrors = {};

    // Username validation
    const usernameError = validateText(userName, "username");
    if (usernameError) validationErrors.username = usernameError;

    // Email validation
    const emailError = validateEmail(emailValue);
    if (emailError) validationErrors.email = emailError;

    // Password validation
    const passwordError = validatePassword(passwordValue);
    if (passwordError) validationErrors.password = passwordError;

    // Confirm password validation
    if (!confirmPasswordValue) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (passwordValue !== confirmPasswordValue) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    // Age validation
    if (!userAge || userAge < 18) {
      validationErrors.age = "You must be at least 18 years old to register";
    }

    // Location validation
    if (!location) {
      validationErrors.location = "Please select your location";
    }

    // Interests validation
    if (selectedInterests.length === 0) {
      validationErrors.interests = "Please select at least one interest";
    }

    // If there are validation errors, display them and stop
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Validate username availability before creating account
      const usernameValidationResult = await validateUsername(userName);
      if (!usernameValidationResult.isValid) {
        setErrors({ username: usernameValidationResult.message });
        setIsLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailValue,
        passwordValue,
      );
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Create user profile in Firestore for email/password signup
      const profileData = {
        uid: user.uid,
        email: user.email,
        provider: "email",
        emailVerified: user.emailVerified,
        username: userName || "",
        age: userAge || null,
        bio: "",
        location: location || "",
        joinDate: "",
        photoUrl: user.photoURL || null,
        // Mobile reads the avatar from avatarPhoto
        avatarPhoto: user.photoURL || "",
        isBlocked: false,
        coverPhoto:
          "https://res.cloudinary.com/dlyfph65r/image/upload/v1753334626/coverDeafault_b5c8od.jpg",
        stats: {
          circles: 0,
          connections: 0,
          events: 0,
        },
        interests: selectedInterests,
        joinedEvents: [],
        connectionRequests: [],
        connections: [],
        createdAt: Timestamp.now(),
        joinedCircles: [],
        phoneNumber: "",
      };

      await createUserProfile(user.uid, profileData);

      dispatch(setUserInfo({ user, token }));
      toast.success("Account created successfully! Welcome to Circle!");
      navigate("/");
    } catch (error) {
      // Map Firebase errors to inline field errors
      let fieldErrors = {};
      if (error.code === "auth/email-already-in-use") {
        fieldErrors.email = "Email is already in use";
      } else if (error.code === "auth/invalid-email") {
        fieldErrors.email = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        fieldErrors.password = "Password is too weak";
      } else if (error.code === "auth/network-request-failed") {
        fieldErrors.general = "Network error. Please try again.";
      } else {
        // fallback: show the error under a general field
        fieldErrors.general =
          getErrorMessage(error.code) ||
          "Registration failed. Please try again.";
      }
      setErrors(fieldErrors);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpWithGoogle = async () => {
    setIsGoogleLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, GoogleProvider);
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Check if this is a new user (first time signing up)
      const isNewUser = userCredential._tokenResponse?.isNewUser || false;

      // Profile for users signing in with Google for the first time
      const profileData = {
        uid: user.uid,
        email: user.email,
        provider: "google",
        emailVerified: user.emailVerified,
        username: userName || "",
        bio: "",
        location: "",
        joinDate: "",
        photoUrl: user.photoURL || null,
        avatarPhoto: user.photoURL || "",
        isBlocked: false,
        coverPhoto:
          "https://res.cloudinary.com/dlyfph65r/image/upload/v1753334626/coverDeafault_b5c8od.jpg",
        stats: {
          circles: 0,
          connections: 0,
          events: 0,
        },
        interests: selectedInterests,
        joinedEvents: [],
        connectionRequests: [],
        connections: [],
        createdAt: new Date(),
        isAdmin: false,
        joinedCircles: [],
        phoneNumber: "",
      };

      try {
        // createUserProfile replaces the whole document, so only call it
        // when there is no profile yet; otherwise a returning Google user
        // would lose their circles, connections and interests.
        const existingProfile = await getUserProfile(user.uid);
        if (!existingProfile) {
          await createUserProfile(user.uid, profileData);
        }
      } catch (profileError) {
        // eslint-disable-next-line no-console
        console.error(
          "Error creating/updating Google user profile:",
          profileError,
        );
        toast.warning("Signed in successfully, but profile update failed.");
      }

      dispatch(setUserInfo({ user, token }));
      toast.success(
        isNewUser
          ? "Account created successfully with Google!"
          : "Signed in successfully with Google!",
      );
      navigate("/");
    } catch (error) {
      // Handle COOP policy error specifically
      if (error.message?.includes("Cross-Origin-Opener-Policy")) {
        toast.error(
          "Popup blocked by security policy. Please try again or use a different browser.",
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-up was cancelled");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups and try again");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "An account with this email already exists. Please try signing in instead.",
        );
      } else {
        toast.error("Failed to sign up with Google. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSignUp(e);
    }
  };

  const handleAgeChange = (e) => {
    const ageDate = new Date(e.target.value);
    const today = new Date();
    let calculatedAge = today.getFullYear() - ageDate.getFullYear();
    // Adjust for month/day
    const m = today.getMonth() - ageDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < ageDate.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge < 18) {
      toast.warning("You must be at least 18 years old to register.");
      setUserAge(null);
      return;
    }
    setUserAge(calculatedAge);
  };

  const handleLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setSelectCity(false);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const apiKey = "efcadedc6ec64c51b36918c3e38a707c";
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          const loc = data.results[0];
          setLocation(
            loc.county || loc.address_line1 || loc.country || loc.city,
          );
        } catch (error) {
          toast.error("Failed to fetch location.");
        }
      },
      () => {
        toast.error("Unable to access your location.");
      },
    );
  };

  return (
    <RegisterFormPresentional
      handleKeyPress={handleKeyPress}
      handleSignUp={handleSignUp}
      handleSignUpWithGoogle={handleSignUpWithGoogle}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      isLoading={isLoading}
      isGoogleLoading={isGoogleLoading}
      onSwitchToLogin={onSwitchToLogin}
      handleAgeChange={handleAgeChange}
      setUserName={setUserName}
      userName={userName}
      usernameValidation={usernameValidation}
      location={location}
      handleLocation={handleLocation}
      setLocation={handleLocationChange}
      selectedInterests={selectedInterests}
      setSelectedInterests={handleInterestsChange}
      interestOptions={interestOptions}
      filteredInterests={filteredInterests}
      search={search}
      handleSearchChange={handleSearchChange}
      errors={errors}
      clearFieldError={clearFieldError}
      selectCity={selectCity}
      // Refs
      usernameRef={usernameRef}
      emailRef={emailRef}
      passwordRef={passwordRef}
      confirmPasswordRef={confirmPasswordRef}
      searchRef={searchRef}
    />
  );
}

export default RegisterFormContainer;
