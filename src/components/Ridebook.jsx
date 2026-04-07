import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import BASE_URL from "../baseURL";
import "remixicon/fonts/remixicon.css";
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import LocationSearchPanel from "../components/LocationSearchPanel";
import { Bounce, toast, ToastContainer } from "react-toastify";

const Ridebook = (props) => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);

  const debounceTimeout = useRef(null);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

  useEffect(() => {
    if (!user?._id || !socket) return;
    socket.emit("join", { userType: "user", userId: user._id });
  }, [user, socket]);

  const fetchSuggestions = (value, setSuggestions) => {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      if (!value || value.length < 3) return;
      try {
        const res = await axios.get(
          `${BASE_URL}/maps/get-suggestions`,
          { params: { input: value.trim() } }
        );
        setSuggestions(res.data);
      } catch (err) {
        console.log("Suggestion error:", err?.response?.status);
      }
    }, 500);
  };

  const handlePickupChange = (e) => {
    setPickup(e.target.value);
    fetchSuggestions(e.target.value, setPickupSuggestions);
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
    fetchSuggestions(e.target.value, setDestinationSuggestions);
  };

  const findTrip = async () => {
    setPanelOpen(false);

    if (!pickup || !destination) {
      toast.warn("Enter pickup & destination!", {
        position: "top-left",
        autoClose: 3000,
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      // 🔥 GET FARE (token check happens here too)
      const res = await axios.get(
        `${BASE_URL}/rides/get-fare`,
        {
          params: { pickup: pickup.trim(), destination: destination.trim() },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ fallback agar route mismatch ho
      if (!res.data || typeof res.data !== 'object') {
        throw new Error('Invalid fare response');
      }

      const rideData = { pickup, destination, fare: res.data };
      localStorage.setItem("rideData", JSON.stringify(rideData));

      // ✅ if onSelect prop exists (used inside Home page)
      if (props.onSelect) {
        props.onSelect(rideData);
        return;
      }

      // ✅ go directly to home with ride data
      navigate("/home", { state: rideData });

    } catch (err) {
      if (err.response?.status === 401) {
        // not logged in → save data and go to login
        localStorage.setItem("rideData", JSON.stringify({ pickup, destination }));
        navigate("/login");
        return;
      }
      toast.error("Something went wrong!", { transition: Bounce });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-4 bg-zinc-900">
      <ToastContainer />
      <div className="w-full">

        <div className="space-y-3 mb-4">
          {/* PICKUP */}
          <div className="relative">
            <div className="flex items-center bg-white/10 border border-white/10 px-4 py-3 rounded-xl">
              <i className="ri-radio-button-line text-green-400 mr-3 flex-shrink-0"></i>
              <input
                value={pickup}
                onChange={handlePickupChange}
                onFocus={() => { setPanelOpen(true); setActiveField("pickup"); }}
                onBlur={() => setTimeout(() => setPanelOpen(false), 200)}
                className="bg-transparent outline-none w-full text-white placeholder-gray-500 text-sm"
                placeholder="Enter pickup location"
              />
              {pickup && (
                <button onClick={() => setPickup('')} className="text-gray-500 hover:text-white ml-2">
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
            {panelOpen && activeField === 'pickup' && pickupSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[110%] bg-zinc-800 border border-white/10 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                <LocationSearchPanel
                  suggestions={pickupSuggestions}
                  setPanelOpen={setPanelOpen}
                  setPickup={setPickup}
                  setDestination={setDestination}
                  activeField={activeField}
                />
              </div>
            )}
          </div>

          {/* DESTINATION */}
          <div className="relative">
            <div className="flex items-center bg-white/10 border border-white/10 px-4 py-3 rounded-xl">
              <i className="ri-map-pin-2-fill text-red-400 mr-3 flex-shrink-0"></i>
              <input
                value={destination}
                onChange={handleDestinationChange}
                onFocus={() => { setPanelOpen(true); setActiveField("destination"); }}
                onBlur={() => setTimeout(() => setPanelOpen(false), 200)}
                className="bg-transparent outline-none w-full text-white placeholder-gray-500 text-sm"
                placeholder="Enter destination"
              />
              {destination && (
                <button onClick={() => setDestination('')} className="text-gray-500 hover:text-white ml-2">
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
            {panelOpen && activeField === 'destination' && destinationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[110%] bg-zinc-800 border border-white/10 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                <LocationSearchPanel
                  suggestions={destinationSuggestions}
                  setPanelOpen={setPanelOpen}
                  setPickup={setPickup}
                  setDestination={setDestination}
                  activeField={activeField}
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={findTrip}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white py-3 rounded-xl cursor-pointer font-bold transition active:scale-95 shadow-lg shadow-amber-500/20"
        >
          {loading ? 'Finding...' : 'Find Ride 🚕'}
        </button>
      </div>
    </div>
  );
};

export default Ridebook;
