import { useEffect, useRef, useState } from "react";

// ── GLOBAL AUDIO CONTEXT (shared, unlocked on first interaction) ──
let _audioCtx = null;
export const getAudioCtx = () => {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
};

// ── PLAY BEEP via Web Audio API (works even without a file) ──
const playBeep = (ctx) => {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

// ── REPEATING BEEP every 1.2s ──
let beepInterval = null;
const startBeeping = () => {
  stopBeeping();
  const ctx = getAudioCtx();
  playBeep(ctx);
  beepInterval = setInterval(() => playBeep(ctx), 1200);
};
const stopBeeping = () => {
  if (beepInterval) { clearInterval(beepInterval); beepInterval = null; }
};

const CaptainNotification = ({ ride, onClose, onAccept, loading, error, onOpenWallet }) => {
  const audioRef = useRef(null);
  const [timer, setTimer] = useState(30);

  // ── SOUND + VIBRATE ──
  useEffect(() => {
    if (!ride) return;

    // 1. Start Web Audio beep (always works)
    startBeeping();

    // 2. Also try MP3 file
    const audio = new Audio("/sounds/universfield-new-notification-026-380249.mp3");
    audio.volume = 1.0;
    audio.loop = true;
    audioRef.current = audio;
    audio.play().catch(() => {
      // MP3 blocked — beep already running, that's fine
    });

    navigator.vibrate?.([400, 150, 400, 150, 400]);

    return () => {
      stopBeeping();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [ride]);

  // ── TIMER ──
  useEffect(() => {
    if (!ride) return;
    setTimer(30);
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(countdown); onClose(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [ride]);

  const stopSound = () => {
    stopBeeping();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  };

  if (!ride) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "linear-gradient(145deg, #18181b, #1c1917)" }}>

        {/* TIMER BAR */}
        <div className="w-full h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000"
            style={{ width: `${(timer / 30) * 100}%` }} />
        </div>

        <div className="p-5">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">New Ride Request</h3>
                <p className="text-gray-500 text-xs">Tap accept to confirm</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
              <i className="ri-time-line text-amber-400 text-xs"></i>
              <span className="text-amber-400 font-black text-sm">{timer}s</span>
            </div>
          </div>

          {/* PASSENGER */}
          {ride?.user && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base font-black text-white shadow-lg">
                {ride.user?.fullname?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{ride.user?.fullname || "Passenger"}</p>
                {ride.user?.mobile && (
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                    <i className="ri-phone-line text-xs"></i>{ride.user.mobile}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-green-400 font-black text-xl">₹{ride?.fare}</p>
                <p className="text-gray-500 text-xs">Cash</p>
              </div>
            </div>
          )}

          {/* ROUTE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1 gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-green-400/50 to-red-400/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Pickup</p>
                  <p className="text-sm text-gray-100 font-medium leading-tight">{ride?.pickup}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Drop</p>
                  <p className="text-sm text-gray-100 font-medium leading-tight">{ride?.destination}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (() => {
            const isWalletError = error.startsWith("insufficient_wallet:");
            if (isWalletError) {
              const [, required, current] = error.split(":");
              return (
                <div className="bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-wallet-3-fill text-red-400 text-base"></i>
                    <p className="text-red-400 text-sm font-bold">Insufficient Wallet Balance</p>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">
                    Your balance: <span className="text-red-400 font-bold">₹{current}</span>
                    {" · "}
                    Required: <span className="text-white font-bold">₹{required}</span>
                  </p>
                  <p className="text-gray-500 text-xs mb-3">Please add money to your wallet to accept rides.</p>
                  <button
                    onClick={() => { stopSound(); onClose(); onOpenWallet?.(); }}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-2 text-sm">
                    <i className="ri-wallet-3-fill"></i>
                    Add Money to Wallet
                  </button>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3">
                <i className="ri-error-warning-line text-red-400 text-sm"></i>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            );
          })()}

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={() => { stopSound(); onAccept(); }}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Accepting...</>
                : <><i className="ri-check-line text-lg"></i>Accept</>}
            </button>
            <button
              onClick={() => { stopSound(); onClose(); }}
              disabled={loading}
              className="w-16 bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-40 text-gray-400 font-semibold py-4 rounded-2xl transition active:scale-95 flex items-center justify-center">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainNotification;
