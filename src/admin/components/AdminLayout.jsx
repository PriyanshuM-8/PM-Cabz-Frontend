import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../../photo/logo.png";

const NAV = [
  { to: "/admin/dashboard", icon: "ri-dashboard-3-line", label: "Dashboard" },
  { to: "/admin/users",     icon: "ri-user-3-line",      label: "Users"     },
  { to: "/admin/captains",  icon: "ri-steering-2-line",  label: "Captains"  },
  { to: "/admin/rides",     icon: "ri-taxi-line",        label: "Rides"     },
  { to: "/admin/payments",  icon: "ri-bank-card-line",   label: "Payments"  },
  { to: "/admin/wallets",   icon: "ri-wallet-3-line",    label: "Wallets"   },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/logout"); } catch {}
    localStorage.removeItem("admin-token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-zinc-900 border-r border-white/8
        transition-all duration-300
        w-64
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:w-56
      `}>
        {/* LOGO */}
        <div className="px-4 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="text-white font-black text-sm leading-tight">PM Cabz</p>
              <p className="text-amber-400 text-xs font-semibold">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 rounded-full bg-white/5 flex items-center justify-center"
          >
            <i className="ri-close-line text-gray-400 text-sm"></i>
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <i className={`${icon} text-base flex-shrink-0`}></i>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <i className="ri-logout-box-r-line text-base"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 lg:ml-56 min-h-screen overflow-y-auto pb-20 lg:pb-0">

        {/* MOBILE TOP BAR */}
        <div className="lg:hidden sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <i className="ri-menu-line text-white text-base"></i>
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-white font-black text-sm">PM Cabz Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
          >
            <i className="ri-logout-box-r-line text-red-400 text-sm"></i>
          </button>
        </div>

        {/* PAGE CONTENT */}
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur-xl border-t border-white/8 flex items-center justify-around px-2 py-2">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1 ${
                isActive
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-gray-500 hover:text-gray-300"
              }`
            }
          >
            <i className={`${icon} text-lg`}></i>
            <span className="text-[10px] font-semibold truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
