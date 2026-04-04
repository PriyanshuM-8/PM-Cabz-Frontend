import hatchback from "../photo/hatchback.png";
import tuktuk from "../photo/tuktuk.png";
import motorbike from "../photo/motorbike.png";

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

  const vehicles = [
    {
      type: "car",
      img: hatchback,
      label: "Car",
      desc: "Comfort ride",
      emoji: "🚗",
    },
    {
      type: "auto",
      img: tuktuk,
      label: "Auto",
      desc: "Affordable",
      emoji: "🛺",
    },
    {
      type: "motorcycle",
      img: motorbike,
      label: "Bike",
      desc: "Fast ride",
      emoji: "🏍",
    },
  ];

  return (
    <div className="w-full text-white p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-500 rounded-t-3xl">
      <h3 className="text-2xl font-bold mb-4">Choose Vehicle 🚘</h3>

      <div className="space-y-3">
        {vehicles.map(({ type, img, label, desc }) => (
          <div
            key={type}
            onClick={() => handleSelect(type)}
            className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-lg rounded-2xl cursor-pointer hover:bg-white/20 transition shadow-lg"
          >
            <div className="flex items-center gap-3">
              <img className="h-12 w-12 object-contain" src={img} alt={label} />
              <div>
                <h4 className="font-semibold text-white">{label}</h4>
                <p className="text-xs text-gray-300">{desc}</p>
              </div>
            </div>
            <span className="font-bold text-lg">₹{fare?.[type] || "--"}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center">
        Choose your preferred ride type 🚀
      </p>
    </div>
  );
};

export default VehiclePanel;
