import { useEffect, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { SocketContext } from '../context/SocketContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const captainIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

const BASE = import.meta.env.VITE_BASE_URL;

const Riding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  const [rideData, setRideData] = useState(location.state?.ride || null);
  const [captainPos, setCaptainPos] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [rideEnded, setRideEnded] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);

  // USER LOCATION
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // SOCKET
  useEffect(() => {
    if (!socket) return;
    if (rideData?._id) socket.emit('join-ride', { rideId: rideData._id });

    const onAccepted = (data) => {
      const merged = { ...(data.ride || data), captain: data.captain || (data.ride || data).captain };
      setRideData(merged);
    };
    const onCaptainLoc = ({ location: loc }) => {
      if (loc?.lat && loc?.lng) setCaptainPos([loc.lat, loc.lng]);
    };
    const onRideStarted = (data) => { setRideStarted(true); setRideData(data); };
    const onRideEnded = () => { setRideEnded(true); };

    socket.on('ride-accepted', onAccepted);
    socket.on('captain-location-updated', onCaptainLoc);
    socket.on('ride-started', onRideStarted);
    socket.on('ride-ended', onRideEnded);

    return () => {
      socket.off('ride-accepted', onAccepted);
      socket.off('captain-location-updated', onCaptainLoc);
      socket.off('ride-started', onRideStarted);
      socket.off('ride-ended', onRideEnded);
    };
  }, [socket, rideData?._id]);

  // ── THANK YOU SCREEN ──
  if (rideEnded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-green-950/30" />
        <div className="relative z-10 w-full max-w-sm">
          {/* ICON */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center text-5xl">
              🎉
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <i className="ri-check-line text-white text-sm font-bold"></i>
            </div>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Thanks for Riding!</h1>
          <p className="text-gray-400 text-sm mb-8">Hope you had a great experience 🚖</p>

          {/* SUMMARY CARD */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-5 text-left">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Ride Summary</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-tight">{rideData?.pickup}</p>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-green-400/30 to-red-400/30 ml-[3px]" />
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-tight">{rideData?.destination}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-gray-400 text-sm">Total Fare</span>
              <span className="text-amber-400 font-black text-2xl">₹{rideData?.fare}</span>
            </div>
          </div>

          {/* RATING */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-6">
            <p className="text-gray-400 text-xs mb-3">Rate your experience</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} className="text-3xl hover:scale-125 transition active:scale-95">⭐</button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/book')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 text-base"
          >
            Book Another Ride 🚕
          </button>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Connecting to driver...</p>
        </div>
      </div>
    );
  }

  const captain = rideData?.captain;
  const mapCenter = captainPos || userPos || [28.6139, 77.2090];

  return (
    <div className="h-screen flex flex-col bg-zinc-950">

      {/* MAP */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={mapCenter} zoom={15} className="h-full w-full" style={{ height: '100%' }} zoomControl={false}>
          <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {captainPos && <Marker position={captainPos} icon={captainIcon} />}
          {userPos && <Marker position={userPos} icon={userIcon} />}
          <RecenterMap position={captainPos || userPos} />
        </MapContainer>

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none z-10" />

        {/* LIVE BADGE */}
        <div className="absolute top-4 left-4 z-20 bg-zinc-900/90 backdrop-blur-sm border border-green-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
          <span className="text-green-400 text-xs font-bold">LIVE</span>
        </div>

        {/* STATUS BADGE */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full">
          <p className="text-white text-xs font-semibold">
            {rideStarted ? "🚗 Ride in progress" : "🚕 Driver on the way"}
          </p>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="bg-zinc-900 border-t border-white/10 px-5 pt-4 pb-6">

        {/* CAPTAIN CARD */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {captain?.profilePic ? (
                <img src={`${BASE}/${captain.profilePic}`} alt="Captain"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-black text-white">
                  {captain?.fullname?.firstname?.[0]?.toUpperCase() || 'D'}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-base">
                  {captain?.fullname?.firstname} {captain?.fullname?.lastname || ''}
                </p>
                <p className="text-gray-400 text-xs">{captain?.vehicle?.vehicleModel || 'Vehicle'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400 text-xs">★</span>
                  <span className="text-gray-300 text-xs">{captain?.rating || '5.0'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                <p className="text-white font-black text-sm tracking-widest">{captain?.vehicle?.plate || '----'}</p>
              </div>
              {captain?.mobile && (
                <a href={`tel:${captain.mobile}`}
                  className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <i className="ri-phone-fill text-xs"></i>{captain.mobile}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* START OTP — only when ride not started */}
        {!rideStarted && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 mb-3 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Share OTP to start ride</p>
              <p className="text-amber-400 font-black text-4xl tracking-[0.4em]">{rideData?.otp}</p>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 text-center">
              <i className="ri-shield-keyhole-line text-amber-400 text-xl block mb-0.5"></i>
              <p className="text-amber-400 text-xs">OTP</p>
            </div>
          </div>
        )}

        {/* ROUTE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
            <p className="text-gray-300 text-xs truncate">{rideData?.pickup}</p>
          </div>
          <div className="w-0.5 h-3 bg-gradient-to-b from-green-400/30 to-red-400/30 ml-[3px]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
            <p className="text-gray-300 text-xs truncate">{rideData?.destination}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-gray-500 text-xs">Fare</span>
            <span className="text-amber-400 font-bold text-sm">₹{rideData?.fare} · Cash</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Riding;
