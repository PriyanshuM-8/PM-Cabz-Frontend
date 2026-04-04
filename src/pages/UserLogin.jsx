import { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserDataContext } from "../context/userContext";
import logo from "../photo/logo.png";

const UserLogin = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [fullname, setFullname] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [step, setStep] = useState(1); // 1=mobile, 2=otp, 3=name
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);

  // STEP 1 — send OTP
  const handleSendOtp = async () => {
    setError("");
    if (mobile.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const checkRes = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/check-user`,
        { mobile },
      );
      setIsNewUser(!checkRes.data.exists);
      const otpRes = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/send-otp`,
        { mobile },
      );
      setDemoOtp(otpRes.data.demoOtp);
      setStep(2);
    } catch {
      const fake = Math.floor(1000 + Math.random() * 9000).toString();
      setDemoOtp(fake);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — verify OTP
  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length < 4) {
      setError("Enter 4-digit OTP");
      return;
    }
    if (otp !== demoOtp.toString()) {
      setError("Invalid OTP. Try again.");
      return;
    }
    if (isNewUser) {
      setStep(3);
      return;
    }
    await doLogin();
  };

  // STEP 3 — name submit
  const handleNameSubmit = async () => {
    setError("");
    if (!fullname.trim() || fullname.trim().length < 2) {
      setError("Enter your full name");
      return;
    }
    await doLogin();
  };

  const doLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/verify-otp`,
        {
          mobile,
          otp,
          fullname: isNewUser ? fullname.trim() : undefined,
        },
      );
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      navigate("/book");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetToStep1 = useCallback(() => {
    setStep(1);
    setOtp("");
    setFullname("");
    setDemoOtp("");
    setError("");
  }, []);
  const resetToStep2 = useCallback(() => {
    setStep(2);
    setFullname("");
    setError("");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-900/40 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className=" w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <img src={logo} alt="" className="rounded-4xl h-20 w-20 " />
          </div>
          <h1 className="text-white text-2xl font-black">CAB BOOKING</h1>
          <p className="text-gray-400 text-sm mt-1">Fast. Safe. Reliable.</p>
        </div>

        {/* CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          {/* STEP INDICATOR */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                      : "bg-white/10 text-gray-500"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 rounded transition-all ${step > s ? "bg-amber-500" : "bg-white/10"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1 — MOBILE */}
          {step === 1 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-1">
                Enter Mobile Number
              </h2>
              <p className="text-gray-400 text-xs mb-5">
                We'll send you a verification code
              </p>

              <div className="flex items-center bg-white/10 border border-white/10 focus-within:border-amber-500 rounded-2xl px-4 py-3.5 mb-4 transition">
                <span className="text-amber-400 font-bold text-sm mr-3">
                  +91
                </span>
                <div className="w-px h-5 bg-white/20 mr-3"></div>
                <input
                  className="bg-transparent outline-none w-full text-white placeholder-gray-500 text-base tracking-wider"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  type="tel"
                  maxLength={10}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
                {mobile.length === 10 && (
                  <i className="ri-check-line text-green-400"></i>
                )}
              </div>

              {error && (
                <p className="text-red-400 text-xs mb-3 bg-red-400/10 px-3 py-2 rounded-xl">
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading || mobile.length !== 10}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition active:scale-95 shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP →"
                )}
              </button>
            </div>
          )}

          {/* STEP 2 — OTP */}
          {step === 2 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Verify OTP</h2>
              <p className="text-gray-400 text-xs mb-1">
                Sent to <span className="text-amber-400">+91 {mobile}</span>
              </p>

              {demoOtp && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
                  <i className="ri-shield-check-line text-green-400 text-sm"></i>
                  <p className="text-green-400 text-xs">
                    Demo OTP:{" "}
                    <span className="font-black text-base tracking-widest">
                      {demoOtp}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 mb-4 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black text-white transition ${
                      otp[i]
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    {otp[i] || ""}
                  </div>
                ))}
              </div>

              <input
                className="w-full bg-white/10 border border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-white text-center text-xl font-black tracking-[0.5em] outline-none transition mb-4"
                placeholder="• • • •"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                type="tel"
                maxLength={4}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-xs mb-3 bg-red-400/10 px-3 py-2 rounded-xl">
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition active:scale-95 shadow-lg shadow-amber-500/20 mb-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP ✓"
                )}
              </button>

              <button
                onClick={resetToStep1}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2"
              >
                ← Change Number
              </button>
            </div>
          )}

          {/* STEP 3 — NAME */}
          {step === 3 && (
            <div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm">
                  🎉
                </div>
                <div>
                  <p className="text-amber-400 text-xs font-bold">Welcome!</p>
                  <p className="text-gray-300 text-xs">
                    New account for +91 {mobile}
                  </p>
                </div>
              </div>

              <h2 className="text-white font-bold text-lg mb-1">
                What's your name?
              </h2>
              <p className="text-gray-400 text-xs mb-5">
                This will be shown to your driver
              </p>

              <input
                className="w-full bg-white/10 border border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 outline-none transition mb-4"
                placeholder="Enter your full name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-xs mb-3 bg-red-400/10 px-3 py-2 rounded-xl">
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={handleNameSubmit}
                disabled={loading || fullname.trim().length < 2}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition active:scale-95 shadow-lg shadow-amber-500/20 mb-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  "Save & Continue →"
                )}
              </button>

              <button
                onClick={resetToStep2}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Are you a driver?{" "}
          <button
            onClick={() => navigate("/captain-login")}
            className="text-amber-400 font-semibold hover:text-amber-300 transition"
          >
            Captain Login →
          </button>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
