import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "../../hooks/useGeolocation";
import { MapPin, ExternalLink } from "lucide-react";
import { customIcon } from "../../assets/icons/customIcon";
import { useSelector } from "react-redux";
import { getProfileData } from "../../features/userProfile/profileSlice";
import { useCircleEvents } from "../../hooks/useCircleEvents";
import { Helmet } from "react-helmet";

// Stable empty array so useCircleEvents doesn't refetch on every render.
const EMPTY_IDS = [];

const Explore = () => {
  const { position, isLoading, getPosition } = useGeolocation();
  const [myLocation, setMyLocation] = useState([30.1, 31.5]);
  const [eventsWithLocations, setEventsWithLocations] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Get user data from Redux
  const profile = useSelector(getProfileData);
  const circles = useSelector((state) => state.circles.circles);
  const circlesStatus = useSelector((state) => state.circles.status);

  // Get events for user's circles (from member docs; pins wait until they load)
  const joinedIds = useSelector((state) => state.circles.joinedIds);
  const userCircleIds = circlesStatus === "succeeded" ? joinedIds : EMPTY_IDS;
  const { eventsByCircle, loading: eventsLoading } =
    useCircleEvents(userCircleIds);

  useEffect(() => {
    if (position) {
      setMyLocation([position.lat, position.lng]);
    }
  }, [position]);

  // Free geocoding function using OpenStreetMap Nominatim
  const geocodeWithNominatim = async (query) => {

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        if (!isNaN(lat) && !isNaN(lon)) {
          return [lat, lon];
        } else {
          console.log(`❌ Invalid coordinates: lat=${lat}, lon=${lon}`);
        }
      } else {
        console.log(`❌ No geocoding results found for: "${query}"`);
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Enhanced function to extract coordinates from Google Maps URL OR geocode search queries
  const extractCoordinatesFromUrlOrGeocode = async (url) => {
    if (!url || !url.includes("google.com/maps")) {
      return null;
    }

    try {
      // Handle query format: https://www.google.com/maps/search/?api=1&query=cairo%20tower
      if (url.includes("query=")) {
        const queryMatch = url.match(/[?&]query=([^&]+)/);
        if (queryMatch) {
          const query = decodeURIComponent(queryMatch[1]);

          // Try to get coordinates from geocoding
          const coordinates = await geocodeWithNominatim(query);
          if (coordinates) {
            return coordinates;
          } else {
            return null;
          }
        }
      }

      // Handle place URLs with embedded coordinates

      // Format 1: @30.0459751,31.2242988,17z (most common)
      const atCoordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atCoordsMatch) {
        const lat = parseFloat(atCoordsMatch[1]);
        const lng = parseFloat(atCoordsMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 2: 3d data parameters
      const dataMatch = url.match(/3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dataMatch) {
        const lat = parseFloat(dataMatch[1]);
        const lng = parseFloat(dataMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 3: ll parameter
      const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llMatch) {
        const lat = parseFloat(llMatch[1]);
        const lng = parseFloat(llMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 4: q parameter with coordinates
      const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        const lat = parseFloat(qMatch[1]);
        const lng = parseFloat(qMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 5: center parameter
      const centerMatch = url.match(/[?&]center=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (centerMatch) {
        const lat = parseFloat(centerMatch[1]);
        const lng = parseFloat(centerMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 6: saddr parameter
      const saddrMatch = url.match(/[?&]saddr=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (saddrMatch) {
        const lat = parseFloat(saddrMatch[1]);
        const lng = parseFloat(saddrMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 7: daddr parameter
      const daddrMatch = url.match(/[?&]daddr=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (daddrMatch) {
        const lat = parseFloat(daddrMatch[1]);
        const lng = parseFloat(daddrMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 8: cid parameter
      const cidMatch = url.match(/[?&]cid=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (cidMatch) {
        const lat = parseFloat(cidMatch[1]);
        const lng = parseFloat(cidMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 9: complex data parameters with coordinates
      const complexDataMatch = url.match(
        /data=![^!]*!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      );
      if (complexDataMatch) {
        const lat = parseFloat(complexDataMatch[1]);
        const lng = parseFloat(complexDataMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      // Format 10: place URLs with coordinates in the path
      const placePathMatch = url.match(
        /place\/[^@]+@(-?\d+\.\d+),(-?\d+\.\d+)/,
      );
      if (placePathMatch) {
        const lat = parseFloat(placePathMatch[1]);
        const lng = parseFloat(placePathMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }

      console.log(`❌ No coordinate patterns found in URL`);
      return null;
    } catch (error) {
      console.log(`❌ Error during coordinate extraction:`, error);
      return null;
    }
  };

  // Get all events with locations from user's circles (now with geocoding)
  const getEventsWithLocations = async () => {
    const eventsWithLocations = [];

    if (circlesStatus !== "succeeded" || !circles || !eventsByCircle) {
      console.log("❌ Missing data:", {
        hasProfile: !!profile,
        circlesStatus,
        hasCircles: !!circles,
        hasEventsByCircle: !!eventsByCircle,
      });
      return eventsWithLocations;
    }

    for (const circleId of Object.keys(eventsByCircle)) {
      const circle = circles.find((c) => c.id === circleId);
      const events = eventsByCircle[circleId] || [];

      for (const event of events) {
        if (event.Location && event.Location.trim()) {
          // Always try to extract coordinates from the Location field
          const coordinates = await extractCoordinatesFromUrlOrGeocode(
            event.Location,
          );

          if (coordinates) {
            eventsWithLocations.push({
              ...event,
              circleId,
              circleName: circle?.circleName || "Unknown Circle",
              coordinates,
            });
          } else {
            console.log(
              `❌ Failed to extract coordinates from: ${event.Location}`,
            );
          }
        } else {
          console.log(
            `❌ No Location field or empty Location for event: ${event.activity || event.name || event.id}`,
          );
        }
      }
    }
    return eventsWithLocations;
  };

  // Load events with locations when data changes
  useEffect(() => {
    const loadEvents = async () => {
      if (circlesStatus === "succeeded" && circles && eventsByCircle) {
        setIsGeocoding(true);
        try {
          const events = await getEventsWithLocations();
          setEventsWithLocations(events);
        } catch (error) {
          console.error("❌ Error loading events:", error);
        } finally {
          setIsGeocoding(false);
        }
      } else {
        console.log("🔄 Not loading events - missing data");
      }
    };

    loadEvents();
  }, [profile, circles, circlesStatus, eventsByCircle]);

  return (
    <>
      <Helmet>
        <title>Explore Circles</title>
        <meta
          name="description"
          content="Discover events happening in nearest circles."
        />
      </Helmet>
      <div className="relative z-40 mt-16 h-screen">
        <MapContainer
          center={myLocation}
          zoom={12}
          scrollWheelZoom={true}
        className="h-full w-full"
        key={myLocation.toString()}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {/* Show user's circle events with locations */}
        {eventsWithLocations.map((event) => (
          <Marker
            key={`${event.circleId}-${event.id}`}
            position={event.coordinates}
            icon={customIcon}
          >
            <Popup>
              <div className="flex flex-col gap-2">
                <h3 className="text-secondary text-lg font-bold">
                  {event.activity || event.name || "Event"}
                </h3>
                <p className="text-sm text-text-600">
                  <strong>Circle:</strong> {event.circleName}
                </p>
                {event.place && (
                  <p className="text-sm text-text-600">
                    <strong>Place:</strong> {event.place}
                  </p>
                )}
                {event.day && (
                  <p className="text-sm text-text-600">
                    <strong>Date:</strong> {event.day}
                  </p>
                )}
                {event.Location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <a
                      href={event.Location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Simple position button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => getPosition()}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 text-text disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Get My Position"}
        </button>
      </div>
    </div>
    </>
  );
};

export default Explore;
