import ProfileHeader from "../../components/ProfileComponents/ProfileHeader";
import ProfileCover from "../../components/ProfileComponents/ProfileCover";
import ProfileInfo from "../../components/ProfileComponents/ProfileInfo";
import ProfileTabs from "../../components/ProfileComponents/ProfileTabs";
import ProfileContent from "../../components/ProfileComponents/ProfileContent";

const ProfilePresentational = ({
  profileData,
  showMobileMenu,
  setShowMobileMenu,
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
  isReporting,
  notFound,
}) => {
  if (notFound) {
    return (
      <div className="text-text flex min-h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-text-400">This profile doesn't exist or was deleted.</p>
      </div>
    );
  }
  if (!profileData) {
    return <div>Loading profile...</div>;
  }



  return (
    <div className="from-bg-primary to-bg-secondary text-text mt-16 min-h-screen bg-gradient-to-b">
      <ProfileHeader
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="relative">
          <ProfileCover
            coverImage={profileData?.coverPhoto}
            isProfileMyProfile={isProfileMyProfile}
          />

          <ProfileInfo
            isProfileMyProfile={isProfileMyProfile}
            profileData={profileData}
            isConnected={isConnected}
            handleConnect={handleConnect}
            showEditMode={showEditMode}
            setShowEditMode={setShowEditMode}
            isConnecting={isConnecting}
            handleReport={handleReport}
            reported={reported}
            isReporting={isReporting}
          />
        </div>

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <ProfileContent activeTab={activeTab} profileData={profileData} />
      </div>
    </div>
  );
};

export default ProfilePresentational;
