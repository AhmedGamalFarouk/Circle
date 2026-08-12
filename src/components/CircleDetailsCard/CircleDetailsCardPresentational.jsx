import React from "react";
import { motion as Motion } from "framer-motion";

function CircleDetailsCardPresentational({ positionClasses, isRTLState, orb }) {
  return (
    <Motion.div
      className={`absolute ${positionClasses} bg-main/90 z-50 w-64 rounded-xl border border-text/10 p-4 shadow-lg backdrop-blur-sm`}
      style={{ pointerEvents: "none" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div
        className={`flex items-center ${isRTLState ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`h-12 w-12 overflow-hidden rounded-full ${isRTLState ? "ml-3" : "mr-3"}`}
        >
          <img
            src={orb.imageUrl}
            alt={`Team member ${orb.name}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className={isRTLState ? "text-right" : ""}>
          <h3 className="font-bold text-text">{orb.name}</h3>
          <p className="text-sm text-purple-400">{orb.role}</p>
        </div>
      </div>
      <div className="mt-3">
        <div
          className={`flex items-center text-sm ${isRTLState ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${isRTLState ? "ml-2" : "mr-2"} ${orb.status.includes("Active") ? "bg-green-500" : "bg-text-500"}`}
          ></div>
          <span className={`text-text-300 ${isRTLState ? "text-right" : ""}`}>
            {orb.status}
          </span>
        </div>
      </div>
    </Motion.div>
  );
}

export default CircleDetailsCardPresentational;
