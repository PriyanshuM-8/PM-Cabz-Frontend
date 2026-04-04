const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const WaitingForDriver = ({ ride }) => {
  const captain = ride?.captain;

  return (
    <div className="w-full bg-zinc-900 rounded-t-3xl px-5 pt-4 pb-6 text-white">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <h3 className="text-base font-bold text-green-400">Driver Assigned!</h3>
      </div>

      {/* CAPTAIN CARD */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">

          {/* LEFT: Photo + Info */}
          <div className="flex items-center gap-3">
            {captain?.profilePic ? (
              <img
                src={`${VITE_BASE_URL}/${captain.profilePic}`}
                alt="Captain"
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold text-white">
                {captain?.fullname?.firstname?.[0]?.toUpperCase() || 'D'}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-base">
                {captain?.fullname?.firstname} {captain?.fullname?.lastname || ''}
              </p>
              <p className="text-gray-400 text-xs">{captain?.vehicle?.vehicleModel || 'Vehicle'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-400 text-xs">★</span>
                <span className="text-gray-300 text-xs">{captain?.rating || '5.0'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Plate + Call */}
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
              <p className="text-white font-bold text-sm tracking-widest">
                {captain?.vehicle?.plate || '----'}
              </p>
            </div>
            {captain?.mobile && (
              <a
                href={`tel:${captain.mobile}`}
                className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                <i className="ri-phone-fill text-sm"></i>
                {captain.mobile}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* OTP BOX */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Your OTP</p>
          <p className="text-amber-400 font-black text-3xl tracking-[0.3em]">{ride?.otp}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Share with driver</p>
          <p className="text-gray-500 text-xs">to start ride</p>
        </div>
      </div>

      {/* ROUTE */}
      <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
          <p className="text-gray-300 text-sm truncate">{ride?.pickup}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></div>
          <p className="text-gray-300 text-sm truncate">{ride?.destination}</p>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <i className="ri-money-rupee-circle-fill text-amber-400 text-sm"></i>
          <p className="text-amber-400 font-bold text-sm">₹{ride?.fare} · Cash</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingForDriver;
