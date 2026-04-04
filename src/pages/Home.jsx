import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";

import LiveTracking from "../components/LiveTracking";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import Ridebook from "../components/Ridebook";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

  const stateData = location.state || JSON.parse(localStorage.getItem("rideData") || "{}");

  const [pickup, setPickup] = useState(stateData?.pickup || "");
  const [destination, setDestination] = useState(stateData?.destination || "");
  const [fare, setFare] = useState(stateData?.fare || {});
  const [vehicleType, setVehicleType] = useState(stateData?.vehicleType || null);

  // agar vehicleType already selected hai (/book se aaye) toh seedha confirmRide dikhao
  const [vehiclePanel, setVehiclePanel] = useState(
    !!(stateData?.pickup && stateData?.destination && stateData?.fare && !stateData?.vehicleType)
  );
  const [confirmRidePanel, setConfirmRidePanel] = useState(
    !!(stateData?.pickup && stateData?.destination && stateData?.vehicleType)
  );
  const [confirmRideDismissed, setConfirmRideDismissed] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [driverFound, setDriverFound] = useState(false);
  const [driverAcceptedBanner, setDriverAcceptedBanner] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);
  const [showRidebook, setShowRidebook] = useState(false);
  const [searchTimer, setSearchTimer] = useState(60);
  const [ride, setRide] = useState(null);

  // ================= SOCKET =================
  useEffect(() => {
    if (!user?._id || !socket) return;

    socket.emit("join", { userType: "user", userId: user._id });

    const handleRideAccepted = (data) => {
      const captainData = data.captain || null;
      const rideInfo = data.ride || data;
      const mergedRide = { ...rideInfo, captain: captainData };
      setSearchingDriver(false);
      setDriverFound(true);
      setRide(mergedRide);
      // show banner then navigate to /riding
      setDriverAcceptedBanner(true);
      setTimeout(() => {
        setDriverAcceptedBanner(false);
        navigate('/riding', { state: { ride: mergedRide } });
      }, 2500);
    };

    const handleRideStarted = (rideData) => {
      setDriverFound(false);
      setSearchingDriver(false);
      navigate("/riding", { state: { ride: rideData } });
    };

    socket.on("ride-accepted", handleRideAccepted);
    socket.on("ride-started", handleRideStarted);

    return () => {
      socket.off("ride-accepted", handleRideAccepted);
      socket.off("ride-started", handleRideStarted);
    };
  }, [user, socket, navigate]);

  // ================= 60 SEC COUNTDOWN =================
  useEffect(() => {
    if (!searchingDriver) {
      setSearchTimer(60);
      return;
    }

    const countdown = setInterval(() => {
      setSearchTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setSearchingDriver(false);
          setVehiclePanel(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [searchingDriver]);

  // ================= CREATE RIDE =================
  const createRide = useCallback(async () => {
    const res = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/rides/create`,
      { pickup, destination, vehicleType, fare: fare[vehicleType] },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setRide(res.data);
    setConfirmRidePanel(false);
    setSearchingDriver(true);
  }, [pickup, destination, vehicleType, fare]);

  // ================= RIDEBOOK SELECT =================
  const handleRidebookSelect = useCallback((data) => {
    setPickup(data.pickup);
    setDestination(data.destination);
    setFare(data.fare);
    setVehiclePanel(true);
    setShowRidebook(false);
    localStorage.setItem("rideData", JSON.stringify(data));
  }, []);

  const handleLogout = useCallback(() => navigate("/user/logout"), [navigate]);
  const handleBack = useCallback(() => navigate("/book"), [navigate]);

  const displayName = user?.fullname || user?.fullName?.firstName || "Hey";

  return (
    <div className="h-screen w-full relative overflow-hidden bg-zinc-950">

      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <LiveTracking pickup={pickup} destination={destination} />
      </div>

      {/* TOP BAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[92%]">
        <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl px-4 py-3 border border-white/10">

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <i className="ri-arrow-left-line text-white text-sm"></i>
              </button>
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-white">
                {typeof displayName === "string" ? displayName[0]?.toUpperCase() : "U"}
              </div>
              <p className="text-sm font-semibold text-white">👋 {displayName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-full font-semibold transition active:scale-95 border border-red-400/30"
            >
              Logout
            </button>
          </div>

          {/* LOCATION ROWS */}
          <div onClick={() => setShowRidebook(true)} className="cursor-pointer space-y-2">
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 border border-white/10 transition">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_6px_#4ade80]"></div>
              <p className="text-sm truncate">
                {pickup ? <span className="text-gray-100">{pickup}</span> : <span className="text-gray-500">Set pickup location</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 border border-white/10 transition">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0 shadow-[0_0_6px_#f87171]"></div>
              <p className="text-sm truncate">
                {destination ? <span className="text-gray-100">{destination}</span> : <span className="text-gray-500">Set destination</span>}
              </p>
              
            </div>
            
          </div>

          {(!pickup || !destination) && (
            <button
              onClick={() => setShowRidebook(true)}
              className="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold py-2.5 rounded-xl transition active:scale-95 shadow-lg shadow-amber-500/20"
            >
              + Book a Ride
            </button>
          )}
        </div>
      </div>

      {/* VEHICLE PANEL */}
      {vehiclePanel && !confirmRidePanel && !searchingDriver && !driverFound && (
        <div className="fixed bottom-0 w-full z-30">
          <div className="rounded-t-3xl shadow-2xl p-4">
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3"></div>
            <VehiclePanel
              selectVehicle={setVehicleType}
              fare={fare}
              setConfirmRidePanel={setConfirmRidePanel}
              setVehiclePanel={setVehiclePanel}
            />
          </div>
        </div>
      )}

      {/* CONFIRM RIDE */}
      {confirmRidePanel && !confirmRideDismissed && (
        <div className="fixed bottom-0 w-full z-40">
          <div className="rounded-t-3xl shadow-2xl p-4">
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3"></div>
            <ConfirmRide
              createRide={createRide}
              pickup={pickup}
              destination={destination}
              fare={fare}
              vehicleType={vehicleType}
              setConfirmRidePanel={setConfirmRidePanel}
              setVehiclePanel={setVehiclePanel}
              onDismiss={() => setConfirmRideDismissed(true)}
            />
          </div>
        </div>
      )}

      {/* RE-OPEN CONFIRM RIDE BUTTON */}
      {confirmRidePanel && confirmRideDismissed && !searchingDriver && !driverFound && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setConfirmRideDismissed(false)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-full shadow-2xl shadow-amber-500/40 transition active:scale-95"
          >
            <i className="ri-taxi-line text-lg"></i>
            View Booking
          </button>
        </div>
      )}

      {/* SEARCHING DRIVER */}
      {searchingDriver && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center px-6">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-36 h-36 rounded-full border border-amber-500/20 animate-ping"></div>
            <div className="absolute w-28 h-28 rounded-full border border-amber-500/30 animate-ping" style={{ animationDelay: "0.3s" }}></div>
            <div className="absolute w-20 h-20 rounded-full bg-amber-500/10 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-2xl shadow-2xl shadow-amber-500/40">
              🚕
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Finding Driver</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Notifying nearby drivers...</p>

          <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Time remaining</span>
              <span className="text-amber-400 font-bold text-sm">{searchTimer}s</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000"
                style={{ width: `${(searchTimer / 60) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
              <span className="text-gray-300 truncate">{pickup}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>
              <span className="text-gray-300 truncate">{destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-400 font-bold">₹</span>
              <span className="text-gray-300">{fare[vehicleType] || "--"}</span>
            </div>
          </div>

          <button
            onClick={() => { setSearchingDriver(false); setVehiclePanel(true); }}
            className="text-sm text-gray-500 hover:text-gray-300 underline transition"
          >
            Cancel Search
          </button>
        </div>
      )}

      {/* DRIVER ACCEPTED BANNER */}
      {driverAcceptedBanner && ride && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md px-6">
          <div className="w-full max-w-sm">
            {/* PULSE RING */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-green-500/30 border-2 border-green-500/50 flex items-center justify-center text-4xl">
                🚗
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <i className="ri-check-line text-white text-xs font-bold"></i>
              </div>
            </div>

            <h2 className="text-white text-2xl font-black text-center mb-1">Ride Accepted!</h2>
            <p className="text-green-400 text-sm text-center mb-6">Your driver is on the way</p>

            {/* CAPTAIN MINI CARD */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-4">
              {ride.captain?.profilePic ? (
                <img src={`${import.meta.env.VITE_BASE_URL}/${ride.captain.profilePic}`}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/50" alt="captain" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg font-black text-white">
                  {ride.captain?.fullname?.firstname?.[0]?.toUpperCase() || 'D'}
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-bold text-sm">
                  {ride.captain?.fullname?.firstname} {ride.captain?.fullname?.lastname || ''}
                </p>
                <p className="text-gray-400 text-xs">{ride.captain?.vehicle?.vehicleModel || 'Vehicle'}</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-lg px-2 py-1">
                <p className="text-white font-black text-xs tracking-wider">{ride.captain?.vehicle?.plate || '----'}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                    style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
              <p className="text-gray-500 text-xs">Opening ride screen...</p>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER FOUND — kept for fallback */}
      {driverFound && !driverAcceptedBanner && (
        <div className="fixed inset-0 z-[60] flex flex-col">
          <div className="flex-1" />
          <WaitingForDriver ride={ride} />
        </div>
      )}

      {/* WAITING FOR DRIVER */}
      {waitingForDriver && (
        <div className="fixed bottom-0 w-full z-50">
          <div className="rounded-t-3xl shadow-2xl p-4">
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3"></div>
            <WaitingForDriver ride={ride} />
          </div>
        </div>
      )}

      {/* RIDEBOOK MODAL */}
      {showRidebook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end">
          <div className="w-full bg-zinc-900 rounded-t-3xl shadow-2xl border border-white/10 overflow-visible">
            <div className="flex justify-between items-center px-5 pt-4 pb-2">
              <h3 className="font-bold text-white"> Update Location</h3>
              <button onClick={() => setShowRidebook(false)} className="text-gray-400 hover:text-white text-xl transition">✕</button>
            </div>
            <Ridebook onSelect={handleRidebookSelect} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
