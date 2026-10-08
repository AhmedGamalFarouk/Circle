import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import AboutTab from "./AboutTab";
import CirclesTab from "./CirclesTab";
import ConnectionsTap from "./ConnectionsTap";
import { getCircleById } from "../../fire_base/circleController/circleController";

const ProfileContent = ({ activeTab, profileData }) => {
  const [joinedCircles, setJoinedCircles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isLoadingCircles, setIsLoadingCircles] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  // Fetch circle data
  useEffect(() => {
    const fetchCircleData = async () => {
      setJoinedCircles([]);
      setIsLoadingCircles(true);

      try {
        if (
          !profileData?.joinedCircles ||
          !Array.isArray(profileData.joinedCircles)
        ) {
          setIsLoadingCircles(false);
          return;
        }

        const circlePromises = profileData.joinedCircles.map((circleId) =>
          getCircleById(circleId).catch((error) => {
            console.error(`Error fetching circle ${circleId}:`, error);
            return null;
          }),
        );

        const circles = await Promise.all(circlePromises);
        const validCircles = circles.filter(
          (circle) => circle !== null && circle !== undefined,
        );
        setJoinedCircles(validCircles);
      } catch (error) {
        console.error("Error fetching circle data:", error);
        setJoinedCircles([]);
      } finally {
        setIsLoadingCircles(false);
      }
    };

    if (activeTab === "circles" && profileData) {
      fetchCircleData();
    } else if (activeTab !== "circles") {
      setJoinedCircles([]);
      setIsLoadingCircles(false);
    }
  }, [activeTab, profileData?.uid]);

  // Fetch connections data
  useEffect(() => {
    const fetchConnectionsData = async () => {
      setConnections([]);
      setIsLoadingConnections(true);

      try {
        if (
          !profileData?.connections ||
          !Array.isArray(profileData.connections)
        ) {
          setIsLoadingConnections(false);
          return;
        }

        // Fetch detailed user data for each connection ID
        const connectionPromises = profileData.connections.map(
          async (connectionId) => {
            try {
              const userRef = doc(db, "users", connectionId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  uid: connectionId,
                  username: userData.username,
                  displayName: userData.displayName || userData.username,
                  email: userData.email,
                  photoUrl: userData.photoUrl || userData.avatarPhoto,
                  bio: userData.bio,
                  interests: userData.interests || [],
                  location: userData.location,
                  joinDate: userData.joinDate,
                };
              } else {
                console.warn(`User with ID ${connectionId} not found`);
                return null;
              }
            } catch (error) {
              console.error(
                `Error fetching user data for ${connectionId}:`,
                error,
              );
              return null;
            }
          },
        );

        const connectionsData = await Promise.all(connectionPromises);
        const validConnections = connectionsData.filter(
          (connection) => connection !== null && connection !== undefined,
        );

        setConnections(validConnections);
      } catch (error) {
        console.error("Error fetching connections data:", error);
        setConnections([]);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    if (activeTab === "connections" && profileData) {
      fetchConnectionsData();
    } else if (activeTab !== "connections") {
      setConnections([]);
      setIsLoadingConnections(false);
    }
  }, [activeTab, profileData?.uid, profileData?.connections]);

  return (
    <div className="bg-text/5 mb-10 rounded-2xl shadow-md backdrop-blur-2xl">
      {activeTab === "about" && (
        <AboutTab
          uid={profileData?.uid}
          interests={profileData?.interests ?? []}
          recentActivities={profileData?.joinedEvents ?? []}
        />
      )}

      {activeTab === "circles" && (
        <CirclesTab
          joinedCircles={joinedCircles}
          joinedCirclesIds={profileData?.joinedCircles}
          isLoading={isLoadingCircles}
        />
      )}

      {activeTab === "connections" && (
        <ConnectionsTap
          connections={connections}
          isLoading={isLoadingConnections}
        />
      )}
    </div>
  );
};

export default ProfileContent;
