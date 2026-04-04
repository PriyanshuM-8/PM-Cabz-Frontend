import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const captainIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('captain-token')}` },
});

const CaptainRiding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext) || {};
  const { captain, setCaptain } = useContext(CaptainDataContext) || {};

  const rideData = location.state?.ride;

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [startLoading, setStartLoading] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [captainPos, setCaptainPos] = useState(null);
  const [rideComplete, setRideComplete] = useState(false);
  const [completedRideData, setCompletedRideData] = useState(null);
  const [captainStats, setCaptainStats] = useState(null);
  const [rating, setRating] = useState(0);

  // ── LIVE LOCATION ──
  useEffect(() => {
    if (!socket || !captain?._id || !rideData?._id) return;
    socket.emit('join-ride', { rideId: rideData._id });
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCaptainPos([loc.lat, loc.lng]);
        socket.emit('update-location-captain', {
          userId: captain._id,
          rideId: rideData._id,
          location: loc,
        });
      },
      (err) => console.warn('Location error:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, captain?._id, rideData?._id]);

  const startRide = async () => {
    if (!otp || otp.length !== 4) { setOtpError('Enter 4-digit OTP'); return; }
    setOtpError('');
    setStartLoading(true);
    try {
      await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/start-ride`,
        { params: { rideId: rideData?._id, otp }, ...authHeader() }
      );
      setRideStarted(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setStartLoading(false);
    }
  };

  const endRide = async () => {
    setEndLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/end-ride`,
        { rideId: rideData?._id },
        authHeader()
      );

      // fetch updated captain stats
      try {
        const profileRes = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/captains/profile`,
          authHeader()
        );
        const updatedCaptain = profileRes.data.captain;
        setCaptainStats(updatedCaptain);
        if (setCaptain) setCaptain(updatedCaptain);
      } catch (_) {}

      setCompletedRideData(rideData);
      setRideComplete(true);
    } catch (err) {
      console.error('End ride error:', err.response?.data?.message || err.message);
    } finally {
      setEndLoading(false);
    }
  };

  // ── RIDE COMPLETE SCREEN ──
  if (rideComplete && completedRideData) {
    const totalRides = captainStats?.totalRides ?? (captain?.totalRides ?? 0);
    const earnings = captainStats?.earnings ?? (captain?.earnings ?? 0);
    const walletBalance = captainStats?.wallet?.balance ?? (captain?.wallet?.balance ?? 0);

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 relative overflow-hidden">
        {/* BG GLOW */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">

          {/* SUCCESS ICON */}
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center text-4xl">
              🏁
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40">
              <i className="ri-check-line text-white text-sm font-bold"></i>
            </div>
          </div>

          <h1 className="text-3xl font-black text-white text-center mb-1">Ride Complete!</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Great job! Keep it up 🚀</p>

          {/* RIDE SUMMARY CARD */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Ride Summary</p>

            {/* PASSENGER */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-black text-white text-base">
                {completedRideData?.user?.fullname?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{completedRideData?.user?.fullname || 'Passenger'}</p>
                <p className="text-gray-500 text-xs">{completedRideData?.user?.mobile || ''}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-amber-400 font-black text-2xl">₹{completedRideData?.fare}</p>
                <p className="text-gray-500 text-xs">Cash</p>
              </div>
            </div>

            {/* ROUTE */}
            <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
                <p className="text-gray-300 text-xs leading-relaxed">{completedRideData?.pickup}</p>
              </div>
              <div className="w-0.5 h-3 bg-gradient-to-b from-green-400/30 to-red-400/30 ml-[3px]" />
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
                <p className="text-gray-300 text-xs leading-relaxed">{completedRideData?.destination}</p>
              </div>
            </div>

            {/* VEHICLE */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-car-line text-amber-400 text-sm"></i>
                <span className="text-gray-400 text-xs">{completedRideData?.vehicleType || captain?.vehicle?.vehicleType || 'Vehicle'}</span>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1">
                <p className="text-white font-black text-xs tracking-widest">{captain?.vehicle?.plate || '----'}</p>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <i className="ri-roadster-line text-amber-400 text-xl mb-1 block"></i>
              <p className="text-white font-black text-lg leading-tight">{totalRides}</p>
              <p className="text-gray-500 text-xs">Total Rides</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <i className="ri-money-rupee-circle-line text-green-400 text-xl mb-1 block"></i>
              <p className="text-white font-black text-lg leading-tight">₹{earnings}</p>
              <p className="text-gray-500 text-xs">Earnings</p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3 text-center">
              <i className="ri-wallet-3-fill text-violet-400 text-xl mb-1 block"></i>
              <p className="text-violet-300 font-black text-lg leading-tight">₹{walletBalance}</p>
              <p className="text-gray-500 text-xs">Wallet</p>
            </div>
          </div>

          {/* RATING */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
            <p className="text-gray-400 text-xs text-center mb-3">How was this ride?</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`text-3xl transition active:scale-90 ${s <= rating ? 'scale-110' : 'opacity-40'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* GO HOME BUTTON */}
          <button
            onClick={() => navigate('/captain-home')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 text-base flex items-center justify-center gap-2"
          >
            <i className="ri-home-line text-lg"></i>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-gray-400 mb-4">No ride data found</p>
          <button onClick={() => navigate('/captain-home')} className="bg-amber-500 px-6 py-2 rounded-xl font-semibold">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative flex flex-col bg-zinc-950">

      {/* MAP */}
      <div className="flex-1 relative overflow-hidden">
        {captainPos ? (
          <MapContainer center={captainPos} zoom={15} className="h-full w-full" style={{ height: '100%' }}>
            <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={captainPos} icon={captainIcon} />
            <RecenterMap position={captainPos} />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-zinc-900">
            <p className="text-gray-400 text-sm">Getting location... </p>
          </div>
        )}

        <button
          onClick={() => navigate('/captain-home')}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-zinc-900/90 border border-white/10 rounded-full flex items-center justify-center"
        >
          <i className="ri-home-line text-white"></i>
        </button>

        <div className="absolute top-4 left-4 z-20 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-white text-xs font-semibold">LIVE</span>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="bg-zinc-900 border-t border-white/10 px-5 py-5">

        {/* PASSENGER INFO */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-lg">
              {rideData?.user?.fullname?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{rideData?.user?.fullname || 'Passenger'}</p>
              {rideData?.user?.mobile && (
                <a href={`tel:${rideData.user.mobile}`} className="flex items-center gap-1 text-green-400 text-xs font-semibold mt-0.5">
                  <i className="ri-phone-fill text-xs"></i>
                  {rideData.user.mobile}
                </a>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-xl">₹{rideData?.fare}</p>
            <p className="text-gray-500 text-xs">Cash</p>
          </div>
        </div>

        {/* ROUTE */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm truncate">{rideData?.pickup}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm truncate">{rideData?.destination}</p>
          </div>
        </div>

        {/* OTP SECTION */}
        {!rideStarted && (
          <div className="mb-4">
            <p className="text-gray-400 text-xs mb-2">Ask passenger for OTP to start ride</p>
            <div className="flex gap-3">
              <input
                type="tel"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit OTP"
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg font-bold tracking-widest outline-none focus:border-amber-500 transition"
              />
              <button
                onClick={startRide}
                disabled={startLoading}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-bold px-5 rounded-xl transition active:scale-95 flex items-center gap-2"
              >
                {startLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start'}
              </button>
            </div>
            {otpError && <p className="text-red-400 text-xs mt-2">⚠️ {otpError}</p>}
          </div>
        )}

        {/* RIDE STARTED */}
        {rideStarted && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <p className="text-green-400 text-sm font-semibold">Ride in progress</p>
            </div>

            <button
              onClick={endRide}
              disabled={endLoading}
              className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              {endLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Ending Ride...</>
                : '🏁 End Ride'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptainRiding;
