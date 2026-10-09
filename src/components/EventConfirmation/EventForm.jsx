import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ModalHeading from "../ui/Modal/ModalHeading/ModalHeading";
import Input from "../ui/Input/Input";
import SendBtn from "../ui/ReactBits/SendBtn/SendBtn";
import { doc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase-config";
import { useParams } from "react-router";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom hook for map click events
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

// Custom marker icon
const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function EventForm({ event, onClose }) {
  const { t } = useTranslation();
  let { circleId } = useParams();

  // Local state for editable fields
  const [activity, setActivity] = useState(event.activity || "");
  const [place, setPlace] = useState(event.place || "");
  const [day, setDay] = useState(event.day || "");
  const [location, setLocation] = useState(event.Location || "");

  // Map state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([30.0444, 31.2357]); // Default to Cairo, Egypt
  const [showMap, setShowMap] = useState(false);

  // Ref for the map container
  const mapRef = useRef(null);

  // Handle location selection from map
  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng);

    // Reverse geocode to get address (you can enhance this with a geocoding service)
    const { lat, lng } = latlng;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    setLocation(mapsUrl);

    // Update map center to show the selected location
    setMapCenter([lat, lng]);
  };

  // Toggle map visibility
  const toggleMap = () => {
    setShowMap(!showMap);
  };

  // Clear selected location
  const clearLocation = () => {
    setSelectedLocation(null);
    setLocation("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!activity.trim() || !place.trim() || !day) {
      alert(t("Please fill all required fields."));
      return;
    }

    try {
      const eventRef = doc(db, "circles", circleId, "events", event.id);
      await updateDoc(eventRef, {
        activity: activity.trim(),
        place: place.trim(),
        day,
        Location: location.trim(),
        coordinates: selectedLocation ? {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        } : null,
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });

      // Events planned on mobile wait in "Pending Confirmation"; move the
      // active poll forward so both apps show the confirmed event.
      const pollsSnapshot = await getDocs(collection(db, "circles", circleId, "polls"));
      const activePoll = pollsSnapshot.docs.find((pollDoc) => !pollDoc.data().archived);
      if (activePoll && activePoll.data().stage === "Pending Confirmation") {
        await updateDoc(activePoll.ref, { stage: "Event Confirmed" });
      }
      onClose();
    } catch (err) {
      console.error("Error updating event:", err);
      alert(t("Failed to update the event."));
    }
  };

  return (
    <div className="relative w-full rounded-4xl backdrop-blur-lg">
      {/* Header */}
      <ModalHeading onClose={onClose} title={t("Event Confirmation")} />

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Activity */}
        <div>
          <label className="text-text mb-2 block text-lg font-medium">
            {t("Activity *")}
          </label>
          <Input
            label={t("what we're gonna do?")}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </div>

        {/* Place */}
        <div>
          <label className="text-text mb-2 block text-lg font-medium">
            {t("Place *")}
          </label>
          <Input
            label={t("where we're gonna go?")}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>

        {/* Location with Map */}
        <div>
          <label className="text-text mb-2 block text-lg font-medium">
            {t("Location")}
          </label>

          {/* Map Toggle Button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={toggleMap}
              className="bg-primary hover:bg-primary/80 rounded-xl px-4 py-2 text-text text-sm"
            >
              {showMap ? t("Hide Map") : t("Show Map & Pin Location")}
            </button>
          </div>

          {/* Map Container */}
          {showMap && (
            <div className="mb-3">
              <div className="relative">
                <div
                  ref={mapRef}
                  className="w-full h-64 rounded-xl overflow-hidden border border-text/20"
                >
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    className="rounded-xl"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Show selected marker if exists */}
                    {selectedLocation && (
                      <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                        icon={customIcon}
                      />
                    )}

                    {/* Map click handler */}
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                  </MapContainer>
                </div>

                {/* Map Instructions */}
                <div className="absolute top-2 left-2 bg-black/70 text-text text-xs px-2 py-1 rounded">
                  Click on the map to place a pin
                </div>
              </div>

              {/* Location Actions */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={clearLocation}
                  disabled={!selectedLocation}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-text-500 disabled:cursor-not-allowed rounded-xl px-3 py-2 text-text text-sm"
                >
                  {t("Clear Pin")}
                </button>

                {selectedLocation && (
                  <span className="text-xs text-text-400 self-center">
                    Pin placed at: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location Input Field */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("Enter place or address")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-inputsBg focus:ring-primary w-full rounded-xl border border-text/20 px-4 py-2 text-text focus:ring-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!place.trim()) {
                  alert(t("Please enter a place first."));
                  return;
                }
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
                setLocation(mapsUrl);
                window.open(mapsUrl, "_blank");
              }}
              className="bg-primary hover:bg-primary/80 rounded-xl px-4 py-2 text-text"
            >
              {t("Open in Maps")}
            </button>
          </div>
        </div>

        {/* Event Day */}
        <div>
          <label className="text-text mb-2 block text-lg font-medium">
            {t("Event Day *")}
          </label>
          <input
            type="date"
            className="bg-inputsBg focus:ring-primary w-full rounded-xl border border-text/20 px-4 py-2 text-text focus:ring-2 focus:outline-none"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <SendBtn type="submit" />
        </div>
      </form>
    </div>
  );
}
