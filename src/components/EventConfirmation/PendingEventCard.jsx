import React, { useEffect, useState } from "react";
import { Clock, MapPin, Users, CalendarCheck2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import { motion } from "framer-motion";
import Modal from "../ui/Modal/Modal";
import { usePollModal } from "../../hooks/chathooks/usePollModal";
import EventForm from "./EventForm";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";

// Array of background colors from your theme for avatars
const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-accent)",
];

// Helper function to get a color based on the user ID
const getColorForUser = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

export default function PendingEventCard({ event }) {
  const [comingUsers, setComingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPollModalVisible, setPollModalVisible] = useState(false);
  const [confirmedBg, setconfirmedBg] = useState(
    "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
  );
  const status = event.status;
  const pollModal = usePollModal();
  const { circleId } = useParams();
  const { userId } = useAuth();
  const members = useSelector((state) => state.members.membersByCircle[circleId]) || [];
  // Only circle admins can confirm a pending event (same rule as mobile)
  const canConfirm = members.some((member) => member.id === userId && (member.isAdmin || member.isOwner));

  useEffect(() => {
    if (isPollModalVisible) {
      pollModal.pollModalRef.current?.open();
    } else {
      pollModal.pollModalRef.current?.close();
    }
  }, [isPollModalVisible]);

  useEffect(() => {
    if (!event?.rsvps) {
      setComingUsers([]);
      setIsLoading(false);
      return;
    }

    const fetchComingUsers = async () => {
      setIsLoading(true);
      try {
        const yesUserIds = Object.entries(event.rsvps)
          .filter(([_, rsvpStatus]) => rsvpStatus === "yes")
          .map(([userId]) => userId);

        const usersData = await Promise.all(
          yesUserIds.map(async (id) => {
            try {
              const userDoc = await getDoc(doc(db, "users", id));
              if (userDoc.exists()) {
                return { id, ...userDoc.data() };
              }
            } catch (error) {
              console.error(`Error fetching user with ID ${id}:`, error);
            }
            return null;
          }),
        );
        setComingUsers(usersData.filter(Boolean));
      } catch (error) {
        console.error("Failed to fetch coming users:", error);
        setComingUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComingUsers();
  }, [event]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{
        boxShadow: "var(--shadow-glassCard)",

      }}
      className="group relative  hover:scale-[1.05] hover:border-[#17284f93] flex flex-col gap-4 overflow-hidden rounded-2xl border-2 border-transparent p-4 transition-all"
      style={{
        background: `radial-gradient(ellipse at top,var(--color-main-card-top)   0%, var(--color-main-card)  60%)`,
        backdropFilter: "blur(10px)",
        fontFamily: "var(--font-primary)",
      }}
    >
      {/* Top Row: Event Details */}
      <div className="flex items-center gap-3">
        {/* Pending Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="relative flex-shrink-0 rounded-full p-2"
          style={{
            background:
              "linear-gradient(45deg, var(--color-secondary), var(--color-primary))",

            transition: "box-shadow 0.3s ease",
            zIndex: 1,
          }}
        >
          <CalendarCheck2 size={20} style={{ color: "var(--color-darker)" }} />
        </motion.div>

        {/* Event Name & Place */}
        <motion.div
          whileHover={{ x: 5 }}
          className="relative z-10 flex min-w-0 flex-grow flex-col"
        >
          <p
            className="truncate text-lg font-bold"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-secondary)",
            }}
          >
            {event.activity || "Pending Event"}
          </p>
          <motion.div
            onClick={(e) => {
              e.stopPropagation();
              const mapsUrl = event.Location;
              window.open(mapsUrl, "_blank");
            }}
            className="flex cursor-pointer items-center gap-1 text-xs"
            style={{ color: "var(--color-secondary)" }}
          >
            <div className=" relative flex items-center">
              <MapPin
                size={14}
                className="text-text group flex-shrink-0 cursor-pointer hover:text-primary"
              />
              <span className="bg-primary absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded px-2 py-1 text-xs textspace-nowrap text-text group-hover:block">
                See location
              </span>
            </div>

            <p
              className="truncate"
              style={{ fontFamily: "var(--font-secondary)" }}
            >
              {event.place || "No location specified"}
            </p>
          </motion.div>
        </motion.div>

        {/* Status Badge */}
        <motion.span
          onClick={() => {
            if (canConfirm) setPollModalVisible(true);
          }}
          title={canConfirm ? undefined : "Waiting for an admin to confirm"}
          whileHover={canConfirm ? { scale: 1.1 } : undefined}
          className={`relative z-10 flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${canConfirm ? "cursor-pointer" : "cursor-default"}`}
          style={{
            background:
              status === "confirmed"
                ? confirmedBg
                : "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
            color: "var(--color-darker)",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",

            fontFamily: "var(--font-secondary)",
          }}
        >
          {event.status}
        </motion.span>
      </div>

      {/* Bottom Row: Attendees */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 animate-pulse rounded-full border-2 border-text-900"
                  style={{ backgroundColor: "var(--color-dark)" }}
                ></div>
              ))}
            </div>
            <span
              className="text-sm"
              style={{ color: "var(--color-text)", opacity: 0.5 }}
            >
              Fetching attendees...
            </span>
          </div>
        ) : comingUsers.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {comingUsers.slice(0, 3).map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-text-900 object-cover"
                  title={user.displayName}
                  style={{
                    backgroundColor: user.avatarPhoto
                      ? "transparent"
                      : getColorForUser(user.id),
                    borderColor: "var(--color-darker)",
                  }}
                >
                  {user.avatarPhoto ? (
                    <img
                      src={user.avatarPhoto}
                      alt={user.displayName || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-text">
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </motion.div>
              ))}
              {comingUsers.length > 3 && (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold text-text"
                  style={{
                    backgroundColor: "var(--color-dark)",
                    borderColor: "var(--color-darker)",
                    color: "var(--color-secondary)",
                  }}
                >
                  +{comingUsers.length - 3}
                </div>
              )}
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--color-secondary)" }}
            >
              {comingUsers.length} going
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--color-text)", opacity: 0.5 }}
          >
            <Users size={16} />
            <span>No one has RSVP'd yet</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] text-text/60">
          <span>{event.day}</span>
          <Clock size={12} />
        </div>
      </div>
      {isPollModalVisible && (
        <Modal ref={pollModal.pollModalRef}>
          <EventForm event={event} onClose={pollModal.handleClosePollModal} />
        </Modal>
      )}
    </motion.div>
  );
}
