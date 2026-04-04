import { useState } from "react";
import car from '../photo/hatchback.png'
import auto from '../photo/tuktuk.png'
import motorcycle from '../photo/motorbike.png'

const vehicleImages = {
   car,auto,motorcycle
};

const ConfirmRide = ({
  pickup,
  destination,
  fare,
  vehicleType,
  createRide,
  setConfirmRidePanel,
  setVehiclePanel,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmRide = async () => {
    setError("");
    setLoading(true);
    try {
      await createRide();
    } catch (err) {
      setError("Failed to book ride. Please try again.");
      setLoading(false);
    }
  };

  // Just hide the panel — don't clear localStorage so refresh restores it
  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };

  return (
    <div className="w-full text-white p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-900/40 rounded-t-3xl">

      {/* TITLE */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Confirm Ride 🚖</h3>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <i className="ri-arrow-down-line text-white"></i>
        </button>
      </div>

      {/* VEHICLE CARD */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl mb-4">
        <div className="flex items-center gap-4">
          <img
            src={vehicleImages[vehicleType]}
            alt="vehicle"
            className="h-16 w-20 object-contain"
          />
          <div className="flex-1">
            <p className="text-white font-semibold capitalize">{vehicleType}</p>
            <p className="text-amber-400 font-bold text-xl">₹{fare?.[vehicleType] || "--"}</p>
            <p className="text-gray-400 text-xs">Estimated fare</p>
          </div>
        </div>
      </div>

      {/* ROUTE DETAILS */}
      <div className="bg-white/5 rounded-2xl p-4 mb-4 space-y-3 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1 flex-shrink-0 shadow-[0_0_6px_#4ade80]"></div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Pickup</p>
            <p className="text-sm text-gray-200">{pickup}</p>
          </div>
        </div>
        <div className="ml-1 w-0.5 h-3 bg-gray-700"></div>
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 flex-shrink-0 shadow-[0_0_6px_#f87171]"></div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Destination</p>
            <p className="text-sm text-gray-200">{destination}</p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-400 text-sm mb-3 bg-red-400/10 px-3 py-2 rounded-xl border border-red-400/20">
          ⚠️ {error}
        </p>
      )}

      {/* CONFIRM BUTTON */}
      <button
        onClick={handleConfirmRide}
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 mb-3"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Booking & Notifying Drivers...
          </>
        ) : (
          <>✅ Confirm & Book Ride</>
        )}
      </button>

      <button
        onClick={handleDismiss}
        disabled={loading}
        className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-gray-300 font-semibold py-3 rounded-2xl transition"
      >
        Minimize
      </button>
    </div>
  );
};

export default ConfirmRide;
