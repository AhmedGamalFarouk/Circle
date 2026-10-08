import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { addCircletoUser } from "./addCircletoUser";

export async function addMemberToCircle(circleId, newMemberUid, currentUser) {
  const db = getFirestore();
  try {
    // Check if current user is admin
    const currentUserMemberRef = doc(
      db,
      "circles",
      circleId,
      "members",
      currentUser.addedBy,
    );
    const currentUserDoc = await getDoc(currentUserMemberRef);
    if (!currentUserDoc.exists()) {
      return {
        success: false,
        message: "You are not a member of this circle.",
      };
    }
    if (!currentUserDoc.data().isAdmin) {
      return {
        success: false,
        message: "You don't have permission to add members.",
      };
    }

    // Check if user is already a member
    const newMemberRef = doc(db, "circles", circleId, "members", newMemberUid);
    const existingMember = await getDoc(newMemberRef);
    if (existingMember.exists()) {
      return {
        success: false,
        message: "User is already a member of this circle.",
      };
    }

    // Get the new member's profile
    const userDocRef = doc(db, "users", newMemberUid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const memberProfile = userDocSnap.data();
    // Add member to circle
    await setDoc(newMemberRef, {
      email: memberProfile.email || "",
      isOwner: false,
      isAdmin: false,
      username: memberProfile.username || "",
      photoURL: memberProfile.photoURL || memberProfile.photoUrl || memberProfile.avatarPhoto || "",
      userId: newMemberUid,
      joinedAt: new Date(),
      addedBy: currentUser.addedBy,
    });

    // Add circle to user's joinedCircles
    await addCircletoUser(newMemberUid, circleId);

    return {
      success: true,
      message: `${memberProfile.username} has been added to the circle.`,
      newMember: {
        id: newMemberUid,
        email: memberProfile.email || "",
        isAdmin: false,
        username: memberProfile.username || "",
        photoURL: memberProfile.photoURL || "",
        joinedAt: new Date(),
        addedBy: currentUser.uid,
      },
    };
  } catch (error) {
    console.error("❌ Error adding member:", error);
    return {
      success: false,
      message: "Failed to add member. Please try again.",
    };
  }
}

/**
 * Set or remove admin role for a member
 * @param {string} circleId - The circle ID
 * @param {string} targetMemberUid - The target member's user ID
 * @param {boolean} makeAdmin - True to make admin, false to remove admin
 * @param {Object} currentUser - Current user data
 * @returns {Object} - Result with success status and message
 */
export async function toggleMemberAdminRole(
  circleId,
  targetMemberUid,
  makeAdmin,
  currentUser,
) {
  const db = getFirestore();

  try {
    // Check if current user is admin
    const currentUserMemberRef = doc(
      db,
      "circles",
      circleId,
      "members",
      currentUser.uid,
    );
    const currentUserDoc = await getDoc(currentUserMemberRef);

    if (!currentUserDoc.exists() || !currentUserDoc.data().isAdmin) {
      return {
        success: false,
        message: "You don't have permission to manage admin roles.",
      };
    }

    // Get target member
    const targetMemberRef = doc(
      db,
      "circles",
      circleId,
      "members",
      targetMemberUid,
    );
    const targetMemberDoc = await getDoc(targetMemberRef);

    if (!targetMemberDoc.exists()) {
      return {
        success: false,
        message: "Member not found.",
      };
    }

    const targetMemberData = targetMemberDoc.data();

    // Prevent removing admin if they're the only admin
    if (!makeAdmin && targetMemberData.isAdmin) {
      const membersSnapshot = await getDocs(
        collection(db, "circles", circleId, "members"),
      );
      const adminCount = membersSnapshot.docs.filter(
        (doc) => doc.data().isAdmin,
      ).length;

      if (adminCount <= 1) {
        return {
          success: false,
          message:
            "Cannot remove the last admin. Please make someone else admin first.",
        };
      }
    }

    // Update member's admin status
    await updateDoc(targetMemberRef, {
      isAdmin: makeAdmin,
      adminChangedBy: currentUser.uid,
      adminChangedAt: new Date(),
    });

    return {
      success: true,
      message: `${targetMemberData.username} has been ${makeAdmin ? "promoted to" : "removed as"} admin.`,
      updatedMember: {
        ...targetMemberData,
        id: targetMemberUid,
        isAdmin: makeAdmin,
      },
    };
  } catch (error) {
    console.error("Error updating admin role:", error);
    return {
      success: false,
      message: "Failed to update admin role. Please try again.",
    };
  }
}

/**
 * Get all available users for circle creation (excludes current user)
 * @param {string} currentUserId - The current user's ID to exclude
 * @returns {Array} - Array of available users
 */
export async function getAllUsersForCircleCreation(currentUserId) {
  const db = getFirestore();

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Remove duplicates from users based on ID
    const uniqueUsers = allUsers.filter((user, index, self) => {
      return index === self.findIndex((u) => u.id === user.id);
    });

    // Filter out current user and users without username/email
    const availableUsers = uniqueUsers.filter((user) => {
      // Exclude current user
      if (user.id === currentUserId) return false;

      // Exclude if no username or email (invalid user)
      if (!user.username && !user.email) return false;

      return true;
    });

    return availableUsers.map((user) => ({
      value: user.id,
      label: user.username || user.email || "Unknown User",
      userData: user,
    }));
  } catch (error) {
    console.error("Error fetching users for circle creation:", error);
    return [];
  }
}

/**
 * Get all users that can be added to a circle (not already members)
 * @param {string} circleId - The circle ID
 * @returns {Array} - Array of available users
 */
export async function getAvailableUsers(circleId) {
  const db = getFirestore();

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Remove duplicates from users based on ID
    const uniqueUsers = allUsers.filter((user, index, self) => {
      return index === self.findIndex((u) => u.id === user.id);
    });

    // Get current circle members
    const membersSnapshot = await getDocs(
      collection(db, "circles", circleId, "members"),
    );
    const memberIds = membersSnapshot.docs.map((doc) => doc.id);

    // Filter out current members and users without username/email
    const availableUsers = uniqueUsers.filter((user) => {
      // Exclude if already a member
      if (memberIds.includes(user.id)) return false;

      // Exclude if no username or email (invalid user)
      if (!user.username && !user.email) return false;

      return true;
    });

    return availableUsers.map((user) => ({
      value: user.id,
      label: user.username || user.email || "Unknown User",
      userData: user,
    }));
  } catch (error) {
    console.error("Error fetching available users:", error);
    return [];
  }
}

/**
 * Remove a member from a circle
 * @param {string} circleId - The circle ID
 * @param {string} memberUid - The member's user ID to remove
 * @param {Object} currentUser - Current user data
 * @returns {Object} - Result with success status and message
 */
export async function removeMemberFromCircle(circleId, memberUid, currentUser) {
  const db = getFirestore();

  try {
    // Check if current user is admin
    const currentUserMemberRef = doc(
      db,
      "circles",
      circleId,
      "members",
      currentUser.uid,
    );
    const currentUserDoc = await getDoc(currentUserMemberRef);

    if (!currentUserDoc.exists() || !currentUserDoc.data().isAdmin) {
      return {
        success: false,
        message: "You don't have permission to remove members.",
      };
    }

    // Prevent removing yourself
    if (memberUid === currentUser.uid) {
      return {
        success: false,
        message: "You cannot remove yourself from the circle.",
      };
    }

    // Check if member exists
    const memberRef = doc(db, "circles", circleId, "members", memberUid);
    const memberDoc = await getDoc(memberRef);

    if (!memberDoc.exists()) {
      return {
        success: false,
        message: "Member not found in this circle.",
      };
    }

    const memberData = memberDoc.data();

    // If removing an admin, check if there are other admins
    if (memberData.isAdmin) {
      const membersSnapshot = await getDocs(
        collection(db, "circles", circleId, "members"),
      );
      const adminCount = membersSnapshot.docs.filter(
        (doc) => doc.data().isAdmin,
      ).length;

      if (adminCount <= 1) {
        return {
          success: false,
          message:
            "Cannot remove the last admin. Please make someone else admin first.",
        };
      }
    }

    // Remove member from circle
    await deleteDoc(memberRef);

    // Remove circle from user's circles list
    const userRef = doc(db, "users", memberUid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userCircles = userData.circles || [];
      const updatedCircles = userCircles.filter((id) => id !== circleId);

      await updateDoc(userRef, {
        circles: updatedCircles,
      });
    }

    return {
      success: true,
      message: `${memberData.username || "Member"} has been removed from the circle.`,
      removedMember: memberData,
    };
  } catch (error) {
    console.error("Error removing member:", error);
    return {
      success: false,
      message: "Failed to remove member. Please try again.",
    };
  }
}

// On circle creation, add the creator as the first member (owner/admin)
export async function addCreatorAsFirstMember(circleId, creatorUid) {
  const db = getFirestore();

  try {
    // Get the creator's profile
    const creatorDocRef = doc(db, "users", creatorUid);
    const creatorDocSnap = await getDoc(creatorDocRef);

    if (!creatorDocSnap.exists()) {
      return {
        success: false,
        message: "Creator not found.",
      };
    }

    const creatorProfile = creatorDocSnap.data();

    // Add creator as the first member (owner/admin) of the circle
    const circleRef = doc(db, "circles", circleId);
    const circleSnap = await getDoc(circleRef);

    if (circleSnap.exists()) {
      // only add member if circle still exists
      await setDoc(doc(db, "circles", circleId, "members", creatorUid), {
        email: creatorProfile.email || "",
        isOwner: true,
        isAdmin: true,
        username: creatorProfile.username || "",
        photoURL: creatorProfile.photoURL || creatorProfile.photoUrl || "",
        userId: creatorUid,
        joinedAt: new Date(),
        addedBy: creatorUid,
      });
    } else {
      console.warn("Circle was deleted, skipping member creation.");
    }

    return {
      success: true,
      message: "Creator added as the first member of the circle.",
      member: {
        id: creatorUid,
        email: creatorProfile.email || "",
        isAdmin: true,
        isOwner: true,
        username: creatorProfile.username || "",
        photoURL: creatorProfile.photoURL || creatorProfile.photoUrl || "",
        userId: creatorUid,
        joinedAt: new Date(),
        addedBy: creatorUid,
      },
    };
  } catch (error) {
    console.error("Error adding creator as first member:", error);
    return {
      success: false,
      message: "Failed to add creator as the first member. Please try again.",
    };
  }
}
