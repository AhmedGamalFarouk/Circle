import { motion as Motion } from "framer-motion";
import OrbContainer from "../ReactBits/Orb/OrbContainer";
import CircleDetailsCardContainer from "../../CircleDetailsCard/CircleDetailsCardContainer";

export default function LandingFloatingAvatarPresentaional({
  isRTLState,
  avatarRefs,
  avatars,
  hoveredAvatar,
  setHoveredAvatar,
}) {
  // Handle mouse enter event
  const handleMouseEnter = (orbId) => {
    setHoveredAvatar(orbId);
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    setHoveredAvatar(null);
  };

  return (
    <>
      {avatars.map((orb) => {
        const isHovered = hoveredAvatar === orb.id;
        return (
          <Motion.div
            key={orb.id}
            className={`absolute ${isHovered ? "z-50" : "z-20"}`}
            style={{ left: orb.x, top: orb.y, zIndex: isHovered ? 50 : 20 }}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -8, 0],
            x: [0, 4, 0],
          }}
          transition={{
            delay: orb.delay,
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            y: {
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            },
            x: {
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3,
            },
          }}
        >
          <div
            className="relative"
            ref={(el) => (avatarRefs.current[orb.id] = el)}
            onMouseEnter={() => handleMouseEnter(orb.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Motion.div
              className="relative"
              whileHover={{ scale: 1.1, zIndex: 30 }}
              transition={{ type: "spring", stiffness: 400 }}
              style={{ width: "120px", height: "120px" }}
            >
              <OrbContainer
                hoverIntensity={0.3}
                rotateOnHover={true}
                hue={orb.hue}
                forceHoverState={false}
                imageUrl={orb.imageUrl}
              />
            </Motion.div>

            {/* Hover card */}
            <CircleDetailsCardContainer
              orb={orb}
              hoveredAvatar={hoveredAvatar}
              isRTLState={isRTLState}
              avatarRefs={avatarRefs}
            />
          </div>
        </Motion.div>
        );
      })}
    </>
  );
}
