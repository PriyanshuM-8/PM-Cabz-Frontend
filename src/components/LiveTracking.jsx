import { useState, useEffect, useContext } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── ICONS ──────────────────────────────────────────────
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const pickupIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #22c55e"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destinationIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #ef4444"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const captainIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

// ── FIT BOUNDS ─────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60], animate: true });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: true });
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
}

// ── GEOCODE via Nominatim ──────────────────────────────
async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (_) {}
  return null;
}

// ── MAIN COMPONENT ─────────────────────────────────────
const LiveTracking = ({ pickup, destination }) => {
  const { socket } = useContext(SocketContext) || {};
  const { captain } = useContext(CaptainDataContext) || {};

  const [userPos, setUserPos] = useState(null);
  const [pickupPos, setPickupPos] = useState(null);
  const [destPos, setDestPos] = useState(null);
  const [locationError, setLocationError] = useState("");

  // ── USER GEOLOCATION ──
  useEffect(() => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocationError("");
        if (socket && captain?._id) {
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
        }
      },
      (err) => {
        if (err.code === 1) setLocationError("Location permission denied ❌");
        else if (err.code === 3) setLocationError("Location timeout ⏳");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [socket, captain?._id]);

  // ── GEOCODE PICKUP ──
  useEffect(() => {
    if (!pickup || pickup.length < 3) { setPickupPos(null); return; }
    geocode(pickup).then(setPickupPos);
  }, [pickup]);

  // ── GEOCODE DESTINATION ──
  useEffect(() => {
    if (!destination || destination.length < 3) { setDestPos(null); return; }
    geocode(destination).then(setDestPos);
  }, [destination]);

  // ── BOUNDS: fit all available points ──
  const allPoints = [userPos, pickupPos, destPos].filter(Boolean);
  const mapCenter = userPos || pickupPos || [28.6139, 77.2090];

  if (locationError && !userPos) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900">
        <div className="text-center px-6">
          <p className="text-red-400 text-sm mb-3">{locationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 text-white text-xs px-4 py-2 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userPos && !pickupPos) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900">
        <p className="text-gray-400 text-sm">Getting location... </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full"
        style={{ height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* USER / CAPTAIN CURRENT POSITION */}
        {userPos && <Marker position={userPos} icon={captain?._id ? captainIcon : userIcon} />}

        {/* PICKUP MARKER */}
        {pickupPos && (
          <>
            <Marker position={pickupPos} icon={pickupIcon} />
          </>
        )}

        {/* DESTINATION MARKER */}
        {destPos && (
          <>
            <Marker position={destPos} icon={destinationIcon} />
          </>
        )}

        {/* ROUTE LINE: pickup → destination */}
        {pickupPos && destPos && (
          <Polyline
            positions={[pickupPos, destPos]}
            pathOptions={{ color: "#f59e0b", weight: 4, opacity: 0.8, dashArray: "8 6" }}
          />
        )}

        {/* ROUTE LINE: user → pickup (if both exist) */}
        {userPos && pickupPos && (
          <Polyline
            positions={[userPos, pickupPos]}
            pathOptions={{ color: "#22c55e", weight: 3, opacity: 0.5, dashArray: "4 4" }}
          />
        )}

        <FitBounds positions={allPoints} />
      </MapContainer>

      {/* LEGEND */}
      {(pickupPos || destPos) && (
        <div className="absolute bottom-4 left-4 z-20 bg-zinc-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 space-y-1.5">
          {pickupPos && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white flex-shrink-0"></div>
              <p className="text-gray-300 text-xs truncate max-w-[140px]">{pickup}</p>
            </div>
          )}
          {destPos && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white flex-shrink-0"></div>
              <p className="text-gray-300 text-xs truncate max-w-[140px]">{destination}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
