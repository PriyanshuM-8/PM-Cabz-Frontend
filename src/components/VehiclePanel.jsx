import hatchback from "../photo/hatchback.png"
import tuktuk    from "../photo/tuktuk.png"
import motorbike from "../photo/motorbike.png"


const VehiclePanel = ({
  fare,
  selectVehicle,
  setConfirmRidePanel,
  setVehiclePanel,
}) => {
  const handleSelect = (type) => {
    selectVehicle(type);
    setConfirmRidePanel(true);
    setVehiclePanel(false);
  };

  return (
    <div className="w-full text-white p-4 
    bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-500 rounded-t-3xl">

      {/* TITLE */}
      <h3 className="text-2xl font-bold mb-4">
        Choose Vehicle 🚘
      </h3>

      {/* 🚗 CARD CONTAINER */}
      <div className="space-y-3">

        {/* 🚗 CAR */}
        <div
          onClick={() => handleSelect("car")}
          className="flex items-center justify-between p-4 
          bg-white/10 backdrop-blur-lg rounded-2xl 
          cursor-pointer hover:bg-white/20 transition shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img
              className="h-12 w-12 object-contain"
              src={hatchback}
              alt="car"
            />
            <div>
              <h4 className="font-semibold text-white">Car</h4>
              <p className="text-xs text-gray-300">Comfort ride</p>
            </div>
          </div>

          <span className="font-bold text-lg">
            ₹{fare?.car || "--"}
          </span>
        </div>

        {/* 🛺 AUTO */}
        <div
          onClick={() => handleSelect("auto")}
          className="flex items-center justify-between p-4 
          bg-white/10 backdrop-blur-lg rounded-2xl 
          cursor-pointer hover:bg-white/20 transition shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img
              className="h-12 w-12 object-contain"
              src={tuktuk}
              alt="auto"
            />
            <div>
              <h4 className="font-semibold text-white">Auto</h4>
              <p className="text-xs text-gray-300">Affordable</p>
            </div>
          </div>

          <span className="font-bold text-lg">
            ₹{fare?.auto || "--"}
          </span>
        </div>

        {/* 🏍 BIKE */}
        <div
          onClick={() => handleSelect("motorcycle")}
          className="flex items-center justify-between p-4 
          bg-white/10 backdrop-blur-lg rounded-2xl 
          cursor-pointer hover:bg-white/20 transition shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img
              className="h-12 w-12 object-contain"
              src={motorbike}
              alt="bike"
            />
            <div>
              <h4 className="font-semibold text-white">Bike</h4>
              <p className="text-xs text-gray-300">Fast ride</p>
            </div>
          </div>

          <span className="font-bold text-lg">
            ₹{fare?.motorcycle || "--"}
          </span>
        </div>

      </div>

      {/* 💡 FOOT NOTE */}
      <p className="text-xs text-gray-300 mt-4 text-center">
        Choose your preferred ride type 🚀
      </p>
    </div>
  );
};

export default VehiclePanel;