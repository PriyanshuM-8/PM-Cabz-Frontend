import { useEffect, useState } from "react";

const LookingForDriver = (props) => {
  const [status, setStatus] = useState(0);

  // 🚀 STATUS ANIMATION
  useEffect(() => {
    const steps = [0, 1, 2];
    let i = 0;

    const interval = setInterval(() => {
      i++;
      if (i >= steps.length) clearInterval(interval);
      else setStatus(steps[i]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const statusList = [
    "Booking Confirmed",
    "Searching Driver",
    "Driver Assigned",
  ];

  return (
    <div className="w-full min-h-[70vh] text-white p-4 
    bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-500 rounded-t-3xl">

      {/* ⬇ CLOSE */}
      <h5
        className="text-center mb-2 cursor-pointer"
        onClick={() => props.setVehicleFound(false)}
      >
        <i className="text-3xl text-gray-300 ri-arrow-down-wide-fill"></i>
      </h5>

      <h3 className="text-2xl font-semibold mb-4">
        Looking for a Driver 🚖
      </h3>

      {/* 🚗 MAIN CARD */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl">

        <div className="flex gap-4">

          {/* LEFT SIDE */}
          <div className="flex flex-col items-center w-[45%]">

            <img
              className="h-20 object-contain"
              src="src/photo/hatchback.png"
              alt="car"
            />

            <div className="w-full mt-4 space-y-3 text-sm">

              <div className="flex items-center gap-3">
                <i className="ri-map-pin-fill text-green-400"></i>
                <p>{props.pickup}</p>
              </div>

              <div className="flex items-center gap-3">
                <i className="ri-flag-fill text-red-400"></i>
                <p>{props.destination}</p>
              </div>

              <div className="flex items-center gap-3">
                <i className="ri-money-rupee-circle-fill text-yellow-400"></i>
                <p>₹{props.fare?.[props.vehicleType] || "--"}</p>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col justify-between w-[55%]">

            {/* 👤 DRIVER INFO */}
            <div className="bg-white/10 p-3 rounded-xl text-center">

              <img
                className="h-12 w-12 rounded-full mx-auto border border-white"
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="driver"
              />

              <h4 className="mt-2 text-sm font-medium">
                Searching...
              </h4>

              <p className="text-xs text-gray-300">
                Driver will be assigned soon
              </p>

            </div>

            {/* 🚀 STATUS */}
            <div className="mt-3">

              <div className="space-y-2">
                {statusList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">

                    <div
                      className={`h-3 w-3 rounded-full ${
                        index <= status
                          ? "bg-green-400"
                          : "bg-gray-500"
                      }`}
                    ></div>

                    <p
                      className={`text-xs ${
                        index === status
                          ? "text-white font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full h-1 bg-gray-700 rounded-full mt-3">
                <div
                  className="h-1 bg-green-400 rounded-full transition-all duration-700"
                  style={{ width: `${(status / 2) * 100}%` }}
                ></div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 🔘 ACTION BUTTONS */}
      <div className="mt-6 bg-white rounded-2xl p-3 flex justify-between items-center shadow-xl text-black">

        {/* MESSAGE */}
        <button className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition">
          <i className="ri-chat-3-line"></i>
          Message
        </button>

        {/* CALL */}
        <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition">
          <i className="ri-phone-fill"></i>
          Call
        </button>

        {/* CANCEL */}
        <button
          onClick={() => props.setVehicleFound(false)}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
        >
          <i className="ri-close-line"></i>
          Cancel
        </button>

      </div>

    </div>
  );
};

export default LookingForDriver;