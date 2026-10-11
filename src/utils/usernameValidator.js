import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

/**
 * Check if a username is already taken in the users collection
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} - Returns true if username is available, false if taken
 */
export async function isUsernameAvailable(username) {
    if (!username || username.trim().length === 0) {
        return false;
    }

    const db = getFirestore();

    try {
        // Create a query to check if username exists (case-insensitive)
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            where("username", "==", username.trim().toLowerCase())
        );

        const querySnapshot = await getDocs(q);

        // If no documents found, username is available
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking username availability:", error);
        // Let the caller decide; a failed check is not the same as "taken".
        throw error;
    }
}

/**
 * Validate username format and availability
 * @param {string} username - The username to validate
 * @returns {Promise<Object>} - Returns validation result with isValid and message
 */
export async function validateUsername(username, { checkAvailability = true } = {}) {
    const trimmedUsername = username?.trim();

    // Check basic format requirements
    if (!trimmedUsername) {
        return {
            isValid: false,
            message: "Username is required."
        };
    }

    if (trimmedUsername.length < 3) {
        return {
            isValid: false,
            message: "Username must be at least 3 characters long."
        };
    }

    if (trimmedUsername.length > 20) {
        return {
            isValid: false,
            message: "Username must be 20 characters or less."
        };
    }

    // Check for valid characters (letters, numbers, underscores, hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
        return {
            isValid: false,
            message: "Username can only contain letters, numbers, underscores, and hyphens."
        };
    }

    // Check if username starts with a letter or number
    if (!/^[a-zA-Z0-9]/.test(trimmedUsername)) {
        return {
            isValid: false,
            message: "Username must start with a letter or number."
        };
    }

    // Profiles are only readable when signed in, so a visitor who is still
    // registering can only get the format checked.
    if (!checkAvailability) {
        return { isValid: true, message: "" };
    }

    // Check availability in database
    const isAvailable = await isUsernameAvailable(trimmedUsername);
    if (!isAvailable) {
        return {
            isValid: false,
            message: "This username is already taken. Please choose another one."
        };
    }

    return {
        isValid: true,
        message: "Username is available!"
    };
}
