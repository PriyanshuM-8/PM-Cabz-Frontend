import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        <i className={`${icon} text-lg`}></i>
      </div>
    </div>
    <p className="text-white font-black text-2xl mb-0.5">{value ?? "—"}</p>
    <p className="text-gray-400 text-sm">{label}</p>
    {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-black">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, Admin 👋</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* STATS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="ri-user-3-line"
                label="Total Users"
                value={stats?.totalUsers}
                color="bg-blue-500/15 text-blue-400"
              />
              <StatCard
                icon="ri-steering-2-line"
                label="Total Captains"
                value={stats?.totalCaptains}
                color="bg-amber-500/15 text-amber-400"
              />
              <StatCard
                icon="ri-taxi-line"
                label="Total Rides"
                value={stats?.totalRides}
                color="bg-violet-500/15 text-violet-400"
              />
              <StatCard
                icon="ri-wifi-line"
                label="Online Captains"
                value={stats?.onlineCaptains}
                color="bg-green-500/15 text-green-400"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="ri-check-double-line"
                label="Completed Rides"
                value={stats?.completedRides}
                color="bg-green-500/15 text-green-400"
              />
              <StatCard
                icon="ri-close-circle-line"
                label="Cancelled Rides"
                value={stats?.cancelledRides}
                color="bg-red-500/15 text-red-400"
              />
              <StatCard
                icon="ri-time-line"
                label="Not Ride Booked"
                value={stats?.pendingRides}
                color="bg-orange-500/15 text-orange-400"
              />
              <StatCard
                icon="ri-calendar-line"
                label="Rides (7 days)"
                value={stats?.recentRides}
                color="bg-cyan-500/15 text-cyan-400"
              />
            </div>

            {/* REVENUE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-money-rupee-circle-line text-amber-400 text-lg"></i>
                  </div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                </div>
                <p className="text-amber-400 font-black text-3xl">
                  ₹{stats?.totalRevenue?.toLocaleString("en-IN") ?? 0}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  From completed rides
                </p>
              </div>

              <div className="bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-percent-line text-violet-400 text-lg"></i>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Admin Commission (10%)
                  </p>
                </div>
                <p className="text-violet-400 font-black text-3xl">
                  ₹{stats?.adminCommission?.toLocaleString("en-IN") ?? 0}
                </p>
                <p className="text-gray-600 text-xs mt-1">Platform earnings</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="ri-wallet-3-line text-green-400 text-lg"></i>
                  </div>
                  <p className="text-gray-400 text-sm">Total Wallet Balance</p>
                </div>
                <p className="text-green-400 font-black text-3xl">
                  ₹{stats?.totalWalletBalance?.toLocaleString("en-IN") ?? 0}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Across all captains
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
