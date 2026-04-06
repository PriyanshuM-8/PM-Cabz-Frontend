import { useEffect, useRef, useState } from "react";

let _ctx = null;
export const getAudioCtx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
};

const beep = (ctx) => {
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

let _iv = null;
const startBeep = () => { stopBeep(); const c = getAudioCtx(); beep(c); _iv = setInterval(() => beep(c), 1200); };
const stopBeep  = () => { if (_iv) { clearInterval(_iv); _iv = null; } };

const T = 30;

export default function CaptainNotification({ ride, onClose, onAccept, loading, error, onOpenWallet }) {
  const audioRef = useRef(null);
  const [timer, setTimer] = useState(T);

  useEffect(() => {
    if (!ride) return;
    startBeep();
    const a = new Audio("/sounds/universfield-new-notification-026-380249.mp3");
    a.volume = 0.7; a.loop = true; audioRef.current = a;
    a.play().catch(() => {});
    navigator.vibrate?.([400, 150, 400, 150, 400]);
    return () => { stopBeep(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [ride]);

  useEffect(() => {
    if (!ride) return;
    setTimer(T);
    const iv = setInterval(() => setTimer(p => { if (p <= 1) { clearInterval(iv); onClose(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [ride]);

  const stop = () => { stopBeep(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };

  if (!ride) return null;

  const pct = (timer / T) * 100;
  const isWallet = error?.startsWith("insufficient_wallet:");
  const timerColor = timer <= 10 ? "from-red-500 to-rose-500" : "from-amber-500 to-orange-400";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative animate-slideUp max-w-lg mx-auto w-full">
        {/* PROGRESS BAR */}
        <div className="h-1 bg-white/8 rounded-t-3xl overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${timerColor} transition-all duration-1000 ease-linear`} style={{ width: `${pct}%` }} />
        </div>

        <div className="border-t border-indigo-500/10 rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl" style={{ background: "linear-gradient(160deg, #0f0c29 0%, #1a1a2e 60%, #16213e 100%)" }}>

          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight">New Ride Request</p>
                <p className="text-gray-500 text-xs">Tap accept to confirm</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-black text-sm ${
              timer <= 10 ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-amber-500/12 border-amber-500/25 text-amber-400"
            }`}>
              <i className="ri-time-line text-xs"></i>{timer}s
            </div>
          </div>

          {/* FARE + VEHICLE */}
          <div className="bg-gradient-to-r from-green-500/12 to-emerald-500/8 border border-green-500/20 rounded-2xl px-4 py-3.5 mb-3 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Trip Fare</p>
              <p className="text-green-400 font-black text-4xl leading-none">₹{ride?.fare}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-0.5">Vehicle</p>
              <p className="text-white font-bold text-sm capitalize">{ride?.vehicleType || "—"}</p>
              <div className="flex items-center gap-1 justify-end mt-1">
                <i className="ri-star-fill text-amber-400 text-xs"></i>
                <span className="text-gray-300 text-xs">Cash</span>
              </div>
            </div>
          </div>

          {/* PASSENGER */}
          {ride?.user && (
            <div className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl px-4 py-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
                {ride.user?.fullname?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{ride.user?.fullname || "Passenger"}</p>
                {ride.user?.mobile && (
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                    <i className="ri-phone-line text-xs"></i>{ride.user.mobile}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ROUTE */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-0.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-green-400/50 to-red-400/50" />
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
              </div>
              <div className="flex-1 space-y-2.5 min-w-0">
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Pickup</p>
                  <p className="text-white text-sm font-medium leading-tight">{ride?.pickup}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Drop</p>
                  <p className="text-white text-sm font-medium leading-tight">{ride?.destination}</p>
                </div>
              </div>
            </div>
          </div>

          {/* WALLET ERROR */}
          {isWallet && (() => {
            const [, req, cur] = error.split(":");
            return (
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <i className="ri-wallet-3-fill text-red-400 text-sm"></i>
                  <p className="text-red-400 text-sm font-bold">Low Wallet Balance</p>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  Balance: <span className="text-red-400 font-bold">₹{cur}</span> · Required: <span className="text-white font-bold">₹{req}</span>
                </p>
                <button onClick={() => { stop(); onClose(); onOpenWallet?.(); }}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm active:scale-95 transition">
                  <i className="ri-wallet-3-fill"></i>Add Money to Wallet
                </button>
              </div>
            );
          })()}

          {/* GENERIC ERROR */}
          {error && !isWallet && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-3">
              <i className="ri-error-warning-line text-red-400 text-sm"></i>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button onClick={() => { stop(); onClose(); }} disabled={loading}
              className="w-14 h-14 bg-white/6 hover:bg-white/12 border border-white/10 disabled:opacity-40 rounded-2xl flex items-center justify-center transition active:scale-95 flex-shrink-0">
              <i className="ri-close-line text-gray-300 text-2xl"></i>
            </button>
            <button onClick={() => { stop(); onAccept(); }} disabled={loading}
              className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-black rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 text-base">
              {loading
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Accepting...</>
                : <><i className="ri-check-double-line text-xl"></i>Accept Ride</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
