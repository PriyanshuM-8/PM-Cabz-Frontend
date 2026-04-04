import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";

const Badge = ({ blocked }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
    blocked ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-green-500/15 text-green-400 border border-green-500/25"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${blocked ? "bg-red-400" : "bg-green-400"}`} />
    {blocked ? "Blocked" : "Active"}
  </span>
);

const UserDetailModal = ({ user, onClose, onBlock }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${user._id}`)
      .then((r) => setDetail(r.data))
      .finally(() => setLoading(false));
  }, [user._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-white font-black text-base">User Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <i className="ri-close-line text-gray-400"></i>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* PROFILE */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-black text-white">
                {(detail?.user?.fullname || "U")[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-base">{detail?.user?.fullname || "—"}</p>
                <p className="text-gray-400 text-sm">+91 {detail?.user?.mobile}</p>
                <Badge blocked={detail?.user?.isBlocked} />
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Rides", value: detail?.stats?.totalRides ?? 0, color: "text-amber-400" },
                { label: "Completed",   value: detail?.stats?.completedRides ?? 0, color: "text-green-400" },
                { label: "Cancelled",   value: detail?.stats?.cancelledRides ?? 0, color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {/* RECENT RIDES */}
            {detail?.recentRides?.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Recent Rides</p>
                <div className="space-y-2">
                  {detail.recentRides.map((r) => (
                    <div key={r._id} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-semibold truncate max-w-[180px]">{r.pickup} → {r.destination}</p>
                        <p className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-bold text-sm">₹{r.fare}</p>
                        <span className={`text-xs ${r.status === "completed" ? "text-green-400" : r.status === "cancelled" ? "text-red-400" : "text-amber-400"}`}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <button onClick={() => onBlock(detail.user)} className={`w-full py-3 rounded-2xl font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2 ${
              detail?.user?.isBlocked
                ? "bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25"
                : "bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25"
            }`}>
              <i className={detail?.user?.isBlocked ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
              {detail?.user?.isBlocked ? "Unblock User" : "Block User"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]     = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/users", { params: { page, search, filter, limit: 15 } });
      setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages);
    } catch {} finally { setLoading(false); }
  }, [page, search, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleBlock = async (user) => {
    try {
      const r = await api.patch(`/users/${user._id}/block`);
      showToast(r.data.message);
      setSelected(null);
      fetchUsers();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    try { await api.delete(`/users/${id}`); showToast("User deleted"); fetchUsers(); } catch {}
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Users</h1>
            <p className="text-gray-500 text-sm">{total} total users</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 gap-2 flex-1 min-w-48">
            <i className="ri-search-line text-gray-500 text-sm"></i>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or mobile..."
              className="bg-transparent outline-none text-white text-sm flex-1 placeholder-gray-600" />
          </div>
          {["", "active", "blocked"].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                filter === f ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"
              }`}>
              {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Mobile</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Joined</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-500 text-sm">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/3 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                          {(u.fullname || "U")[0]?.toUpperCase()}
                        </div>
                        <p className="text-white text-sm font-semibold">{u.fullname || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">+91 {u.mobile}</td>
                    <td className="px-4 py-3"><Badge blocked={u.isBlocked} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(u)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-400 text-gray-400 flex items-center justify-center transition text-sm">
                          <i className="ri-eye-line"></i>
                        </button>
                        <button onClick={() => handleBlock(u)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-sm ${
                          u.isBlocked ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        }`}>
                          <i className={u.isBlocked ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition text-sm">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <p className="text-gray-500 text-xs">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs disabled:opacity-40 hover:bg-white/10 transition">Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs disabled:opacity-40 hover:bg-white/10 transition">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <UserDetailModal user={selected} onClose={() => setSelected(null)} onBlock={(u) => handleBlock(u)} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-green-400"></i>
          <p className="text-white text-sm font-semibold">{toast}</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
