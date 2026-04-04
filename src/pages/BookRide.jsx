import { useState, useRef, useContext, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserDataContext } from "../context/userContext";
import logo from "../photo/logo.png";

const vehicleImages = {
  car: "/src/photo/hatchback.png",
  auto: "/src/photo/tuktuk.png",
  motorcycle: "/src/photo/motorbike.png",
};

const vehicleLabels = {
  car:        { name: "Car",  desc: "Comfortable ride",  emoji: "🚗" },
  auto:       { name: "Auto", desc: "Affordable & quick", emoji: "🛺" },
  motorcycle: { name: "Bike", desc: "Fast & cheap",       emoji: "🏍" },
};

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

const BookRide = () => {
  const navigate = useNavigate();
  const { user }  = useContext(UserDataContext);

  const [pickup,            setPickup]            = useState("");
  const [destination,       setDestination]       = useState("");
  const [activeField,       setActiveField]       = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions,   setDestSuggestions]   = useState([]);
  const [panelOpen,         setPanelOpen]         = useState(false);
  const [fare,              setFare]              = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [locLoading,        setLocLoading]        = useState(false);
  const [error,             setError]             = useState("");

  const debounceRef = useRef(null);

  // ── Login ke baad sessionStorage se pending ride restore karo ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const saved = JSON.parse(sessionStorage.getItem("pendingRide") || "null");
    if (!saved?.pickup || !saved?.destination) return;
    sessionStorage.removeItem("pendingRide");
    setPickup(saved.pickup);
    setDestination(saved.destination);
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: { pickup: saved.pickup, destination: saved.destination },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFare(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchSuggestions = useCallback((value, setSuggestions) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!value || value.length < 3) return setSuggestions([]);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
          { params: { input: value.trim() } }
        );
        setSuggestions(res.data || []);
      } catch { setSuggestions([]); }
    }, 400);
  }, []);

  const handlePickupChange = (e) => {
    setPickup(e.target.value);
    setFare(null);
    fetchSuggestions(e.target.value, setPickupSuggestions);
  };

  const handleDestChange = (e) => {
    setDestination(e.target.value);
    setFare(null);
    fetchSuggestions(e.target.value, setDestSuggestions);
  };

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLocLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await reverseGeocode(coords.latitude, coords.longitude);
          setPickup(address);
          setFare(null);
          setPickupSuggestions([]);
        } catch {
          setError("Could not fetch address. Try typing manually.");
        } finally { setLocLoading(false); }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) setError("Location permission denied.");
        else setError("Could not get location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const getFare = async () => {
    if (!pickup.trim() || !destination.trim()) {
      setError("Please enter both pickup and destination");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        sessionStorage.setItem("pendingRide", JSON.stringify({ pickup: pickup.trim(), destination: destination.trim() }));
        navigate("/login");
        return;
      }
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        {
          params: { pickup: pickup.trim(), destination: destination.trim() },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFare(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.setItem("pendingRide", JSON.stringify({ pickup: pickup.trim(), destination: destination.trim() }));
        navigate("/login");
        return;
      }
      setError("Could not fetch fare. Check locations and try again.");
    } finally { setLoading(false); }
  };

  const handleVehicleSelect = (type) => {
    navigate("/home", { state: { pickup, destination, fare, vehicleType: type } });
  };

  const displayName = user?.fullname || "";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/6 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <img src={logo} alt="" className="rounded-4xl h-20 w-20" />
          </div>
        </div>

        {user?._id ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white shadow-md">
              {(displayName || "U")[0]?.toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-white text-xs font-semibold leading-tight">{displayName || "User"}</p>
              <button onClick={() => navigate("/user/logout")} className="text-gray-500 hover:text-red-400 text-xs transition">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate("/login")}
            className="text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full font-semibold hover:bg-amber-500/25 transition">
            Login
          </button>
        )}
      </div>

      {/* MAIN */}
      <div className="relative z-10 flex-1 px-4 pb-8 space-y-4">
        {user?._id && (
          <div className="px-1">
            <h2 className="text-white text-2xl font-black">Hey {displayName.split(" ")[0] || "there"} 👋</h2>
            <p className="text-gray-500 text-sm">Where are you going today?</p>
          </div>
        )}

        {/* BOOKING CARD */}
        <div className="bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl overflow-visible">
          <div className="px-5 pt-5 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Book a Ride</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">

            {/* PICKUP */}
            <div className="relative">
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                activeField === "pickup"
                  ? "border-green-400/60 bg-green-400/5 shadow-[0_0_0_3px_rgba(74,222,128,0.08)]"
                  : "border-white/10 bg-white/5"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_8px_#4ade80]" />
                <input
                  value={pickup}
                  onChange={handlePickupChange}
                  onFocus={() => { setActiveField("pickup"); setPanelOpen(true); }}
                  onBlur={() => setTimeout(() => { setPanelOpen(false); setActiveField(null); }, 200)}
                  className="bg-transparent outline-none flex-1 text-white placeholder-gray-500 text-sm"
                  placeholder="Pickup location"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); useCurrentLocation(); }}
                  className={`flex-shrink-0 px-3 py-1 cursor-pointer rounded-xl flex items-center justify-center gap-1.5 transition active:scale-90 ${
                    locLoading ? "bg-amber-500/20 border border-amber-500/30" : "bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30"
                  }`}
                  title="Use current location"
                >
                  {locLoading
                    ? <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                    : <><span className="text-white text-xs">Use location</span><i className="ri-focus-3-line text-amber-500 text-sm"></i></>}
                </button>
                {pickup && (
                  <button onMouseDown={(e) => { e.preventDefault(); setPickup(""); setFare(null); setPickupSuggestions([]); }}
                    className="flex-shrink-0 text-gray-500 hover:text-white transition">
                    <i className="ri-close-line text-sm"></i>
                  </button>
                )}
              </div>

              {panelOpen && activeField === "pickup" && pickupSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto animate-fadeIn">
                  {pickupSuggestions.map((item, i) => (
                    <div key={i} onMouseDown={() => { setPickup(item.description); setPickupSuggestions([]); setPanelOpen(false); setFare(null); }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/8 border-b border-white/5 last:border-none transition">
                      <div className="w-7 h-7 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <i className="ri-map-pin-line text-green-400 text-xs"></i>
                      </div>
                      <p className="text-sm text-gray-200 truncate">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONNECTOR */}
            <div className="flex items-center gap-3 px-4">
              <div className="flex flex-col items-center gap-1 ml-[1px]">
                <div className="w-0.5 h-1.5 bg-gray-700 rounded" />
                <div className="w-0.5 h-1.5 bg-gray-700 rounded" />
                <div className="w-0.5 h-1.5 bg-gray-700 rounded" />
              </div>
            </div>

            {/* DESTINATION */}
            <div className="relative">
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                activeField === "destination"
                  ? "border-red-400/60 bg-red-400/5 shadow-[0_0_0_3px_rgba(248,113,113,0.08)]"
                  : "border-white/10 bg-white/5"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0 shadow-[0_0_8px_#f87171]" />
                <input
                  value={destination}
                  onChange={handleDestChange}
                  onFocus={() => { setActiveField("destination"); setPanelOpen(true); }}
                  onBlur={() => setTimeout(() => { setPanelOpen(false); setActiveField(null); }, 200)}
                  className="bg-transparent outline-none flex-1 text-white placeholder-gray-500 text-sm"
                  placeholder="Where to?"
                />
                {destination && (
                  <button onMouseDown={(e) => { e.preventDefault(); setDestination(""); setFare(null); setDestSuggestions([]); }}
                    className="flex-shrink-0 text-gray-500 hover:text-white transition">
                    <i className="ri-close-line text-sm"></i>
                  </button>
                )}
              </div>

              {panelOpen && activeField === "destination" && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto animate-fadeIn">
                  {destSuggestions.map((item, i) => (
                    <div key={i} onMouseDown={() => { setDestination(item.description); setDestSuggestions([]); setPanelOpen(false); setFare(null); }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/8 border-b border-white/5 last:border-none transition">
                      <div className="w-7 h-7 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <i className="ri-map-pin-2-fill text-red-400 text-xs"></i>
                      </div>
                      <p className="text-sm text-gray-200 truncate">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <i className="ri-error-warning-line text-red-400 text-sm flex-shrink-0"></i>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* BOOK RIDE BUTTON */}
            {!fare && (
              <button
                onClick={getFare}
                disabled={loading || !pickup || !destination}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-base mt-1"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Calculating fare...</>
                  : <><i className="ri-taxi-line text-lg"></i>Book a Ride</>}
              </button>
            )}
          </div>
        </div>

        {/* VEHICLE SELECTION */}
        {fare && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-white font-black text-lg">Choose Vehicle</h3>
              <button onClick={() => setFare(null)} className="flex items-center gap-1 text-gray-500 hover:text-white text-sm transition">
                <i className="ri-arrow-left-line text-xs"></i> Change
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(vehicleLabels).map(([type, info]) => (
                <div key={type} onClick={() => handleVehicleSelect(type)}
                  className="flex items-center justify-between bg-zinc-900 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-2xl px-4 py-4 cursor-pointer transition active:scale-[0.98] shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 flex items-center justify-center">
                      <img src={vehicleImages[type]} alt={type} className="h-11 w-14 object-contain" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{info.emoji} {info.name}</p>
                      <p className="text-gray-500 text-xs">{info.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-black text-xl">₹{fare[type]}</p>
                    <p className="text-gray-600 text-xs">Estimated</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ROUTE SUMMARY */}
            <div className="mt-3 bg-zinc-900 border border-white/10 rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Route</p>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
                <p className="text-gray-300 text-sm leading-relaxed">{pickup}</p>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-green-400/30 to-red-400/30 ml-[3px] mb-2" />
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
                <p className="text-gray-300 text-sm leading-relaxed">{destination}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookRide;
