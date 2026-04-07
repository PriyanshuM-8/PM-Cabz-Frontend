import { useState, useRef, useContext, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserDataContext } from "../context/userContext";
import { useTheme } from "../context/themeContext";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../photo/logo.png";
import hatchback from "../photo/hatchback.png";
import tuktuk from "../photo/tuktuk.png";
import motorbike from "../photo/motorbike.png";

const vehicleImages = {
  car: hatchback,
  auto: tuktuk,
  motorcycle: motorbike,
};

const vehicleLabels = {
  car: { name: "Car", desc: "Comfortable ride", emoji: "🚗" },
  auto: { name: "Auto", desc: "Affordable & quick", emoji: "🛺" },
  motorcycle: { name: "Bike", desc: "Fast & cheap", emoji: "🏍" },
};

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    { headers: { "Accept-Language": "en" } },
  );
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

const BookRide = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserDataContext);
  const { isDark } = useTheme();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("home");
  const [rideHistory, setRideHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      .get(`/rides/get-fare`, {
        params: { pickup: saved.pickup, destination: saved.destination },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFare(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `/rides/active-ride`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRideHistory(res.data ? [res.data] : []);
    } catch {
      // fetch all rides via a different approach — use user profile rides
      setRideHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") fetchHistory();
  };

  const fetchSuggestions = useCallback((value, setSuggestions) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!value || value.length < 3) return setSuggestions([]);
      try {
        const res = await axios.get(
          `/maps/get-suggestions`,
          { params: { input: value.trim() } },
        );
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      }
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
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await reverseGeocode(
            coords.latitude,
            coords.longitude,
          );
          setPickup(address);
          setFare(null);
          setPickupSuggestions([]);
        } catch {
          setError("Could not fetch address. Try typing manually.");
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) setError("Location permission denied.");
        else setError("Could not get location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
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
        sessionStorage.setItem(
          "pendingRide",
          JSON.stringify({
            pickup: pickup.trim(),
            destination: destination.trim(),
          }),
        );
        navigate("/login");
        return;
      }
      const res = await axios.get(
        `/rides/get-fare`,
        {
          params: { pickup: pickup.trim(), destination: destination.trim() },
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setFare(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.setItem(
          "pendingRide",
          JSON.stringify({
            pickup: pickup.trim(),
            destination: destination.trim(),
          }),
        );
        navigate("/login");
        return;
      }
      setError("Could not fetch fare. Check locations and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (type) => {
    navigate("/home", {
      state: { pickup, destination, fare, vehicleType: type },
    });
  };

  const displayName = user?.fullname || "";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-zinc-950' : 'bg-gray-50'
    }`}>
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
        isDark ? 'bg-amber-500/6' : 'bg-amber-400/10'
      }`} />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <img src={logo} alt="" className="rounded-4xl h-20 w-20" />
          </div>
        </div>
        
        <ThemeToggle />

        {user?._id ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white shadow-md">
              {(displayName || "U")[0]?.toUpperCase()}
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {displayName || "User"}
              </p>
              <button
                onClick={() => navigate("/user/logout")}
                className={`text-xs transition ${
                  isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full font-semibold hover:bg-amber-500/25 transition"
          >
            Login
          </button>
        )}
      </div>

      {/* MAIN */}
      <div className="relative z-10 flex-1 px-4 pb-8 space-y-4 max-w-2xl mx-auto w-full">
        {user?._id && (
          <div className="px-1">
            <h2 className={`text-2xl font-black ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Hey {displayName.split(" ")[0] || "there"} 👋
            </h2>
            <p className={`text-sm ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>Where are you going today?</p>
          </div>
        )}

        {/* BOOKING CARD */}
        <div className={`rounded-3xl shadow-2xl overflow-visible transition-colors duration-300 ${
          isDark 
            ? 'bg-zinc-900 border border-white/10' 
            : 'bg-white border border-gray-200 shadow-xl'
        }`}>
          <div className={`px-5 pt-5 pb-3 transition-colors duration-300 ${
            isDark ? 'border-b border-white/5' : 'border-b border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Book a Ride
              </p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* PICKUP */}
            <div className="relative">
              <div
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                  activeField === "pickup"
                    ? (isDark 
                        ? "border-green-400/60 bg-green-400/5 shadow-[0_0_0_3px_rgba(74,222,128,0.08)]" 
                        : "border-green-500 bg-green-50 shadow-[0_0_0_3px_rgba(34,197,94,0.1)]")
                    : (isDark 
                        ? "border-white/10 bg-white/5" 
                        : "border-gray-300 bg-gray-50")
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_8px_#4ade80]" />
                <input
                  value={pickup}
                  onChange={handlePickupChange}
                  onFocus={() => {
                    setActiveField("pickup");
                    setPanelOpen(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => {
                      setPanelOpen(false);
                      setActiveField(null);
                    }, 200)
                  }
                  className={`bg-transparent outline-none flex-1 text-sm ${
                    isDark 
                      ? 'text-white placeholder-gray-500' 
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Pickup location"
                />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    useCurrentLocation();
                  }}
                  className={`flex-shrink-0 px-2 -mx-2 py-1 cursor-pointer rounded-xl flex items-center justify-center gap-1.5 transition active:scale-90 ${
                    locLoading
                      ? "bg-amber-500/20 border border-amber-500/30"
                      : (isDark 
                          ? "bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30" 
                          : "bg-gray-100 hover:bg-amber-100 border border-gray-200 hover:border-amber-300")
                  }`}
                  title="Use current location"
                >
                  {locLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                  ) : (
                    <i className="ri-focus-3-line text-amber-500 text-sm"></i>
                  )}
                </button>
                {pickup && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setPickup("");
                      setFare(null);
                      setPickupSuggestions([]);
                    }}
                    className={`flex-shrink-0 transition ${
                      isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                )}
              </div>

              {panelOpen &&
                activeField === "pickup" &&
                pickupSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-[calc(100%+6px)] border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto animate-fadeIn ${
                    isDark ? 'bg-zinc-800 border-white/10' : 'bg-white border-gray-200'
                  }`}>
                    {pickupSuggestions.map((item, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setPickup(item.description);
                          setPickupSuggestions([]);
                          setPanelOpen(false);
                          setFare(null);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-none transition ${
                          isDark 
                            ? 'hover:bg-white/8 border-white/5' 
                            : 'hover:bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                        }`}>
                          <i className="ri-map-pin-line text-green-400 text-xs"></i>
                        </div>
                        <p className={`text-sm truncate ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* CONNECTOR */}
            <div className="flex items-center gap-3 px-4">
              <div className="flex flex-col items-center gap-1 ml-[1px]">
                <div className={`w-0.5 h-1.5 rounded ${
                  isDark ? 'bg-gray-700' : 'bg-gray-400'
                }`} />
                <div className={`w-0.5 h-1.5 rounded ${
                  isDark ? 'bg-gray-700' : 'bg-gray-400'
                }`} />
                <div className={`w-0.5 h-1.5 rounded ${
                  isDark ? 'bg-gray-700' : 'bg-gray-400'
                }`} />
              </div>
            </div>

            {/* DESTINATION */}
            <div className="relative">
              <div
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                  activeField === "destination"
                    ? (isDark 
                        ? "border-red-400/60 bg-red-400/5 shadow-[0_0_0_3px_rgba(248,113,113,0.08)]" 
                        : "border-red-500 bg-red-50 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]")
                    : (isDark 
                        ? "border-white/10 bg-white/5" 
                        : "border-gray-300 bg-gray-50")
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0 shadow-[0_0_8px_#f87171]" />
                <input
                  value={destination}
                  onChange={handleDestChange}
                  onFocus={() => {
                    setActiveField("destination");
                    setPanelOpen(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => {
                      setPanelOpen(false);
                      setActiveField(null);
                    }, 200)
                  }
                  className={`bg-transparent outline-none flex-1 text-sm ${
                    isDark 
                      ? 'text-white placeholder-gray-500' 
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Where to?"
                />
                {destination && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDestination("");
                      setFare(null);
                      setDestSuggestions([]);
                    }}
                    className={`flex-shrink-0 transition ${
                      isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                )}
              </div>

              {panelOpen &&
                activeField === "destination" &&
                destSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-[calc(100%+6px)] border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto animate-fadeIn ${
                    isDark ? 'bg-zinc-800 border-white/10' : 'bg-white border-gray-200'
                  }`}>
                    {destSuggestions.map((item, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setDestination(item.description);
                          setDestSuggestions([]);
                          setPanelOpen(false);
                          setFare(null);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-none transition ${
                          isDark 
                            ? 'hover:bg-white/8 border-white/5' 
                            : 'hover:bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                        }`}>
                          <i className="ri-map-pin-2-fill text-red-400 text-xs"></i>
                        </div>
                        <p className={`text-sm truncate ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* ERROR */}
            {error && (
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${
                isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
              }`}>
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
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating fare...
                  </>
                ) : (
                  <>
                    <i className="ri-taxi-line text-lg"></i>Book a Ride
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* VEHICLE SELECTION */}
        {fare && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className={`font-black text-lg ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Choose Vehicle</h3>
              <button
                onClick={() => setFare(null)}
                className={`flex items-center gap-1 text-sm transition ${
                  isDark ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className="ri-arrow-left-line text-xs"></i> Change
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(vehicleLabels).map(([type, info]) => (
                <div
                  key={type}
                  onClick={() => handleVehicleSelect(type)}
                  className={`flex items-center justify-between border rounded-2xl px-4 py-4 cursor-pointer transition active:scale-[0.98] shadow-lg ${
                    isDark 
                      ? 'bg-zinc-900 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5' 
                      : 'bg-white border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 flex items-center justify-center">
                      <img
                        src={vehicleImages[type]}
                        alt={type}
                        className="h-11 w-14 object-contain"
                      />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {info.emoji} {info.name}
                      </p>
                      <p className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}>{info.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-black text-xl">
                      ₹{fare[type]}
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-600' : 'text-gray-500'
                    }`}>Estimated</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ROUTE SUMMARY */}
            <div className={`mt-3 border rounded-2xl p-4 transition-colors duration-300 ${
              isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Route
              </p>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {pickup}
                </p>
              </div>
              <div className="w-0.5 h-4 bg-gradient-to-b from-green-400/30 to-red-400/30 ml-[3px] mb-2" />
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {destination}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className={`sticky bottom-0 z-30 backdrop-blur-xl border-t transition-colors duration-300 ${
        isDark ? 'bg-zinc-900/95 border-white/8' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
          {[
            { id: "home", icon: "ri-home-2-line", label: "Home" },
            { id: "services", icon: "ri-navigation-line", label: "Services" },
            { id: "history", icon: "ri-history-line", label: "History" },
            { id: "profile", icon: "ri-user-line", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all active:scale-95 ${
                activeTab === tab.id
                  ? "text-amber-400"
                  : (isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-600 hover:text-gray-800")
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500/15 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                    : "bg-transparent"
                }`}
              >
                <i className={`${tab.icon} text-xl`}></i>
                {activeTab === tab.id && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  activeTab === tab.id ? "text-amber-400" : (isDark ? "text-gray-600" : "text-gray-500")
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── SERVICES PANEL ── */}
      {activeTab === "services" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveTab("home")}
          />
          <div className="relative bg-zinc-900 border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl animate-slideUp">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="text-white font-black text-lg mb-5">All Services</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: "ri-taxi-line",
                  label: "Cab",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                  action: () => {
                    setActiveTab("home");
                  },
                },
                {
                  icon: "ri-e-bike-line",
                  label: "Bike",
                  color: "text-green-400",
                  bg: "bg-green-500/10 border-green-500/20",
                  action: () => {
                    setActiveTab("home");
                  },
                },
                {
                  icon: "ri-car-line",
                  label: "Auto",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                  action: () => {
                    setActiveTab("home");
                  },
                },
                {
                  icon: "ri-map-pin-line",
                  label: "Outstation",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20",
                  action: () => {},
                },
                {
                  icon: "ri-shield-check-line",
                  label: "Safe Ride",
                  color: "text-pink-400",
                  bg: "bg-pink-500/10 border-pink-500/20",
                  action: () => {},
                },
                {
                  icon: "ri-gift-line",
                  label: "Offers",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                  action: () => {},
                },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={s.action}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${s.bg} transition active:scale-95`}
                >
                  <i className={`${s.icon} ${s.color} text-2xl`}></i>
                  <span className="text-white text-xs font-semibold">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY PANEL ── */}
      {activeTab === "history" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveTab("home")}
          />
          <div className="relative bg-zinc-900 border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl animate-slideUp max-h-[75vh] flex flex-col">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="text-white font-black text-lg mb-1">Ride History</h3>
            <p className="text-gray-500 text-xs mb-5">Your recent trips</p>

            <div className="flex-1 overflow-y-auto space-y-3">
              {!user?._id ? (
                <div className="text-center py-10">
                  <i className="ri-history-line text-gray-600 text-4xl block mb-3"></i>
                  <p className="text-gray-500 text-sm">
                    Login to see your ride history
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("home");
                      navigate("/login");
                    }}
                    className="mt-4 bg-amber-500 text-white font-bold px-6 py-2 rounded-xl text-sm"
                  >
                    Login
                  </button>
                </div>
              ) : historyLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : rideHistory.length === 0 ? (
                <div className="text-center py-10">
                  <i className="ri-taxi-line text-gray-600 text-4xl block mb-3"></i>
                  <p className="text-gray-500 text-sm">No rides yet</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Book your first ride!
                  </p>
                </div>
              ) : (
                rideHistory.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          r.status === "completed"
                            ? "bg-green-500/15 text-green-400 border-green-500/25"
                            : r.status === "cancelled"
                              ? "bg-red-500/15 text-red-400 border-red-500/25"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-amber-400 font-black text-base">
                        ₹{r.fare}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 text-xs truncate">
                          {r.pickup}
                        </p>
                      </div>
                      <div className="w-0.5 h-2 bg-gray-700 ml-[3px]" />
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 text-xs truncate">
                          {r.destination}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mt-2">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE PANEL ── */}
      {activeTab === "profile" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveTab("home")}
          />
          <div className="relative bg-zinc-900 border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl animate-slideUp">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {!user?._id ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-line text-gray-500 text-2xl"></i>
                </div>
                <p className="text-white font-bold mb-1">Not logged in</p>
                <p className="text-gray-500 text-sm mb-5">
                  Login to view your profile
                </p>
                <button
                  onClick={() => {
                    setActiveTab("home");
                    navigate("/login");
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-3.5 rounded-2xl transition active:scale-95"
                >
                  Login / Sign Up
                </button>
              </div>
            ) : (
              <>
                {/* AVATAR */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-amber-500/30">
                    {(displayName || "U")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">
                      {displayName || "User"}
                    </p>
                    <p className="text-gray-400 text-sm">+91 {user?.mobile}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-green-400 text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* MENU ITEMS */}
                <div className="space-y-2 mb-5">
                  {[
                    {
                      icon: "ri-history-line",
                      label: "My Rides",
                      action: () => handleTabChange("history"),
                    },
                    {
                      icon: "ri-shield-check-line",
                      label: "Safety",
                      action: () => {},
                    },
                    {
                      icon: "ri-customer-service-2-line",
                      label: "Support",
                      action: () => {},
                    },
                    {
                      icon: "ri-settings-3-line",
                      label: "Settings",
                      action: () => {},
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 transition active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <i
                          className={`${item.icon} text-amber-400 text-base`}
                        ></i>
                      </div>
                      <span className="text-white text-sm font-semibold flex-1 text-left">
                        {item.label}
                      </span>
                      <i className="ri-arrow-right-s-line text-gray-500"></i>
                    </button>
                  ))}
                </div>

                {/* LOGOUT */}
                <button
                  onClick={() => {
                    setActiveTab("home");
                    navigate("/user/logout");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm transition active:scale-95"
                >
                  <i className="ri-logout-box-r-line"></i>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRide;
