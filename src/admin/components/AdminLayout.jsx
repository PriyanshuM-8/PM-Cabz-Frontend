import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";

const NAV = [
  { to: "/admin/dashboard", icon: "ri-dashboard-3-line",  label: "Dashboard"  },
  { to: "/admin/users",     icon: "ri-user-3-line",        label: "Users"      },
  { to: "/admin/captains",  icon: "ri-steering-2-line",    label: "Captains"   },
  { to: "/admin/rides",     icon: "ri-taxi-line",          label: "Rides"      },
  { to: "/admin/payments",  icon: "ri-bank-card-line",     label: "Payments"   },
  { to: "/admin/wallets",   icon: "ri-wallet-3-line",      label: "Wallets"    },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post("/logout"); } catch {}
    localStorage.removeItem("admin-token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">

      {/* SIDEBAR */}
      <aside className="w-60 bg-zinc-900 border-r border-white/8 flex flex-col fixed h-full z-20">

        {/* LOGO */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-sm">🚕</span>
            </div>
            <div>
              <p className="text-white font-black text-sm">PM Cabz </p>
              <p className="text-amber-400 text-xs font-semibold">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }>
              <i className={`${icon} text-base`}></i>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="px-3 py-4 border-t border-white/8">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition">
            <i className="ri-logout-box-r-line text-base"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
