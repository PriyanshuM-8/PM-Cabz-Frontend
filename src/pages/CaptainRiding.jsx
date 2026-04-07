import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../baseURL';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const captainIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [48, 48], iconAnchor: [24, 48],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15, { animate: true }); }, [position, map]);
  return null;
}

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('captain-token')}` } });

export default function CaptainRiding() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { socket }              = useContext(SocketContext) || {};
  const { captain, setCaptain } = useContext(CaptainDataContext) || {};

  const rideData = location.state?.ride;

  const [otp,           setOtp]           = useState('');
  const [otpError,      setOtpError]      = useState('');
  const [startLoading,  setStartLoading]  = useState(false);
  const [rideStarted,   setRideStarted]   = useState(false);
  const [endLoading,    setEndLoading]    = useState(false);
  const [captainPos,    setCaptainPos]    = useState(null);
  const [rideComplete,  setRideComplete]  = useState(false);
  const [doneData,      setDoneData]      = useState(null);
  const [stats,         setStats]         = useState(null);
  const [rating,        setRating]        = useState(0);

  // LIVE LOCATION
  useEffect(() => {
    if (!socket || !captain?._id || !rideData?._id) return;
    socket.emit('join-ride', { rideId: rideData._id });
    const id = navigator.geolocation.watchPosition(
      p => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCaptainPos([loc.lat, loc.lng]);
        socket.emit('update-location-captain', { userId: captain._id, rideId: rideData._id, location: loc });
      },
      () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [socket, captain?._id, rideData?._id]);

  const startRide = async () => {
    if (otp.length !== 4) { setOtpError('Enter 4-digit OTP'); return; }
    setOtpError(''); setStartLoading(true);
    try {
      await axios.get(`${BASE_URL}/rides/start-ride`, { params: { rideId: rideData?._id, otp }, ...auth() });
      setRideStarted(true);
    } catch (e) { setOtpError(e.response?.data?.message || 'Invalid OTP'); }
    finally { setStartLoading(false); }
  };

  const endRide = async () => {
    setEndLoading(true);
    try {
      await axios.post(`${BASE_URL}/rides/end-ride`, { rideId: rideData?._id }, auth());
      try {
        const r = await axios.get(`${BASE_URL}/captains/profile`, auth());
        setStats(r.data.captain); if (setCaptain) setCaptain(r.data.captain);
      } catch (_) {}
      setDoneData(rideData); setRideComplete(true);
    } catch (e) { console.error(e); }
    finally { setEndLoading(false); }
  };

  // ── RIDE COMPLETE ──
  if (rideComplete && doneData) {
    const totalRides = stats?.totalRides ?? captain?.totalRides ?? 0;
    const earnings   = stats?.earnings   ?? captain?.earnings   ?? 0;
    const wallet     = stats?.wallet?.balance ?? captain?.wallet?.balance ?? 0;
    const commission = Math.round((doneData?.fare || 0) * 0.1);
    const net        = (doneData?.fare || 0) - commission;

    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10 max-w-sm mx-auto w-full">

          {/* ICON */}
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-green-400 text-4xl"></i>
            </div>
          </div>

          <h1 className="text-white text-3xl font-black mb-1 text-center">Trip Completed!</h1>
          <p className="text-gray-400 text-sm mb-6 text-center">Great job, keep it up 🚀</p>

          {/* EARNINGS */}
          <div className="w-full bg-gradient-to-br from-green-500/15 to-emerald-500/8 border border-green-500/25 rounded-3xl p-5 mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Trip Earnings</p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Trip Fare</span>
                <span className="text-white font-black text-lg">₹{doneData?.fare}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                <span className="text-gray-400 text-sm">Platform Fee (10%)</span>
                <span className="text-red-400 font-bold text-sm">−₹{commission}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-white font-bold">Your Earnings</span>
                <span className="text-green-400 font-black text-2xl">₹{net}</span>
              </div>
            </div>
          </div>

          {/* ROUTE */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
              <p className="text-gray-300 text-xs leading-relaxed">{doneData?.pickup}</p>
            </div>
            <div className="w-0.5 h-3 bg-gray-700 ml-[3px] mb-2" />
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
              <p className="text-gray-300 text-xs leading-relaxed">{doneData?.destination}</p>
            </div>
          </div>

          {/* STATS */}
          <div className="w-full grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: "ri-roadster-line",           val: totalRides,    label: "Rides",    c: "text-amber-400"  },
              { icon: "ri-money-rupee-circle-line", val: `₹${earnings}`, label: "Earnings", c: "text-green-400"  },
              { icon: "ri-wallet-3-fill",           val: `₹${wallet}`,  label: "Wallet",   c: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <i className={`${s.icon} ${s.c} text-xl mb-1 block`}></i>
                <p className="text-white font-black text-sm">{s.val}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* RATING */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
            <p className="text-gray-400 text-xs text-center mb-3">Rate this trip</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}
                  className={`text-3xl transition active:scale-90 ${s <= rating ? "scale-110" : "opacity-25"}`}>⭐</button>
              ))}
            </div>
          </div>

          <button onClick={() => navigate('/captain-home')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-base">
            <i className="ri-home-line text-lg"></i>Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)" }}>
        <div className="text-center">
          <p className="text-gray-400 mb-4">No ride data</p>
          <button onClick={() => navigate('/captain-home')} className="bg-amber-500 text-white px-6 py-2 rounded-xl font-semibold">Dashboard</button>
        </div>
      </div>
    );
  }

  const mapCenter = captainPos || [28.6139, 77.2090];

  return (
    <div className="h-screen flex flex-col bg-slate-950 relative overflow-hidden">

      {/* ── MAP — ALWAYS VISIBLE ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={15} className="h-full w-full" style={{ height: '100%' }} zoomControl={false}>
          <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {captainPos && <Marker position={captainPos} icon={captainIcon} />}
          {captainPos && <RecenterMap position={captainPos} />}
        </MapContainer>

        {/* MAP GRADIENT */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* ── TOP OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-10 sm:pt-12">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* LIVE */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-2xl border border-green-500/30 px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
            <span className="text-green-400 text-xs font-bold">LIVE</span>
          </div>

          {/* STATUS */}
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-1.5 rounded-full shadow-lg">
            <p className="text-white text-xs font-semibold">
              {rideStarted ? "🚗 Ride in progress" : "🚕 Picking up passenger"}
            </p>
          </div>

          {/* HOME */}
          <button onClick={() => navigate('/captain-home')}
            className="w-10 h-10 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
            <i className="ri-home-line text-white text-base"></i>
          </button>
        </div>
      </div>

      {/* ── PASSENGER CARD — MAP OVERLAY ── */}
      <div className="absolute top-24 sm:top-28 left-4 right-4 z-20 max-w-lg mx-auto">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-amber-500/20">
              {rideData?.user?.fullname?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{rideData?.user?.fullname || 'Passenger'}</p>
              {rideData?.user?.mobile && (
                <a href={`tel:${rideData.user.mobile}`} className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <i className="ri-phone-fill text-xs"></i>{rideData.user.mobile}
                </a>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-black text-xl">₹{rideData?.fare}</p>
            <p className="text-gray-400 text-xs">Cash</p>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-slate-900/98 backdrop-blur-3xl rounded-t-[2rem] border-t border-indigo-500/10 shadow-2xl max-w-lg mx-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/15 rounded-full" />
          </div>

          <div className="px-5 pb-8 pt-2 space-y-3">

            {/* ROUTE */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-0.5 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                  <div className="w-0.5 h-5 bg-gradient-to-b from-green-400/40 to-red-400/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div>
                    <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Pickup</p>
                    <p className="text-white text-sm font-medium leading-tight truncate">{rideData?.pickup}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Drop</p>
                    <p className="text-white text-sm font-medium leading-tight truncate">{rideData?.destination}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* OTP */}
            {!rideStarted && (
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Ask passenger for OTP</p>
                <div className="flex gap-3">
                  <input type="tel" maxLength={4} value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="flex-1 bg-white/6 border border-white/10 focus:border-amber-500/60 rounded-2xl px-4 py-3.5 text-white text-center text-2xl font-black tracking-[0.5em] outline-none transition"
                  />
                  <button onClick={startRide} disabled={startLoading || otp.length !== 4}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-50 text-white font-black px-6 rounded-2xl transition active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/20">
                    {startLoading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><i className="ri-play-fill"></i>Start</>}
                  </button>
                </div>
                {otpError && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><i className="ri-error-warning-line"></i>{otpError}</p>}
              </div>
            )}

            {/* END RIDE */}
            {rideStarted && (
              <div>
                <div className="flex items-center gap-2 mb-3 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-green-400 text-sm font-bold">Ride in progress</p>
                </div>
                <button onClick={endRide} disabled={endLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 text-base">
                  {endLoading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ending...</>
                    : <><i className="ri-flag-2-fill text-xl"></i>End Trip</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
