import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from '../../photo/logo.png'

const AdminLogin = () => {
  const [email, setEmail]       = useState("pm@gmail.com");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("admin-token", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className=" w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            {/* <i className="ri-shield-star-line text-white text-2xl"></i> */}
            <img src={logo} alt="" className="rounded-4xl h-20 w-20 "  />
          </div>
          {/* <h1 className="text-white text-2xl font-black">PM Cabz </h1> */}
          {/* <p className="text-gray-500 text-sm mt-1">PM Cabz </p> */}
        </div>

        {/* CARD */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3 transition">
                <i className="ri-mail-line text-gray-500 mr-3 text-sm"></i>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm"
                  placeholder="pm@gmail.com" required />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3 transition">
                <i className="ri-lock-line text-gray-500 mr-3 text-sm"></i>
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm"
                  placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-500 hover:text-gray-300">
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
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging in...</>
                : <><i className="ri-shield-star-line"></i>Login to Admin</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
