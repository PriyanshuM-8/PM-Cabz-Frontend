import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
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
    socket.on("new-ride", onNew);
    socket.on("ride-accepted", onTaken);
    return () => {
      socket.off("new-ride", onNew);
      socket.off("ride-accepted", onTaken);
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
      className="h-screen w-full relative overflow-hidden bg-slate-950"
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
            background:
              "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-0 w-64 h-64 bg-blue-500/8 rounded-full blur-[100px] pointer-events-none" />
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
          <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-3 py-2 shadow-2xl">
            {captain?.profilePic ? (
              <img
                src={`${BASE}/${captain.profilePic}`}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/20"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white">
                {firstName[0]}
              </div>
            )}
            <div>
              <p className="text-white text-sm font-bold leading-tight">
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

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWallet(true)}
              className={`flex items-center gap-1.5 backdrop-blur-2xl border rounded-2xl px-3 py-2 shadow-2xl transition active:scale-95 ${isLow ? "bg-red-500 border-red-400/60" : "bg-black/60 border-white/10"}`}
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
              className="w-10 h-10 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl"
            >
              <i className="ri-logout-box-r-line text-gray-300 text-base"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ── OFFLINE CENTER OVERLAY ── */}
      {!isOnline && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center px-6">
            {/* PULSING RING */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-ping" />
              <div className="absolute inset-4 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center">
                <i className={`${vehicleIcon} text-gray-400 text-4xl`}></i>
              </div>
            </div>
            <p className="text-white font-black text-2xl mb-1">
              You're Offline
            </p>
            <p className="text-gray-400 text-sm mb-8">
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
        <div className="bg-slate-900/98 backdrop-blur-3xl rounded-t-[2rem] border-t border-white/8 shadow-2xl max-w-lg mx-auto">
          {/* HANDLE */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/15 rounded-full" />
          </div>

          {/* ── HOME TAB ── */}
          {activeTab === "home" && (
            <>
              {/* STATS ROW */}
              <div className="flex items-center px-5 py-3 border-b border-white/5 gap-0">
                {[
                  { label: "Earnings", value: `₹${captain?.earnings || 0}`, color: "text-green-400" },
                  { label: "Rides", value: captain?.totalRides || 0, color: "text-white" },
                  { label: "Rating", value: `★ ${captain?.rating || "5.0"}`, color: "text-amber-400" },
                ].map((s, i) => (
                  <div key={s.label} className={`flex-1 text-center ${i < 2 ? "border-r border-white/8" : ""}`}>
                    <p className={`font-black text-lg leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                ))}
                <div className="ml-3">
                  <button
                    onClick={() => goOnline(!isOnlineRef.current)}
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition active:scale-95 whitespace-nowrap ${
                      isOnline ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-white/5 border-white/15 text-gray-400"
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
                <div className="flex items-center justify-between bg-white/4 border border-white/8 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <i className={`${vehicleIcon} text-amber-400 text-lg`}></i>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{captain?.vehicle?.vehicleModel || "Vehicle"}</p>
                      <p className="text-gray-500 text-xs capitalize">{vehicleType}</p>
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-1.5">
                    <p className="text-white font-black text-sm tracking-widest">{captain?.vehicle?.plate || "----"}</p>
                  </div>
                </div>

                {/* WALLET ROW */}
                <button
                  onClick={() => setShowWallet(true)}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 border transition active:scale-[0.98] ${
                    isLow ? "bg-red-500/10 border-red-500/25" : "bg-violet-500/8 border-violet-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLow ? "bg-red-500/20 border border-red-500/30" : "bg-violet-500/15 border border-violet-500/25"}`}>
                      <i className={`ri-wallet-3-fill text-base ${isLow ? "text-red-400" : "text-violet-400"}`}></i>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-500 text-xs">Wallet Balance</p>
                      <p className={`font-black text-base leading-tight ${isLow ? "text-red-400" : "text-violet-300"}`}>
                        ₹{walletBal?.toLocaleString("en-IN") ?? "..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLow && (
                      <span className="text-xs text-red-400 font-bold bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">Low</span>
                    )}
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${isLow ? "bg-red-500 text-white" : "bg-violet-600 text-white"}`}>
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
                    <p className="text-gray-500 text-xs">Waiting for ride requests...</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── RIDE HISTORY TAB ── */}
          {activeTab === "history" && (
            <div className="px-5 py-4">
              <p className="text-white font-black text-base mb-3">Ride History</p>
              <RideHistoryTab />
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === "payments" && (
            <div className="px-5 py-4">
              <p className="text-white font-black text-base mb-3">Payment History</p>
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
 