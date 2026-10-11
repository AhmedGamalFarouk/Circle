import { useState, useEffect, useContext } from "react";
import { useCalendarApp } from "@schedule-x/react";
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from "@schedule-x/calendar";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-shadcn/dist/index.css";
import EventsPresentional from "./EventsPresentional";
import { db } from "../../firebase-config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { ThemeContext } from "../../contexts/ThemeContext";

export default function EventsContainer() {
  const { userId } = useAuth();

  const { darkMode } = useContext(ThemeContext);
  useEffect(() => {}, [darkMode]);
  const [isDark, setDark] = useState(!darkMode);

  // No localStorage cache: it showed the previous visit's (or previous
  // account's) events, and the calendar never picked up fresh ones.
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState({});
  const [eventsService] = useState(() => createEventsServicePlugin());

  const [loading, setLoading] = useState(true);

  const formatDate = (date) =>
    date.toISOString().slice(0, 16).replace("T", " ");

  const getRandomColor = () => {
    const colors = [
      "#f78fb3",
      "#4ea8de",
      "#ac9ffa",
      "#17284f",
      "#845EC2",
      "#00C9A7",
      "#FF9671",
      "#2C73D2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    if (!userId) return;

    const fetchCirclesAndEvents = async () => {
      setLoading(true);

      try {
        // Only the user's own circles, read in parallel, instead of every
        // circle in the database one by one.
        const userSnap = await getDoc(doc(db, "users", userId));
        const joinedIds = userSnap.exists() ? userSnap.data().joinedCircles || [] : [];
        const circleDocs = (
          await Promise.all(
            joinedIds.map(async (circleId) => {
              const [circleSnap, memberSnap] = await Promise.all([
                getDoc(doc(db, "circles", circleId)),
                getDoc(doc(db, "circles", circleId, "members", userId)),
              ]);
              if (!circleSnap.exists() || !memberSnap.exists()) return null;
              const eventsSnap = await getDocs(collection(db, "circles", circleId, "events"));
              return { circleDoc: circleSnap, eventsSnap };
            }),
          )
        ).filter(Boolean);

        const fetchedCalendars = {};
        let allEvents = [];

        for (const { circleDoc, eventsSnap } of circleDocs) {
          const circleId = circleDoc.id;
          const circleData = circleDoc.data();

          // Build calendar info
          if (!fetchedCalendars[circleId]) {
            fetchedCalendars[circleId] = {
              colorName: getRandomColor(),
              label: circleData.circleName || "Unnamed Circle",
              image: circleData.imageUrl || circleData.image || "",
              events: [],
            };
          }

          const calendarInfo = fetchedCalendars[circleId];

          // Pending events have no day yet; rejected ones aren't happening.
          const scheduledDocs = eventsSnap.docs.filter((docSnap) => {
            const status = docSnap.data().status;
            return !status || status === "confirmed";
          });
          const circleEvents = scheduledDocs.map((docSnap) => {
            const data = docSnap.data();
            let startDate = new Date();
            if (data.day instanceof Timestamp) startDate = data.day.toDate();
            else if (data.day) startDate = new Date(data.day);
            else if (data.createdAt instanceof Timestamp)
              startDate = data.createdAt.toDate();

            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

            return {
              id: docSnap.id,
              title: data.activity || "Untitled Event",
              start: formatDate(startDate),
              end: formatDate(endDate),
              calendarId: circleId,
              description: `Circle : ${calendarInfo.label || ""} going to - ${
                data.place || ""
              } - ${data.Location || ""}`,
              circleName: calendarInfo.label,
              circleImage: calendarInfo.image,
            };
          });

          fetchedCalendars[circleId].events = circleEvents;

          allEvents = [...allEvents, ...circleEvents];
        }

        setEvents(allEvents);
        setCalendars(fetchedCalendars);

      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCirclesAndEvents();
  }, [userId]);

  const calendarApp = useCalendarApp({
    isDark,
    views: [
      // createViewDay({ hourStep: 2,    // each row = 2 hours
      // startHour: 8,   // start at 8 AM
      // endHour: 20, }),
      // createViewWeek({ hourStep: 2,    // each row = 2 hours
      // startHour: 8,   // start at 8 AM
      // endHour: 20, }),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: "Month",
    selectedDates: new Date().toISOString().slice(0, 10),
    plugins: [createEventModalPlugin(), createDragAndDropPlugin(), eventsService],
    calendars,
    events,
  });

  // The calendar only reads `events` when it is created, so push updates.
  // Runs after the calendar (a child) has mounted and initialised the plugin.
  useEffect(() => {
    if (!loading) eventsService.set(events);
  }, [eventsService, events, loading]);

  if (loading && !events.length) {
    return (
      <div
        className="flex min-h-screen animate-pulse flex-col gap-4 p-4"
        style={{
          background:
            "radial-gradient(ellipse at top, #17284f93 0%, transparent 60%)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Skeleton loader */}
        <div className="bg-text-700/40 h-10 w-1/3 rounded-xl"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-text-700/30 h-6 rounded-md"></div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-text-700/20 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          backdropFilter: "blur(10px)",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <EventsPresentional
          calendarApp={calendarApp}
          categoryColors={Object.fromEntries(
            Object.entries(calendars).map(([id, c]) => [id, c.colorName]),
          )}
          circlesInfo={calendars}
        />
      </div>
    </>
  );
}
