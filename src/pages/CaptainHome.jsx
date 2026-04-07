import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import { useTheme } from "../context/themeContext";
import ThemeToggle from "../components/ThemeToggle";
import CaptainNotification, {
  getAudioCtx,
} from "../components/CaptainNotification";
import LiveTracking from "../components/LiveTracking";
import WalletModal from "../components/WalletModal";
import {
  CaptainBottomNav,
  RideHistoryTab,
  PaymentHistoryTab,
  ProfileTab,
} from "../components/CaptainBottomNav";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("captain-token")}` },
});

export default function CaptainHome() {
  const { socket } = useContext(SocketContext) || {};
  const { captain } = useContext(CaptainDataContext) || {};
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [showWallet, setShowWallet] = useState(false);
  const [walletBal, setWalletBal] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [rideAccepted, setRideAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const isOnlineRef = useRef(false);

  const vehicleType = captain?.vehicleType || "car";
  const minBal = vehicleType === "car" ? 500 : 100;
  const isLow = walletBal !== null && walletBal < minBal;
  const firstName = captain?.fullname?.firstname || "Captain";

  // wallet
  useEffect(() => {
    if (!captain?._id) return;
    axios
      .get(`${BASE}/captains/wallet`, auth())
      .then((r) => setWalletBal(r.data.wallet?.balance ?? 0))
      .catch(() => {});
  }, [captain?._id]);

  // online toggle
  const goOnline = useCallback(async (val) => {
    isOnlineRef.current = val;
    setIsOnline(val);
    setToggling(true);
    try {
      await axios.post(
        `${BASE}/captains/toggle-online`,
        { isOnline: val },
        auth(),
      );
    } catch {
      isOnlineRef.current = !val;
      setIsOnline(!val);
    } finally {
      setToggling(false);
    }
  }, []);

  // socket join
  useEffect(() => {
    if (!captain?._id || !socket) return;
    const join = () =>
      socket.emit("join", { userId: captain._id, userType: "captain" });
    if (socket.connected) join();
    socket.on("connect", join);
    return () => socket.off("connect", join);
  }, [captain?._id, socket]);

  // auto online
  useEffect(() => {
    if (!captain?._id || !socket) return;
    const t = setTimeout(() => goOnline(true), 300);
    return () => clearTimeout(t);
  }, [captain?._id, socket, goOnline]);

  // location
  useEffect(() => {
    if (!isOnline || !captain?._id || !socket) return;
    const iv = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (p) =>
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: { lat: p.coords.latitude, lng: p.coords.longitude },
          }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }, 5000);
    return () => clearInterval(iv);
  }, [isOnline, captain?._id, socket]);

  // ride events
  useEffect(() => {
    if (!socket) return;
    const onNew = (d) => {
      if (!isOnlineRef.current) return;
      setRide(d);
      setShowNotif(true);
      setAcceptError("");
      navigator.vibrate?.([300, 100, 300]);
    };
    const onTaken = ({ rideId }) =>
      setRide((p) => {
        if (p?._id?.toString() === rideId?.toString()) {
          setShowNotif(false);
          return null;
        }
        return p;
      });
    const onCancelled = ({ rideId }) =>
      setRide((p) => {
        if (p?._id?.toString() === rideId?.toString()) {
          setShowNotif(false);
          return null;
        }
        return p;
      });
    socket.on("new-ride", onNew);
    socket.on("ride-accepted", onTaken);
    socket.on("ride-cancelled", onCancelled);
    return () => {
      socket.off("new-ride", onNew);
      socket.off("ride-accepted", onTaken);
      socket.off("ride-cancelled", onCancelled);
    };
  }, [socket]);

  // accept
  const acceptRide = useCallback(async () => {
    if (!ride?._id) return;
    setAcceptLoading(true);
    setAcceptError("");
    try {
      const res = await axios.post(
        `${BASE}/rides/confirm`,
        { rideId: ride._id },
        auth(),
      );
      setShowNotif(false);
      setRideAccepted(true);
      setTimeout(() => {
        navigate("/captain-riding", { state: { ride: res.data.ride } });
      }, 800);
    } catch (err) {
      const d = err.response?.data;
      if (d?.message === "insufficient_wallet")
        setAcceptError(`insufficient_wallet:${d.required}:${d.current}`);
      else if (d?.message === "Ride already accepted") {
        setAcceptError("Ride taken by another driver");
        setTimeout(() => {
          setShowNotif(false);
          setRide(null);
          setAcceptError("");
        }, 2000);
      } else setAcceptError(d?.message || "Failed to accept");
    } finally {
      setAcceptLoading(false);
    }
  }, [ride, navigate]);

  const rejectRide = useCallback(() => {
    setShowNotif(false);
    setRide(null);
    setAcceptError("");
  }, []);
  const logout = useCallback(async () => {
    await goOnline(false);
    navigate("/captain-logout");
  }, [goOnline, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const vehicleIcon =
    vehicleType === "motorcycle"
      ? "ri-motorbike-line"
      : vehicleType === "auto"
        ? "ri-taxi-line"
        : "ri-car-line";

  return (
    <div
      className={`h-screen w-full relative overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-gray-100'
      }`}
      onClick={getAudioCtx}
    >
      {/* ── MAP — sirf ride accept hone ke baad ── */}
      {rideAccepted && (
        <div className="absolute inset-0 z-0">
          <LiveTracking />
        </div>
      )}

      {/* ── PREMIUM BG jab map nahi hai ── */}
      {!rideAccepted && (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)"
              : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #cbd5e1 70%, #94a3b8 100%)",
          }}
        >
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
            isDark ? 'bg-amber-500/8' : 'bg-amber-400/15'
          }`} />
          <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none ${
            isDark ? 'bg-violet-600/10' : 'bg-violet-500/20'
          }`} />
          <div className={`absolute top-1/3 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${
            isDark ? 'bg-blue-500/8' : 'bg-blue-400/15'
          }`} />
        </div>
      )}

      {/* ── GRADIENT OVERLAYS (sirf map pe) ── */}
      {rideAccepted && (
        <>
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/80 to-transparent z-[1] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/60 to-transparent z-[1] pointer-events-none" />
        </>
      )}

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-10 sm:pt-12">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* PROFILE */}
          <div className={`flex items-center gap-2.5 backdrop-blur-2xl border rounded-2xl px-3 py-2 shadow-2xl ${
            isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-gray-200'
          }`}>
            {captain?.profilePic ? (
              <img
                src={captain.profilePic}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/20"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white">
                {firstName[0]}
              </div>
            )}
            <div>
              <p className={`text-sm font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {firstName}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-400 shadow-[0_0_4px_#4ade80]" : "bg-gray-500"}`}
                />
                <span
                  className={`text-[11px] font-semibold ${isOnline ? "text-green-400" : "text-gray-500"}`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          
          <ThemeToggle />

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWallet(true)}
              className={`flex items-center gap-1.5 backdrop-blur-2xl border rounded-2xl px-3 py-2 shadow-2xl transition active:scale-95 ${
                isLow 
                  ? "bg-red-500 border-red-400/60" 
                  : isDark 
                    ? "bg-black/60 border-white/10" 
                    : "bg-white/80 border-gray-200"
              }`}
            >
              <i
                className={`ri-wallet-3-fill text-sm ${isLow ? "text-white" : "text-violet-400"}`}
              ></i>
              <span
                className={`text-xs font-black ${isLow ? "text-white" : "text-violet-300"}`}
              >
                ₹{walletBal ?? "—"}
              </span>
              {isLow && <i className="ri-alert-fill text-white text-xs"></i>}
            </button>
            <button
              onClick={logout}
              className={`w-10 h-10 backdrop-blur-2xl border rounded-2xl flex items-center justify-center shadow-2xl ${
                isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-gray-200'
              }`}
            >
              <i className={`ri-logout-box-r-line text-base ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* ── OFFLINE CENTER OVERLAY ── */}
      {!isOnline && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center px-6">
            {/* PULSING RING */}
            <div className={`relative w-36 h-36 mx-auto mb-6 ${
              isDark ? '' : 'opacity-80'
            }`}>
              <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
                isDark ? 'border-white/5' : 'border-gray-300/50'
              }`} />
              <div className={`absolute inset-4 rounded-full border backdrop-blur-xl flex items-center justify-center ${
                isDark ? 'border-white/10 bg-black/40' : 'border-gray-300 bg-white/60'
              }`}>
                <i className={`${vehicleIcon} text-4xl ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}></i>
              </div>
            </div>
            <p className={`font-black text-2xl mb-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              You're Offline
            </p>
            <p className={`text-sm mb-8 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Go online to start earning
            </p>
            <button
              onClick={() => goOnline(true)}
              disabled={toggling}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black px-12 py-4 rounded-2xl shadow-2xl shadow-amber-500/40 transition active:scale-95 flex items-center gap-2.5 mx-auto text-base"
            >
              {toggling ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <i className="ri-wifi-line text-xl"></i>
              )}
              Go Online
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className={`backdrop-blur-3xl rounded-t-[2rem] shadow-2xl max-w-lg mx-auto transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/98 border-t border-white/8' 
            : 'bg-white/95 border-t border-gray-200'
        }`}>
          {/* HANDLE */}
          <div className="flex justify-center pt-3 pb-1">
            <div className={`w-10 h-1 rounded-full ${
              isDark ? 'bg-white/15' : 'bg-gray-300'
            }`} />
          </div>

          {/* ── HOME TAB ── */}
          {activeTab === "home" && (
            <>
              {/* STATS ROW */}
              <div className={`flex items-center px-5 py-3 gap-0 transition-colors duration-300 ${
                isDark ? 'border-b border-white/5' : 'border-b border-gray-100'
              }`}>
                {[
                  { label: "Earnings", value: `₹${captain?.earnings || 0}`, color: "text-green-400" },
                  { label: "Rides", value: captain?.totalRides || 0, color: isDark ? "text-white" : "text-gray-900" },
                  { label: "Rating", value: `★ ${captain?.rating || "5.0"}`, color: "text-amber-400" },
                ].map((s, i) => (
                  <div key={s.label} className={`flex-1 text-center ${i < 2 ? (isDark ? "border-r border-white/8" : "border-r border-gray-200") : ""}`}>
                    <p className={`font-black text-lg leading-tight ${s.color}`}>{s.value}</p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>{s.label}</p>
                  </div>
                ))}
                <div className="ml-3">
                  <button
                    onClick={() => goOnline(!isOnlineRef.current)}
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition active:scale-95 whitespace-nowrap ${
                      isOnline 
                        ? "bg-green-500/15 border-green-500/30 text-green-400" 
                        : (isDark ? "bg-white/5 border-white/15 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600")
                    }`}
                  >
                    {toggling ? (
                      <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-gray-500"}`} />
                    )}
                    {isOnline ? "Online" : "Offline"}
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* VEHICLE ROW */}
                <div className={`flex items-center justify-between border rounded-2xl px-4 py-3 transition-colors duration-300 ${
                  isDark ? 'bg-white/4 border-white/8' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <i className={`${vehicleIcon} text-amber-400 text-lg`}></i>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>{captain?.vehicle?.vehicleModel || "Vehicle"}</p>
                      <p className={`text-xs capitalize ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}>{vehicleType}</p>
                    </div>
                  </div>
                  <div className={`border rounded-xl px-4 py-1.5 transition-colors duration-300 ${
                    isDark ? 'bg-white/8 border-white/12' : 'bg-white border-gray-300'
                  }`}>
                    <p className={`font-black text-sm tracking-widest ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{captain?.vehicle?.plate || "----"}</p>
                  </div>
                </div>

                {/* WALLET ROW */}
                <button
                  onClick={() => setShowWallet(true)}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 border transition active:scale-[0.98] ${
                    isLow 
                      ? "bg-red-500/10 border-red-500/25" 
                      : (isDark ? "bg-violet-500/8 border-violet-500/20" : "bg-violet-50 border-violet-200")
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isLow 
                        ? "bg-red-500/20 border border-red-500/30" 
                        : (isDark ? "bg-violet-500/15 border border-violet-500/25" : "bg-violet-100 border border-violet-300")
                    }`}>
                      <i className={`ri-wallet-3-fill text-base ${isLow ? "text-red-400" : "text-violet-400"}`}></i>
                    </div>
                    <div className="text-left">
                      <p className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}>Wallet Balance</p>
                      <p className={`font-black text-base leading-tight ${
                        isLow ? "text-red-400" : (isDark ? "text-violet-300" : "text-violet-600")
                      }`}>
                        ₹{walletBal?.toLocaleString("en-IN") ?? "..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLow && (
                      <span className="text-xs text-red-400 font-bold bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">Low</span>
                    )}
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      isLow ? "bg-red-500 text-white" : "bg-violet-600 text-white"
                    }`}>
                      <i className="ri-add-line"></i>Add
                    </div>
                  </div>
                </button>

                {/* WAITING */}
                {isOnline && (
                  <div className="flex items-center justify-center gap-2 py-0.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>Waiting for ride requests...</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── RIDE HISTORY TAB ── */}
          {activeTab === "history" && (
            <div className="px-5 py-4">
              <p className={`font-black text-base mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Ride History</p>
              <RideHistoryTab />
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === "payments" && (
            <div className="px-5 py-4">
              <p className={`font-black text-base mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Payment History</p>
              <PaymentHistoryTab />
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="px-5 py-4">
              <ProfileTab
                captain={captain}
                isOnline={isOnline}
                walletBal={walletBal}
                onLogout={logout}
              />
            </div>
          )}

          {/* BOTTOM NAV */}
          <CaptainBottomNav active={activeTab} onChange={handleTabChange} />
        </div>
      </div>

      {/* NOTIFICATION */}
      {showNotif && (
        <CaptainNotification
          ride={ride}
          onClose={rejectRide}
          onAccept={acceptRide}
          loading={acceptLoading}
          error={acceptError}
          onOpenWallet={() => setShowWallet(true)}
        />
      )}

      {/* WALLET */}
      {showWallet && (
        <WalletModal
          captain={captain}
          onClose={() => setShowWallet(false)}
          onSuccess={(w) => setWalletBal(w?.balance ?? 0)}
        />
      )}
    </div>
  );
} 
 