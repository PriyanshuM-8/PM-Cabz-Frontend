import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";
import BASE_URL from "../../baseURL";

const BASE = BASE_URL;

const Badge = ({ blocked }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
    blocked ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-green-500/15 text-green-400 border border-green-500/25"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${blocked ? "bg-red-400" : "bg-green-400"}`} />
    {blocked ? "Blocked" : "Active"}
  </span>
);

const OnlineBadge = ({ online }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
    online ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-zinc-700/50 text-gray-500 border border-white/10"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-gray-600"}`} />
    {online ? "Online" : "Offline"}
  </span>
);

const VehicleBadge = ({ type }) => {
  const map = { car: { e: "🚗", c: "text-blue-400 bg-blue-500/10 border-blue-500/20" }, auto: { e: "🛺", c: "text-amber-400 bg-amber-500/10 border-amber-500/20" }, motorcycle: { e: "🏍", c: "text-purple-400 bg-purple-500/10 border-purple-500/20" } };
  const v = map[type] || { e: "🚗", c: "text-gray-400 bg-white/5 border-white/10" };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${v.c}`}>{v.e} {type}</span>;
};

const CaptainDetailModal = ({ captain, onClose, onBlock }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    api.get(`/captains/${captain._id}`)
      .then((r) => setDetail(r.data))
      .finally(() => setLoading(false));
  }, [captain._id]);

  const c = detail?.captain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-white font-black text-base">Captain Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <i className="ri-close-line text-gray-400"></i>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto">
            {/* PROFILE HEADER */}
            <div className="px-5 py-4 flex items-center gap-4 border-b border-white/8">
              {c?.profilePic ? (
                <img src={`${BASE}/${c.profilePic}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40" alt="captain" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-black text-white">
                  {c?.fullname?.firstname?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-black text-base">{c?.fullname?.firstname} {c?.fullname?.lastname || ""}</p>
                <p className="text-gray-400 text-sm">+91 {c?.mobile}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge blocked={c?.isBlocked} />
                  <OnlineBadge online={c?.isOnline} />
                  <VehicleBadge type={c?.vehicleType} />
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-white/8">
              {["info", "vehicle", "docs", "wallet", "rides"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${tab === t ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500 hover:text-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-3">
              {/* INFO TAB */}
              {tab === "info" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Rides", value: detail?.stats?.totalRides ?? 0, color: "text-amber-400" },
                      { label: "Completed",   value: detail?.stats?.completedRides ?? 0, color: "text-green-400" },
                      { label: "Commission",  value: `₹${detail?.stats?.totalCommission ?? 0}`, color: "text-violet-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                        <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
                        <p className="text-gray-500 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 border border-white/8 rounded-xl p-3 space-y-2">
                    <Row label="Email" value={c?.email || "—"} />
                    <Row label="Rating" value={`${c?.rating || 5} ★`} />
                    <Row label="Earnings" value={`₹${c?.earnings || 0}`} />
                    <Row label="Joined" value={new Date(c?.createdAt).toLocaleDateString("en-IN")} />
                  </div>
                </>
              )}

              {/* VEHICLE TAB */}
              {tab === "vehicle" && (
                <div className="bg-white/5 border border-white/8 rounded-xl p-3 space-y-2">
                  <Row label="Type"     value={c?.vehicle?.vehicleType} />
                  <Row label="Model"    value={c?.vehicle?.vehicleModel} />
                  <Row label="Color"    value={c?.vehicle?.color} />
                  <Row label="Plate"    value={c?.vehicle?.plate} />
                  <Row label="Capacity" value={c?.vehicle?.capacity} />
                </div>
              )}

              {/* DOCS TAB */}
              {tab === "docs" && (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/8 rounded-xl p-3 space-y-2">
                    <Row label="Aadhaar No." value={c?.documents?.aadhaarNumber} />
                    <Row label="DL Number"   value={c?.documents?.drivingLicense} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {c?.aadhaarFile && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Aadhaar</p>
                        <img src={`${BASE}/${c.aadhaarFile}`} className="w-full rounded-xl border border-white/10 object-cover h-28" alt="aadhaar" />
                      </div>
                    )}
                    {c?.drivingLicenseFile && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Driving License</p>
                        <img src={`${BASE}/${c.drivingLicenseFile}`} className="w-full rounded-xl border border-white/10 object-cover h-28" alt="dl" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WALLET TAB */}
              {tab === "wallet" && (
                <div className="space-y-3">
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
                    <p className="text-gray-400 text-xs mb-1">Wallet Balance</p>
                    <p className="text-violet-300 font-black text-3xl">₹{(c?.wallet?.balance || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(c?.wallet?.transactions || []).length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No transactions</p>
                    ) : [...(c?.wallet?.transactions || [])].reverse().map((t, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === "credit" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                            <i className={`text-xs ${t.type === "credit" ? "ri-arrow-down-line text-green-400" : "ri-arrow-up-line text-red-400"}`}></i>
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold">{t.description}</p>
                            <p className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                        </div>
                        <p className={`font-black text-sm ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                          {t.type === "credit" ? "+" : "-"}₹{t.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RIDES TAB */}
              {tab === "rides" && (
                <div className="space-y-2">
                  {(detail?.recentRides || []).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No rides yet</p>
                  ) : detail.recentRides.map((r) => (
                    <div key={r._id} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-semibold truncate max-w-[200px]">{r.pickup} → {r.destination}</p>
                        <p className="text-gray-500 text-xs">{r.user?.fullname} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-bold text-sm">₹{r.fare}</p>
                        <span className={`text-xs ${r.status === "completed" ? "text-green-400" : r.status === "cancelled" ? "text-red-400" : "text-amber-400"}`}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BLOCK BUTTON */}
              <button onClick={() => onBlock(c)} className={`w-full py-3 rounded-2xl font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2 ${
                c?.isBlocked
                  ? "bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25"
                  : "bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25"
              }`}>
                <i className={c?.isBlocked ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
                {c?.isBlocked ? "Unblock Captain" : "Block Captain"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-500 text-xs">{label}</span>
    <span className="text-white text-xs font-semibold">{value ?? "—"}</span>
  </div>
);

const AdminCaptains = () => {
  const [captains, setCaptains] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("");
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]       = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchCaptains = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/captains", { params: { page, search, filter, status, limit: 15 } });
      setCaptains(r.data.captains); setTotal(r.data.total); setPages(r.data.pages);
    } catch {} finally { setLoading(false); }
  }, [page, search, filter, status]);

  useEffect(() => { fetchCaptains(); }, [fetchCaptains]);

  const handleBlock = async (captain) => {
    try {
      const r = await api.patch(`/captains/${captain._id}/block`);
      showToast(r.data.message);
      setSelected(null);
      fetchCaptains();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this captain permanently?")) return;
    try { await api.delete(`/captains/${id}`); showToast("Captain deleted"); fetchCaptains(); } catch {}
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Captains</h1>
            <p className="text-gray-500 text-sm">{total} total captains</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 gap-2 flex-1 min-w-48">
            <i className="ri-search-line text-gray-500 text-sm"></i>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, mobile, plate..."
              className="bg-transparent outline-none text-white text-sm flex-1 placeholder-gray-600" />
          </div>
          {["", "active", "blocked"].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${filter === f ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"}`}>
              {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {["", "online", "offline"].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${status === s ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"}`}>
              {s === "" ? "Any Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Captain</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : captains.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-gray-500 text-sm">No captains found</td></tr>
                ) : captains.map((c) => (
                  <tr key={c._id} className="border-b border-white/5 hover:bg-white/3 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                          {c.fullname?.firstname?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{c.fullname?.firstname} {c.fullname?.lastname || ""}</p>
                          <p className="text-gray-500 text-xs">+91 {c.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <VehicleBadge type={c.vehicleType} />
                      <p className="text-gray-500 text-xs mt-1">{c.vehicle?.plate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-violet-400 font-bold text-sm">₹{c.wallet?.balance || 0}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge blocked={c.isBlocked} />
                        <OnlineBadge online={c.isOnline} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(c)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-400 text-gray-400 flex items-center justify-center transition text-sm">
                          <i className="ri-eye-line"></i>
                        </button>
                        <button onClick={() => handleBlock(c)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-sm ${
                          c.isBlocked ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        }`}>
                          <i className={c.isBlocked ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition text-sm">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {selected && <CaptainDetailModal captain={selected} onClose={() => setSelected(null)} onBlock={handleBlock} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-green-400"></i>
          <p className="text-white text-sm font-semibold">{toast}</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCaptains;
