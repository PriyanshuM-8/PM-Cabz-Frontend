import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import CaptainNotification, {
  getAudioCtx,
} from "../components/CaptainNotification";
import LiveTracking from "../components/LiveTracking";
import WalletModal from "../components/WalletModal";
import axios from "axios";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("captain-token")}` },
});

const CaptainHome = () => {
  const { socket } = useContext(SocketContext) || {};
  const { captain } = useContext(CaptainDataContext) || {};
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [showWallet, setShowWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const isOnlineRef = useRef(false);

  // ── FETCH WALLET ──
  useEffect(() => {
    if (!captain?._id) return;
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/captains/wallet`, authHeader())
      .then((res) => setWalletBalance(res.data.wallet?.balance ?? 0))
      .catch(() => {});
  }, [captain?._id]);

  const vehicleType = captain?.vehicleType || "car";
  const minBalance = vehicleType === "car" ? 500 : 100;
  const isWalletLow = walletBalance !== null && walletBalance < minBalance;

  // ── ONLINE STATUS ──
  const setOnlineStatus = useCallback(async (status) => {
    isOnlineRef.current = status;
    setIsOnline(status);
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/toggle-online`,
        { isOnline: status },
        authHeader(),
      );
    } catch {
      isOnlineRef.current = !status;
      setIsOnline(!status);
    }
  }, []);

  // ── SOCKET JOIN ──
  useEffect(() => {
    if (!captain?._id || !socket) return;
    const emitJoin = () =>
      socket.emit("join", { userId: captain._id, userType: "captain" });
    if (socket.connected) emitJoin();
    socket.on("connect", emitJoin);
    return () => socket.off("connect", emitJoin);
  }, [captain?._id, socket]);

  // ── AUTO ONLINE ──
  useEffect(() => {
    if (!captain?._id || !socket) return;
    const t = setTimeout(() => setOnlineStatus(true), 300);
    return () => clearTimeout(t);
  }, [captain?._id, socket, setOnlineStatus]);

  // ── LOCATION UPDATE ──
  useEffect(() => {
    if (!isOnline || !captain?._id || !socket) return;
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline, captain?._id, socket]);

  // ── RIDE EVENTS ──
  useEffect(() => {
    if (!socket) return;

    const handleNewRide = (data) => {
      if (!isOnlineRef.current) return;
      setRide(data);
      setShowNotification(true);
      setAcceptError("");
      navigator.vibrate?.([300, 100, 300]);
    };

    // Another captain accepted — dismiss notification
    const handleRideAccepted = ({ rideId, captainId }) => {
      setRide((prev) => {
        if (prev?._id?.toString() === rideId?.toString()) {
          setShowNotification(false);
          return null;
        }
        return prev;
      });
    };

    socket.on("new-ride", handleNewRide);
    socket.on("ride-accepted", handleRideAccepted);
    return () => {
      socket.off("new-ride", handleNewRide);
      socket.off("ride-accepted", handleRideAccepted);
    };
  }, [socket]);

  // ── ACCEPT ──
  const acceptRide = useCallback(async () => {
    if (!ride?._id) return;
    setAcceptLoading(true);
    setAcceptError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        { rideId: ride._id },
        authHeader(),
      );
      setShowNotification(false);
      navigate("/captain-riding", { state: { ride: res.data.ride } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.message === "insufficient_wallet") {
        setAcceptError(`insufficient_wallet:${data.required}:${data.current}`);
      } else if (data?.message === "Ride already accepted") {
        setAcceptError("Ride taken by another driver");
        setTimeout(() => {
          setShowNotification(false);
          setRide(null);
          setAcceptError("");
        }, 2000);
      } else {
        setAcceptError(data?.message || "Failed to accept ride");
      }
    } finally {
      setAcceptLoading(false);
    }
  }, [ride, navigate]);

  const rejectRide = useCallback(() => {
    setShowNotification(false);
    setRide(null);
    setAcceptError("");
  }, []);
  const handleLogout = useCallback(async () => {
    await setOnlineStatus(false);
    navigate("/captain-logout");
  }, [setOnlineStatus, navigate]);
  const toggleOnline = useCallback(
    () => setOnlineStatus(!isOnlineRef.current),
    [setOnlineStatus],
  );

  return (
    <div
      className="h-screen w-full relative overflow-hidden bg-zinc-950"
      onClick={getAudioCtx}
    >
      {/* MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <LiveTracking />
      </div>

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-950/60 via-transparent to-zinc-950/80 pointer-events-none" />

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-safe pt-4">
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {captain?.profilePic ? (
              <img
                src={`${import.meta.env.VITE_BASE_URL}/${captain.profilePic}`}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-500"
                alt="captain"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white">
                {captain?.fullname?.firstname?.[0]?.toUpperCase() || "C"}
              </div>
            )}
            <div>
              <p className="text-white text-sm font-bold leading-tight">
                {captain?.fullname?.firstname || "Captain"}
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-400 shadow-[0_0_4px_#4ade80]" : "bg-gray-500"}`}
                />
                <p className="text-xs text-gray-400">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 border ${
                isOnline
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-white/10 border-white/20 text-gray-300"
              }`}
            >
              {isOnline ? "🟢 Online" : "⚫ Go Online"}
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center transition hover:bg-red-500/30"
            >
              <i className="ri-logout-box-r-line text-red-400 text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM DASHBOARD */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-zinc-900/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl">
          {/* HANDLE */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

          {/* CAPTAIN PROFILE ROW */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {captain?.profilePic ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}/${captain.profilePic}`}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50"
                  alt="captain"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-black text-white">
                  {captain?.fullname?.firstname?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-base">
                  {captain?.fullname?.firstname}{" "}
                  {captain?.fullname?.lastname || ""}
                </p>
                <p className="text-gray-400 text-xs">
                  {captain?.vehicle?.vehicleModel || "Vehicle"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400 text-xs">★</span>
                  <span className="text-gray-300 text-xs">
                    {captain?.rating || "5.0"}
                  </span>
                  <span className="text-gray-600 text-xs mx-1">•</span>
                  <span className="text-gray-400 text-xs">
                    {captain?.totalRides || 0} rides
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-black text-2xl">
                ₹{captain?.earnings || "0"}
              </p>
              <p className="text-gray-500 text-xs">Today's earnings</p>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                icon: "ri-roadster-line",
                value: captain?.totalRides || "0",
                label: "Rides",
              },
              {
                icon: "ri-star-line",
                value: captain?.rating || "5.0",
                label: "Rating",
              },
              {
                icon: "ri-shield-check-line",
                value: "Active",
                label: "Status",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"
              >
                <i
                  className={`${stat.icon} text-amber-400 text-xl mb-1 block`}
                ></i>
                <p className="text-white font-bold text-sm">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* VEHICLE PLATE */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-3">
            <div className="flex items-center gap-2">
              <i className="ri-car-line text-amber-400"></i>
              <span className="text-gray-300 text-sm">
                {captain?.vehicle?.vehicleType || "Car"}
              </span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1">
              <p className="text-white font-black text-sm tracking-widest">
                {captain?.vehicle?.plate || "----"}
              </p>
            </div>
          </div>

          {/* WALLET CARD */}
          <button
            onClick={() => setShowWallet(true)}
            className={`w-full rounded-2xl px-4 py-3.5 border transition active:scale-95 ${
              isWalletLow
                ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
                : "bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/15"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isWalletLow
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-violet-500/20 border border-violet-500/30"
                  }`}
                >
                  <i
                    className={`ri-wallet-3-fill text-base ${
                      isWalletLow ? "text-red-400" : "text-violet-400"
                    }`}
                  ></i>
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-xs">Wallet Balance</p>
                  <p
                    className={`font-black text-lg leading-tight ${
                      isWalletLow ? "text-red-400" : "text-violet-300"
                    }`}
                  >
                    {walletBalance === null
                      ? "..."
                      : `₹${walletBalance.toLocaleString("en-IN")}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isWalletLow && (
                  <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-red-400 text-xs font-bold">Low</span>
                  </div>
                )}
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    isWalletLow
                      ? "bg-red-500 border-red-400 text-white"
                      : "bg-violet-600 border-violet-500 text-white"
                  }`}
                >
                  <i className="ri-add-line"></i>
                  Add Money
                </div>
              </div>
            </div>
            {isWalletLow && (
              <div className="mt-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-left">
                <p className="text-red-400 text-xs font-semibold">
                  ⚠️ Min ₹{minBalance} required to accept rides · Add ₹
                  {minBalance - (walletBalance || 0)} more
                </p>
              </div>
            )}
          </button>

          {/* WAITING INDICATOR */}
          {isOnline && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-xs">
                Waiting for ride requests...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION */}
      {showNotification && (
        <CaptainNotification
          ride={ride}
          onClose={rejectRide}
          onAccept={acceptRide}
          loading={acceptLoading}
          error={acceptError}
          onOpenWallet={() => setShowWallet(true)}
        />
      )}

      {/* WALLET MODAL */}
      {showWallet && (
        <WalletModal
          captain={captain}
          onClose={() => setShowWallet(false)}
          onSuccess={(w) => setWalletBalance(w?.balance ?? 0)}
        />
      )}
    </div>
  );
};

export default CaptainHome;
