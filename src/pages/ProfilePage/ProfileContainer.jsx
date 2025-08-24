import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";
import { auth } from "../../firebase-config";
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

  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showEditMode, setShowEditMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isProfileMyProfile, setIsProfileMyProfile] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  return (
    <ProfilePresentational
      {...{
        showMobileMenu,
        setShowMobileMenu,
        profileData: profile,
        isProfileMyProfile,
        isConnected,
        handleConnect,
        showEditMode,
        setShowEditMode,
        activeTab,
        setActiveTab,
        isConnecting,
      }}
    />
  );
};

export default ProfileContainer;
