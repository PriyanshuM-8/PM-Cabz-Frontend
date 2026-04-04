import { useNavigate } from "react-router-dom";

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden relative">

      {/* BG GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-lg">🚕</span>
          </div>
          <span className="text-white font-black text-lg tracking-wide">PM Cabz </span>
        </div>
        <button
          onClick={() => navigate("/captain-login")}
          className="text-xs text-gray-400 hover:text-amber-400 border border-white/10 hover:border-amber-500/40 px-3 py-1.5 rounded-full transition"
        >
          Captain Login
        </button>
      </div>

      {/* HERO */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-12">

        {/* BADGE */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 text-xs font-semibold">Fast · Safe · Reliable</span>
        </div>

        {/* HEADING */}
        <h1 className="text-white text-4xl font-black leading-tight mb-4">
          Your Ride,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            On Demand
          </span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xs">
          Book a cab in seconds. Track in real-time. Arrive safely every time.
        </p>

        {/* CAR ILLUSTRATION */}
        <div className="relative mb-10">
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-8xl">🚕</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex items-center gap-6 mb-10">
          {[
            { value: "10K+", label: "Rides" },
            { value: "500+", label: "Drivers" },
            { value: "4.9★", label: "Rating" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-white font-black text-lg">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA BUTTONS */}
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => navigate("/book")}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/30 text-base"
          >
            Book a Ride 🚕
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-2xl transition active:scale-95 text-sm"
          >
            Login / Sign Up
          </button>
        </div>
      </div>

      {/* BOTTOM NOTE */}
      <p className="relative z-10 text-center text-gray-600 text-xs pb-6">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
};

export default Start;
