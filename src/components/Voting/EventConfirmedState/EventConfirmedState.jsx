import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlusCircle,
  PartyPopper,
  Map,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RsvpConfettiOverlay from "../PartyPopperCelebration/RsvpConfettiOverlay";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { useParams } from "react-router";

const RSVP_OPTIONS = [
  { type: "yes", label: "Going", icon: CheckCircle2, color: "text-green-300" },
  { type: "maybe", label: "Maybe", icon: HelpCircle, color: "text-yellow-300" },
  { type: "no", label: "Not Going", icon: XCircle, color: "text-red-300" },
];

const EventConfirmedNew = ({ eventData, onRsvp, onStartNewPoll }) => {
  let { circleId } = useParams()
  const [showConfetti, setShowConfetti] = useState(false);

  const [isOpen, setIsOpen] = useState(true);

  const handleClick = async () => {
    try {
      await addDoc(
        collection(db, "circles", circleId, "events"),
        {
          activity: winningActivity || "N/A",
          title: winningActivity || "N/A", // Write both for Mobile compatibility
          place: winningPlace || "N/A",
          location: winningPlace || "N/A",  // Write both for Mobile compatibility
          createdAt: serverTimestamp(),
          status: "pending",
          rsvps: rsvps || {},
          Location: "",
          day: ""
        }
      );
    } catch (error) {
      console.error("Error saving event:", error);
    }
    setShowConfetti(true);

    // Wait 3s for confetti before navigating
    setTimeout(() => {
      if (onStartNewPoll) onStartNewPoll();
      setShowConfetti(false);
    }, 2000);
  };

  // Preserved logic from your original component
  const { winningActivity, winningPlace, rsvps, currentUser } = eventData || {};

  const rsvpCounts = { yes: 0, no: 0, maybe: 0 };
  Object.values(rsvps || {}).forEach((rsvp) => {
    if (rsvpCounts[rsvp] !== undefined) rsvpCounts[rsvp]++;
  });

  const userRsvp = currentUser?.rsvp;

  return (
    <div className="mx-auto  fixed md:relative overflow-y-auto  max-h-[300px] overflow-hidden  backdrop-blur-lg mt-3  md:left-[50%] transform md:translate-x-[-50%]  w-[100%] md:w-[100%] space-y-6 rounded-3xl  p-4 text-text shadow-2xl">



      <header onClick={() => setIsOpen(!isOpen)} className="flex flex-col items-center justify-center space-y-2 text-center">
        {/* Header with toggle */}

        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <PartyPopper size={40} className="animate-pulse text-yellow-400" />
          <h1 className="text-3xl font-extrabold tracking-tight">
            Event Confirmed!
          </h1>
          <p className="text-sm text-text-400">
            All set, get ready to celebrate!
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <ChevronDown className="h-6 w-6" />
        )}

      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 px-4"
          >

            {/* Event details card */}
            <div className="space-y-4 rounded-2xl border border-text-700  p-6 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-500/20 p-3">
                  <Sparkles size={24} className="text-purple-400" />
                </div>
                <p className="truncate text-lg font-semibold">
                  {winningActivity || eventData?.title || eventData?.activity || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-500/20 p-3">
                  <Map size={24} className="text-purple-400" />
                </div>
                <p className="truncate text-lg font-semibold">
                  {winningPlace || eventData?.location || eventData?.place || "N/A"}
                </p>
              </div>
            </div>

            {/* RSVP buttons with integrated counts */}
            <div className="rounded-2xl border border-text-700  p-6">
              <h2 className="mb-5 text-center text-lg font-bold">
                Will you be joining us?
              </h2>
              <div className="flex justify-between gap-3">
                {RSVP_OPTIONS.map(
                  ({ type, label, icon: Icon, color, bg, border }) => {
                    const isSelected = userRsvp === type;
                    const count = rsvpCounts[type];
                    return (
                      <button
                        key={type}
                        onClick={() => onRsvp(type)}
                        className={`relative flex w-full flex-col items-center rounded-xl border-2 py-4 transition-all duration-300 ease-in-out ${isSelected ? `${bg} ${border} scale-105 shadow-md` : "border-transparent bg-text-700 hover:scale-[1.02] hover:bg-text-600"} `}
                        aria-pressed={isSelected}
                        title={label}
                      >
                        <Icon
                          className={`mb-2 ${isSelected ? color : "text-text-400"}`}
                          size={28}
                        />
                        <span
                          className={`text-sm font-semibold ${isSelected ? "text-text" : "text-text-300"}`}
                        >
                          {label}
                        </span>
                        <span
                          className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg ${isSelected ? "bg-text text-text-800" : "border-text-800 bg-text-600 text-text"}`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* New Poll Button */}
            {onStartNewPoll && (
              <button
                onClick={handleClick}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-purple-600 py-3 text-lg font-bold text-text shadow-lg transition-all duration-200 hover:bg-purple-700 active:bg-purple-800"
              >
                <PlusCircle size={20} />
                Plan New Event
              </button>
            )}
            {showConfetti && <RsvpConfettiOverlay key={Date.now()} />}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventConfirmedNew;
