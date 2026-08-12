// libs
import { useState, useRef, useEffect, memo } from "react";
import { useLocation } from "react-router";
import i18n from "../../../../i18n";

// components
import AuthFloatingAvatarsPresentational from "./AuthFloatingAvatarsPresentational";
import LandingFloatingAvatarPresentaional from "./LandingFloatingAvatarPresentaional";

function FloatingAvatarContainer() {
  const [hoveredAvatar, setHoveredAvatar] = useState(null);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isRTLState, setIsRTLState] = useState(false);
  const location = useLocation().pathname;
  const avatarRefs = useRef({});

  // Listen for language changes and update RTL state
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng);
      const newIsRTL = lng === "ar";
      setIsRTLState(newIsRTL);
    };

    // Set initial state
    const initialIsRTL = currentLang === "ar";
    setIsRTLState(initialIsRTL);

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [currentLang]);

  const authAvatars = [
    {
      id: 1,
      src: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "50%",
      y: "25%",
      delay: 0,
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "40%",
      y: "15%",
      delay: 0.5,
    },
    {
      id: 3,
      src: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "70%",
      y: "25%",
      delay: 1,
    },
    {
      id: 4,
      src: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "12%",
      y: "50%",
      delay: 1.5,
    },
    {
      id: 5,
      src: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "60%",
      y: "40%",
      delay: 2,
    },
    {
      id: 6,
      src: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "40%",
      y: "80%",
      delay: 2.5,
    },
    {
      id: 8,
      src: "https://images.pexels.com/photos/1499327/pexels-photo-1499327.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      x: "75%",
      y: "60%",
      delay: 3.5,
    },
  ];

  // LTR: Avatars clustered vertically along left and right edges, top to bottom, with some vertical spacing
  // Helper to calculate delay based on y axis (bottom = lower delay, top = higher delay)
  function calcDelays(positions) {
    // Parse y as percent, sort ascending (bottom to top)
    const sorted = [...positions].sort(
      (a, b) => parseFloat(b.y) - parseFloat(a.y),
    );
    // Assign delays: bottom-most gets 0, next gets 0.3, then 0.6, etc.
    return sorted.map((avatar, i) => ({ ...avatar, delay: i * 0.3 }));
  }

  // LTR: Avatars clustered vertically along left and right edges, top to bottom, with unique images & social roles
  const ltrOrbPositionsRaw = [
    {
      id: 1,
      x: "6%",
      y: "10%",
      hue: 0,
      imageUrl: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Maya Lin",
      role: "Weekend Hikes Circle",
      status: "Planning a trail trip",
    },
    {
      id: 2,
      x: "17%",
      y: "15%",
      hue: 30,
      imageUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Sophia Martinez",
      role: "Coffee & Catchups",
      status: "Active now",
    },
    {
      id: 3,
      x: "10%",
      y: "30%",
      hue: 60,
      imageUrl: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Liam O'Connor",
      role: "Board Game Nights",
      status: "Host of Catan Night",
    },
    {
      id: 4,
      x: "20%",
      y: "35%",
      hue: 90,
      imageUrl: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Emma Watson",
      role: "Book Club Circle",
      status: "Reading chapter 4",
    },
    {
      id: 5,
      x: "1%",
      y: "30%",
      hue: 120,
      imageUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Michael Chen",
      role: "Padel & Tennis Squad",
      status: "Looking for 4th player",
    },
    {
      id: 6,
      x: "15%",
      y: "50%",
      hue: 150,
      imageUrl: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Daniel Rivera",
      role: "Road Trip Crew",
      status: "Voted on next stop",
    },
    {
      id: 7,
      x: "25%",
      y: "55%",
      hue: 180,
      imageUrl: "https://images.pexels.com/photos/1499327/pexels-photo-1499327.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Sarah Jenkins",
      role: "Foodie Explorers",
      status: "Suggested sushi spot",
    },
    {
      id: 9,
      x: "85%",
      y: "10%",
      hue: 210,
      imageUrl: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Alex Vance",
      role: "Concert Buddies",
      status: "Got 4 front tickets",
    },
    {
      id: 10,
      x: "74%",
      y: "15%",
      hue: 240,
      imageUrl: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Chloe Bennett",
      role: "Beach & Camping Crew",
      status: "Active now",
    },
    {
      id: 11,
      x: "80%",
      y: "30%",
      hue: 270,
      imageUrl: "https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "David Kim",
      role: "Sunday Football",
      status: "Confirmed for 5 PM",
    },
    {
      id: 12,
      x: "71%",
      y: "35%",
      hue: 300,
      imageUrl: "https://images.pexels.com/photos/1080213/pexels-photo-1080213.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Jessica Miller",
      role: "Movie Marathon Circle",
      status: "Choosing Friday film",
    },
    {
      id: 13,
      x: "90%",
      y: "30%",
      hue: 330,
      imageUrl: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Tariq Al-Mansoor",
      role: "BBQ & Chill Circle",
      status: "Fired up the grill",
    },
    {
      id: 14,
      x: "78%",
      y: "50%",
      hue: 45,
      imageUrl: "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Hannah Abbott",
      role: "Escape Room Team",
      status: "Unlocked final clue",
    },
    {
      id: 15,
      x: "65%",
      y: "55%",
      hue: 135,
      imageUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Omar Farooq",
      role: "Gaming & LAN Circle",
      status: "Active now",
    },
  ];
  const ltrOrbPositions = calcDelays(ltrOrbPositionsRaw);

  // RTL: Avatars clustered vertically along right and left edges, top to bottom (mirrored with unique images & social roles)
  const rtlOrbPositionsRaw = [
    {
      id: 1,
      x: "6%",
      y: "8%",
      hue: 0,
      imageUrl: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Maya Lin",
      role: "Weekend Hikes Circle",
      status: "Planning a trail trip",
    },
    {
      id: 2,
      x: "17%",
      y: "13%",
      hue: 30,
      imageUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Sophia Martinez",
      role: "Coffee & Catchups",
      status: "Active now",
    },
    {
      id: 3,
      x: "10%",
      y: "22%",
      hue: 60,
      imageUrl: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Liam O'Connor",
      role: "Board Game Nights",
      status: "Host of Catan Night",
    },
    {
      id: 4,
      x: "20%",
      y: "30%",
      hue: 90,
      imageUrl: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Emma Watson",
      role: "Book Club Circle",
      status: "Reading chapter 4",
    },
    {
      id: 5,
      x: "2%",
      y: "30%",
      hue: 120,
      imageUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Michael Chen",
      role: "Padel & Tennis Squad",
      status: "Looking for 4th player",
    },
    {
      id: 6,
      x: "15%",
      y: "50%",
      hue: 150,
      imageUrl: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Daniel Rivera",
      role: "Road Trip Crew",
      status: "Voted on next stop",
    },
    {
      id: 7,
      x: "25%",
      y: "50%",
      hue: 180,
      imageUrl: "https://images.pexels.com/photos/1499327/pexels-photo-1499327.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Sarah Jenkins",
      role: "Foodie Explorers",
      status: "Suggested sushi spot",
    },
    {
      id: 8,
      x: "6%",
      y: "48%",
      hue: 210,
      imageUrl: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Alex Vance",
      role: "Concert Buddies",
      status: "Active now",
    },
    {
      id: 9,
      x: "88%",
      y: "8%",
      hue: 240,
      imageUrl: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Chloe Bennett",
      role: "Beach & Camping Crew",
      status: "Active now",
    },
    {
      id: 10,
      x: "75%",
      y: "13%",
      hue: 270,
      imageUrl: "https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "David Kim",
      role: "Sunday Football",
      status: "Confirmed for 5 PM",
    },
    {
      id: 11,
      x: "83%",
      y: "22%",
      hue: 300,
      imageUrl: "https://images.pexels.com/photos/1080213/pexels-photo-1080213.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Jessica Miller",
      role: "Movie Marathon Circle",
      status: "Choosing Friday film",
    },
    {
      id: 12,
      x: "90%",
      y: "30%",
      hue: 330,
      imageUrl: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Tariq Al-Mansoor",
      role: "BBQ & Chill Circle",
      status: "Fired up the grill",
    },
    {
      id: 13,
      x: "70%",
      y: "30%",
      hue: 45,
      imageUrl: "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Hannah Abbott",
      role: "Escape Room Team",
      status: "Unlocked final clue",
    },
    {
      id: 14,
      x: "70%",
      y: "50%",
      hue: 135,
      imageUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Omar Farooq",
      role: "Gaming & LAN Circle",
      status: "Active now",
    },
    {
      id: 15,
      x: "80%",
      y: "50%",
      hue: 160,
      imageUrl: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Maya Lin",
      role: "Weekend Hikes Circle",
      status: "Planning a trail trip",
    },
    {
      id: 16,
      x: "90%",
      y: "48%",
      hue: 220,
      imageUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      name: "Sophia Martinez",
      role: "Coffee & Catchups",
      status: "Active now",
    },
  ];
  const rtlOrbPositions = calcDelays(rtlOrbPositionsRaw);

  // Choose the appropriate positions based on language
  const orbPositions = isRTLState ? rtlOrbPositions : ltrOrbPositions;

  return (
    <>
      {(location === "/login" || location === "/register") && (
        <AuthFloatingAvatarsPresentational avatars={authAvatars} />
      )}
      {location === "/" && (
        <LandingFloatingAvatarPresentaional
          avatarRefs={avatarRefs}
          isRTLState={isRTLState}
          avatars={orbPositions}
          hoveredAvatar={hoveredAvatar}
          setHoveredAvatar={setHoveredAvatar}
        />
      )}
    </>
  );
}
export default memo(FloatingAvatarContainer);
