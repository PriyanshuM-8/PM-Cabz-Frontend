import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/themeContext";
import { UserDataContext } from "../context/userContext";
import { CaptainDataContext } from "../context/CaptainContext";
import ThemeToggle from "./ThemeToggle";
import logo from "../photo/logo.png";
import cab from "../photo/cab.webp";
import bike from "../photo/bike.webp";
import auto from "../photo/auto.webp";
import jackpot1 from "../photo/pm-cabz-2.png";
import jackpot2 from "../photo/jackpot-img.png";
import bikess from "../photo/pm-cabz-1.png";

const UserLaptopView = ({ bookRidePanel }) => {
  const { isDark } = useTheme();
  const { user } = useContext(UserDataContext);
  const { captain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  const displayName = user?.fullname || "";

  const services = [
    { img: cab, label: "Cab", color: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/30", icon: "ri-taxi-line", iconColor: "text-amber-400", badge: "Most Popular" },
    { img: bike, label: "Bike", color: "from-green-500/20 to-emerald-500/10", border: "border-green-500/30", icon: "ri-e-bike-line", iconColor: "text-green-400", badge: "Fastest" },
    { img: auto, label: "Auto", color: "from-blue-500/20 to-cyan-500/10", border: "border-blue-500/30", icon: "ri-car-line", iconColor: "text-blue-400", badge: "Budget" },
  ];

  const stats = [
    { value: "50K+", label: "Happy Riders", icon: "ri-user-smile-line" },
    { value: "1200+", label: "Captains", icon: "ri-steering-2-line" },
    { value: "4.9★", label: "App Rating", icon: "ri-star-line" },
    { value: "24/7", label: "Support", icon: "ri-headphone-line" },
  ];

  const features = [
    { icon: "ri-map-pin-2-line", label: "Live Tracking", desc: "Track your ride in real-time", color: "text-amber-400" },
    { icon: "ri-phone-line", label: "SOS Button", desc: "Emergency help at one tap", color: "text-red-400" },
    { icon: "ri-user-star-line", label: "Verified Captains", desc: "Background checked drivers", color: "text-green-400" },
    { icon: "ri-shield-check-line", label: "Safe Rides", desc: "Every trip is insured", color: "text-violet-400" },
  ];

  return (
    <div className={`hidden desktop:flex flex-col min-h-screen transition-colors duration-300 ${isDark ? "bg-zinc-950" : "bg-gray-50"}`}>

      {/* Ambient glow */}
      <div className={`fixed top-0 left-1/3 w-[800px] h-[800px] rounded-full blur-[180px] pointer-events-none z-0 ${isDark ? "bg-amber-500/6" : "bg-amber-400/10"}`} />
      <div className={`fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 ${isDark ? "bg-orange-500/5" : "bg-orange-400/8"}`} />

      {/* ── NAVBAR ── */}
      <nav className={`relative z-20 flex items-center justify-between px-16 py-5 border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? "bg-zinc-950/80 border-white/6" : "bg-white/80 border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 border ${isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-300/40 bg-amber-50"}`}>
            <img src={logo} alt="PMCabz" className="w-10 h-10 rounded-xl object-contain" />
          </div>
          <div>
            <p className={`text-lg font-black tracking-tight leading-none ${isDark ? "text-white" : "text-gray-900"}`}>PMCabz</p>
            <p className={`text-[10px] font-semibold tracking-widest uppercase ${isDark ? "text-amber-400/70" : "text-amber-600/80"}`}>Ride Smart</p>
          </div>
        </div>

        <ul className="flex items-center gap-10">
          {["Home", "Services", "About Us", "Contact"].map((item) => (
            <li key={item}>
              <button className={`text-sm font-semibold transition-colors duration-200 hover:text-amber-400 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {item}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
        <div className="max-w-[1400px] mx-auto px-16 py-16 flex items-center gap-16">

          {/* LEFT — BookRide Panel */}
          <div className="w-[480px] flex-shrink-0">
            {user?._id ? (
              <div className="mb-7">
                <h2 className={`text-4xl font-black leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  Hey {displayName.split(" ")[0] || "there"} 👋
                </h2>
                <p className={`text-base mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Where are you heading today?</p>
              </div>
            ) : (
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>PMCabz — Ride Smart</span>
                </div>
                <h1 className={`text-5xl font-black leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  Chalo Le Chale<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Tumhe</span>
                </h1>
                <p className={`text-base mt-4 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Fast, safe & affordable rides at your fingertips.
                </p>
              </div>
            )}

            {/* BookRide Panel */}
            <div className={`rounded-3xl shadow-2xl overflow-visible transition-colors duration-300 ${isDark ? "bg-zinc-900 border border-white/10" : "bg-white border border-gray-200 shadow-xl"}`}>
              <div className={`px-6 pt-6 pb-4 border-b transition-colors duration-300 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-600"}`}>Book a Ride</p>
                </div>
              </div>
              <div className="px-6 py-5">
                {bookRidePanel}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              {stats.map((s) => (
                <div key={s.label} className={`rounded-2xl p-4 text-center border transition-colors duration-300 ${isDark ? "bg-zinc-900 border-white/8" : "bg-white border-gray-200"}`}>
                  <i className={`${s.icon} text-amber-400 text-lg mb-1 block`} />
                  <p className="text-amber-400 font-black text-lg leading-none">{s.value}</p>
                  <p className={`text-[11px] font-semibold mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Hero Banner */}
          <div className="flex-1 min-w-0">
            <div className={`relative rounded-3xl overflow-hidden border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200"}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-amber-500/10 via-transparent to-orange-500/6" : "from-amber-50 via-white to-orange-50"}`} />
              <div className="relative flex items-center justify-between px-12 py-14">
                <div className="max-w-md">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className={`text-sm font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>Available Now — All City</span>
                  </div>
                  <h2 className={`text-4xl font-black leading-tight mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                    Get Quick Rides,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Low Fares</span>
                  </h2>
                  <p className={`text-base leading-relaxed mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    PMCabz ensures quick rides at the most affordable prices across the city. Book in seconds, ride in minutes.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/30 transition active:scale-95 text-base"
                  >
                    <i className="ri-taxi-line text-xl" />
                    Book a Ride Now
                  </button>
                </div>
                <div className="w-72 h-56 flex items-center justify-center flex-shrink-0">
                  <img src={jackpot1} alt="ride" className="w-full h-full object-contain drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
        <div className="max-w-[1400px] mx-auto px-16 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>What We Offer</p>
              <h2 className={`text-4xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>Our Services</h2>
            </div>
            <span className={`text-sm font-semibold ${isDark ? "text-gray-500" : "text-gray-500"}`}>All vehicles available 24/7</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.label}
                className={`group relative rounded-3xl border p-7 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isDark ? `bg-gradient-to-br ${s.color} ${s.border} hover:border-amber-500/50` : `bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-amber-300 hover:shadow-amber-100`}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                    <i className={`${s.icon} ${s.iconColor} text-2xl`} />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? "bg-white/8 text-gray-400" : "bg-gray-100 text-gray-500"}`}>{s.badge}</span>
                </div>
                <p className={`text-xl font-black mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{s.label}</p>
                <div className="h-28 flex items-center justify-center my-4">
                  <img src={s.img} alt={s.label} className="h-24 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className={`flex items-center justify-between mt-3 pt-4 border-t ${isDark ? "border-white/8" : "border-gray-100"}`}>
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <i className="ri-time-line text-amber-400" />
                    <span>2-5 min away</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    <i className="ri-arrow-right-line" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPTAIN + SAFETY SECTION ── */}
      <section className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
        <div className="max-w-[1400px] mx-auto px-16 py-16 grid grid-cols-2 gap-8">

          {/* Captain Banner */}
          <div className={`relative rounded-3xl overflow-hidden border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200"}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-green-500/8 via-transparent to-emerald-500/5" : "from-green-50 via-white to-emerald-50"}`} />
            <div className="relative flex items-center gap-8 px-10 py-12">
              <div className="w-48 h-40 flex items-center justify-center flex-shrink-0">
                <img src={jackpot2} alt="captain" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className={`text-xs font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>Earn Daily</span>
                </div>
                <h2 className={`text-3xl font-black leading-tight mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Flexible Hours &<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">High Earnings</span>
                </h2>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Join as a PMCabz captain and earn on your own terms.
                </p>
                <button
                  onClick={() => navigate("/captain-signup")}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-green-500/25 transition active:scale-95 text-sm"
                >
                  Start Earning
                  <i className="ri-arrow-right-line" />
                </button>
              </div>
            </div>
          </div>

          {/* Safety Banner */}
          <div className={`relative rounded-3xl overflow-hidden border ${isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200"}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-violet-500/8 via-transparent to-pink-500/5" : "from-violet-50 via-white to-pink-50"}`} />
            <div className="relative px-10 py-12">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${isDark ? "bg-violet-500/10 border-violet-500/20" : "bg-violet-50 border-violet-200"}`}>
                <i className="ri-shield-check-line text-violet-400 text-xs" />
                <span className={`text-xs font-bold ${isDark ? "text-violet-400" : "text-violet-600"}`}>100% Safe</span>
              </div>
              <h2 className={`text-3xl font-black leading-tight mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                Your Safety is<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">Our Priority</span>
              </h2>
              <p className={`text-sm leading-relaxed mb-7 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Every ride is safe, tracked & comfortable. We never compromise on your security.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {features.map((f) => (
                  <div key={f.label} className={`flex items-start gap-3 p-4 rounded-2xl border ${isDark ? "bg-white/4 border-white/8" : "bg-gray-50 border-gray-100"}`}>
                    <i className={`${f.icon} ${f.color} text-xl mt-0.5`} />
                    <div>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{f.label}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`relative z-10 border-t transition-colors duration-300 ${isDark ? "bg-zinc-900/60 border-white/6" : "bg-white/80 border-gray-200"}`}>
        <div className="max-w-[1400px] mx-auto px-16 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PMCabz" className="w-8 h-8 rounded-xl object-contain" />
            <p className={`text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>© 2026 PMCabz Transportation. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { icon: "ri-twitter-x-line", href: "#" },
              { icon: "ri-youtube-line", href: "#" },
              { icon: "ri-instagram-line", href: "#" },
            ].map((s) => (
              <a key={s.icon} href={s.href} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition hover:text-amber-400 hover:border-amber-500/30 ${isDark ? "bg-white/5 border-white/10 text-gray-500" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                <i className={`${s.icon} text-sm`} />
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default UserLaptopView;
