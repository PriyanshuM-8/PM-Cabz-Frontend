import { useContext } from "react";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainDetails = () => {
  const { captain } = useContext(CaptainDataContext);

  return (
    <div className="text-white">

      {/* 🔝 TOP PROFILE */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <img
            className="h-12 w-12 rounded-full object-cover border-2 border-amber-400"
            src={   captain?.profilePic
        ? `${import.meta.env.VITE_BASE_URL}/${captain.profilePic}`
        : "/default-user.png"
    }
            alt="captain"
          />

          <div>
            <h4 className="text-lg font-semibold capitalize">
              {captain?.fullname
                ? `${captain.fullname.firstname} ${captain.fullname.lastname}`
                : "Captain"}
            </h4>

            <p className="text-xs text-gray-300">
              🚗 {captain?.vehicle?.vehicleType || "Car"} •{" "}
              {captain?.vehicle?.plate || "UP 70 XX 0000"}
            </p>
          </div>
        </div>

        {/* 💰 EARNINGS */}
        <div className="text-right">
          <h4 className="text-2xl font-bold text-amber-400">
            ₹{captain?.earnings || "0.00"}
          </h4>
          <p className="text-xs text-gray-300">Today's Earnings</p>
        </div>
      </div>

      {/* 📊 STATS CARD */}
      <div className="flex justify-between mt-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">

        {/* ⏱️ HOURS */}
        <div className="text-center flex-1">
          <i className="ri-time-line text-2xl mb-1 text-amber-400"></i>
          <h5 className="text-lg font-semibold">
            {captain?.stats?.hoursOnline || "0"}h
          </h5>
          <p className="text-xs text-gray-300">Online</p>
        </div>

        {/* 🚖 RIDES */}
        <div className="text-center flex-1">
          <i className="ri-roadster-line text-2xl mb-1 text-amber-400"></i>
          <h5 className="text-lg font-semibold">
            {captain?.stats?.totalRides || "0"}
          </h5>
          <p className="text-xs text-gray-300">Rides</p>
        </div>

        {/* ⭐ RATING */}
        <div className="text-center flex-1">
          <i className="ri-star-smile-line text-2xl mb-1 text-amber-400"></i>
          <h5 className="text-lg font-semibold">
            {captain?.stats?.rating || "4.5"}
          </h5>
          <p className="text-xs text-gray-300">Rating</p>
        </div>

        {/* 💸 TOTAL */}
        <div className="text-center flex-1">
          <i className="ri-money-rupee-circle-line text-2xl mb-1 text-amber-400"></i>
          <h5 className="text-lg font-semibold">
            ₹{captain?.stats?.totalEarnings || "0"}
          </h5>
          <p className="text-xs text-gray-300">Total</p>
        </div>

      </div>

      {/* 🚗 VEHICLE INFO */}
      <div className="mt-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">

        <h3 className="text-sm text-gray-300 mb-2">Vehicle Info</h3>

        <div className="flex justify-between text-sm">
          <p className="text-gray-400">Model</p>
          <p className="font-medium">
            {captain?.vehicle?.model || "Swift Dzire"}
          </p>
        </div>

        <div className="flex justify-between text-sm mt-1">
          <p className="text-gray-400">Number</p>
          <p className="font-medium">
            {captain?.vehicle?.plate || "UP 70 XX 0000"}
          </p>
        </div>

        <div className="flex justify-between text-sm mt-1">
          <p className="text-gray-400">Color</p>
          <p className="font-medium">
            {captain?.vehicle?.color || "White"}
          </p>
        </div>

      </div>

    </div>
  );
};

export default CaptainDetails;