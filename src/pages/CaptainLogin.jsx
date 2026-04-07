import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../context/CaptainContext";
import axios from "axios";
import BASE_URL from "../baseURL";
import logo from '../photo/logo.png'

const BASE = BASE_URL;

// ── MODE: "login" | "forgot-mobile" | "forgot-otp"
const CaptainLogin = () => {
  const { setCaptain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  const [mode, setMode]         = useState("login");

  // login fields
  const [mobile, setMobile]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // forgot password fields
  const [fpMobile, setFpMobile] = useState("");
  const [otp, setOtp]           = useState("");
  const [demoOtp, setDemoOtp]   = useState("");

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── NORMAL LOGIN ──────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (mobile.length < 10) { setError("Enter valid 10-digit mobile number"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/captains/login`, {
        mobile: mobile.trim(),
        password: password.trim(),
      });
      setCaptain(res.data.captain);
      localStorage.setItem("captain-token", res.data.token);
      navigate("/captain-home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally { setLoading(false); }
  };

  // ── SEND OTP (Forgot Password) ────────────────────────
  const handleSendOtp = async () => {
    setError("");
    if (fpMobile.length !== 10) { setError("Enter valid 10-digit mobile number"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/captains/send-otp`, { mobile: fpMobile });
      setDemoOtp(res.data.demoOtp);
      setMode("forgot-otp");
    } catch (err) {
      setError(err.response?.data?.message || "Mobile not registered");
    } finally { setLoading(false); }
  };

  // ── VERIFY OTP & LOGIN ────────────────────────────────
  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length !== 4) { setError("Enter 4-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/captains/verify-otp`, {
        mobile: fpMobile,
        otp,
      });
      setCaptain(res.data.captain);
      localStorage.setItem("captain-token", res.data.token);
      navigate("/captain-home");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const resetForgot = () => {
    setMode("login"); setFpMobile(""); setOtp(""); setDemoOtp(""); setError("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <button
          onClick={() => mode !== "login" ? resetForgot() : navigate("/")}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <i className="ri-arrow-left-line text-white text-sm"></i>
        </button>
        <div className="flex items-center gap-2">
          <div className=" w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <img src={logo} alt="" className="rounded-4xl h-20 w-20 "  />
          </div>
          {/* <span className="text-white font-black text-sm">PM Cabz </span> */}
        </div>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8">

        {/* ══════════════ NORMAL LOGIN ══════════════ */}
        {mode === "login" && (
          <>
            <div className="mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                <i className="ri-steering-2-line text-white text-2xl"></i>
              </div>
              <h1 className="text-white text-2xl font-black mb-1">Captain Login</h1>
              <p className="text-gray-400 text-sm">Welcome back, driver 👋</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* MOBILE */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Mobile Number</label>
                <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3.5 transition">
                  <span className="text-amber-400 font-bold text-sm mr-3">+91</span>
                  <div className="w-px h-5 bg-white/20 mr-3" />
                  <input
                    type="tel" value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm"
                    maxLength={10}
                  />
                  {mobile.length === 10 && <i className="ri-check-line text-green-400 text-sm"></i>}
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot-mobile"); setFpMobile(mobile); setError(""); }}
                    className="text-amber-400 text-xs font-semibold hover:text-amber-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3.5 transition">
                  <i className="ri-lock-line text-gray-500 mr-3 text-sm"></i>
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-500 hover:text-gray-300 transition">
                    <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <i className="ri-error-warning-line text-red-400 text-sm"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mt-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging in...</>
                  : <><i className="ri-login-box-line"></i>Login as Captain</>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="space-y-3">
              <Link to="/captain-signup"
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-2xl transition active:scale-95 text-sm">
                <i className="ri-user-add-line"></i>New Captain? Register
              </Link>
              <Link to="/login"
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-semibold py-3.5 rounded-2xl transition active:scale-95 text-sm">
                <i className="ri-user-line"></i>Login as User
              </Link>
            </div>
          </>
        )}

        {/* ══════════════ FORGOT — ENTER MOBILE ══════════════ */}
        {mode === "forgot-mobile" && (
          <>
            <div className="mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                <i className="ri-smartphone-line text-white text-2xl"></i>
              </div>
              <h1 className="text-white text-2xl font-black mb-1">Forgot Password?</h1>
              <p className="text-gray-400 text-sm">Enter your registered mobile number to receive OTP</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Registered Mobile</label>
                <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-violet-500/60 rounded-2xl px-4 py-3.5 transition">
                  <span className="text-violet-400 font-bold text-sm mr-3">+91</span>
                  <div className="w-px h-5 bg-white/20 mr-3" />
                  <input
                    type="tel" value={fpMobile}
                    onChange={(e) => setFpMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm"
                    maxLength={10} autoFocus
                  />
                  {fpMobile.length === 10 && <i className="ri-check-line text-green-400 text-sm"></i>}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <i className="ri-error-warning-line text-red-400 text-sm"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button onClick={handleSendOtp} disabled={loading || fpMobile.length !== 10}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP...</>
                  : <><i className="ri-send-plane-line"></i>Send OTP</>}
              </button>

              <button onClick={resetForgot} className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2">
                ← Back to Login
              </button>
            </div>
          </>
        )}

        {/* ══════════════ FORGOT — ENTER OTP ══════════════ */}
        {mode === "forgot-otp" && (
          <>
            <div className="mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <i className="ri-shield-keyhole-line text-white text-2xl"></i>
              </div>
              <h1 className="text-white text-2xl font-black mb-1">Enter OTP</h1>
              <p className="text-gray-400 text-sm">
                OTP sent to <span className="text-amber-400 font-bold">+91 {fpMobile}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* DEMO OTP BANNER */}
              {demoOtp && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <i className="ri-shield-check-line text-green-400 text-lg flex-shrink-0"></i>
                  <div>
                    <p className="text-green-400 text-xs font-semibold">Demo OTP (dev mode)</p>
                    <p className="text-white font-black text-2xl tracking-[0.4em]">{demoOtp}</p>
                  </div>
                </div>
              )}

              {/* OTP BOXES */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">4-Digit OTP</label>
                <div className="flex gap-3 justify-center mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black text-white transition ${
                      otp[i] ? "border-green-500 bg-green-500/10" : "border-white/20 bg-white/5"
                    }`}>
                      {otp[i] || ""}
                    </div>
                  ))}
                </div>
                <input
                  type="tel" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Enter OTP"
                  className="w-full bg-white/5 border border-white/10 focus:border-green-500/60 rounded-2xl px-4 py-3 text-white text-center text-xl font-black tracking-[0.5em] outline-none transition"
                  maxLength={4} autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <i className="ri-error-warning-line text-red-400 text-sm"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 4}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-green-500/25 flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                  : <><i className="ri-check-double-line"></i>Verify & Login</>}
              </button>

              <button
                onClick={() => { setMode("forgot-mobile"); setOtp(""); setDemoOtp(""); setError(""); }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2">
                ← Change Number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaptainLogin;
