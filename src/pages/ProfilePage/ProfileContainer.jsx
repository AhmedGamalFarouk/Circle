import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { auth ,db } from "../../firebase-config";
import { getUserInfo } from "../../features/user/userSlice";
import ProfilePresentational from "./ProfilePresentational";
import { updateUserProfile } from "../../fire_base/profileController/profileController";
import {
  fetchUserProfile,
  fetchViewedProfile,
} from "../../features/userProfile/profileSlice";
import { sendConnectionRequestNotification } from "../../fire_base/notificationController/notificationController";
const ProfileContainer = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(getUserInfo);
  const { profileId } = useParams();

  // Select correct profile data
  const profile = useSelector((state) =>
    auth.currentUser?.uid === profileId
      ? state.userProfile.profile
      : state.userProfile.viewedProfile,
  );

  const viewedProfileStatus = useSelector((state) => state.userProfile.viewedProfileStatus);
  const notFound = auth.currentUser?.uid !== profileId && viewedProfileStatus === "failed";
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showEditMode, setShowEditMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isProfileMyProfile, setIsProfileMyProfile] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reported, setReported] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (!profileId) return;
    if (auth.currentUser?.uid === profileId) {
      dispatch(fetchUserProfile(profileId));
      setIsProfileMyProfile(true);
    } else {
      dispatch(fetchViewedProfile(profileId));
      setIsProfileMyProfile(false);
    }
  }, [profileId, dispatch]);

  // Update isConnected state based on profile
  useEffect(() => {
    if (!profile?.connectionRequests || !userInfo?.uid) {
      setIsConnected(false);
      return;
    }

    // Check if current user's UID is in the profile's connectionRequests array
    const isCurrentUserConnected = profile.connectionRequests.some(
      (request) => request.uid === userInfo.uid || request === userInfo.uid,
    );
    setIsConnected(isCurrentUserConnected);
  }, [profile?.connectionRequests, userInfo?.uid]);

  const handleConnect = async () => {
    if (isConnecting) return; // Prevent multiple clicks

    setIsConnecting(true);

    try {
      const currentConnectionRequests = profile.connectionRequests || [];
      let updatedConnectionRequests;

      if (isConnected) {
        // Remove connection - filter out current user's UID
        updatedConnectionRequests = currentConnectionRequests.filter(
          (request) => {
            // Handle both object format and string format
            const requestUid =
              typeof request === "object" ? request.uid : request;
            return requestUid !== userInfo.uid;
          },
        );
        setIsConnected(false);
      } else {
        // Add connection - add current user's UID
        updatedConnectionRequests = [
          ...currentConnectionRequests,
          userInfo.uid,
        ];
        setIsConnected(true);
        sendConnectionRequestNotification(
          profileId,
          userInfo.username,
          userInfo.uid,
          userInfo.photoURL,
          userInfo.username,
        );
      }

      // Update the profile with new connection requests
      await updateUserProfile(profileId, {
        connectionRequests: updatedConnectionRequests,
      });

      // Optionally refresh the profile data
      dispatch(fetchViewedProfile(profileId));
    } catch (error) {
      console.error("Error updating connection:", error);
      // Revert the state on error
      setIsConnected(!isConnected);
    } finally {
      setIsConnecting(false);
    }
  };

 

// Reports are kept on the reporter's own profile; the reported user only
// gets their `reported` counter bumped by one (all the rules allow, and the
// field mobile uses). Blocking is left to app admins.
const reportedUsers = useSelector((state) => state.userProfile.profile?.reportedUsers);
useEffect(() => {
  setReported(!!reportedUsers?.includes(profileId));
}, [reportedUsers, profileId]);

const handleReport = async () => {
  if (isReporting || reported || !userInfo?.uid) return;

  setIsReporting(true);
  try {
    await updateDoc(doc(db, "users", profileId), { reported: increment(1) });
    await updateDoc(doc(db, "users", userInfo.uid), {
      reportedUsers: arrayUnion(profileId),
    });
    setReported(true);
    dispatch(fetchUserProfile(userInfo.uid));
  } catch (error) {
    console.error("Error reporting user:", error);
  } finally {
    setIsReporting(false);
  }
};

  return (
    <ProfilePresentational
      {...{
        showMobileMenu,
        setShowMobileMenu,
        profileData: profile,
        notFound,
        isProfileMyProfile,
        isConnected,
        handleConnect,
        showEditMode,
        setShowEditMode,
        activeTab,
        setActiveTab,
        isConnecting,
        handleReport,
        reported,
        isReporting
      }}
    />
  );
};

export default ProfileContainer;
