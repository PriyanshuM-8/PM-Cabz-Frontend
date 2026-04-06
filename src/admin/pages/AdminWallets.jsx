import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";

const WalletDetailModal = ({ captain, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/captains/${captain._id}`)
      .then((r) => setDetail(r.data.captain))
      .finally(() => setLoading(false));
  }, [captain._id]);

  const minBalance = captain.vehicleType === "car" ? 500 : 100;
  const balance = detail?.wallet?.balance || 0;
  const isLow = balance < minBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-white font-black text-base">Wallet Details</h3>
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
            {/* CAPTAIN INFO */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white">
                {detail?.fullname?.firstname?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{detail?.fullname?.firstname} {detail?.fullname?.lastname || ""}</p>
                <p className="text-gray-400 text-xs">+91 {detail?.mobile} · {detail?.vehicleType}</p>
              </div>
            </div>

            {/* BALANCE */}
            <div className={`rounded-2xl p-4 border ${isLow ? "bg-red-500/10 border-red-500/25" : "bg-violet-500/10 border-violet-500/25"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 text-xs">Available Balance</p>
                {isLow && (
                  <span className="text-xs text-red-400 font-bold bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">Low</span>
                )}
              </div>
              <p className={`font-black text-3xl ${isLow ? "text-red-400" : "text-violet-300"}`}>
                ₹{balance.toLocaleString("en-IN")}
              </p>
              <p className="text-gray-600 text-xs mt-1">Min required: ₹{minBalance}</p>
            </div>

            {/* TRANSACTIONS */}
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Transaction History</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(detail?.wallet?.transactions || []).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No transactions</p>
                ) : [...(detail?.wallet?.transactions || [])].reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type === "credit" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                        <i className={`text-xs ${t.type === "credit" ? "ri-arrow-down-line text-green-400" : "ri-arrow-up-line text-red-400"}`}></i>
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold leading-tight">{t.description}</p>
                        <p className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm flex-shrink-0 ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                      {t.type === "credit" ? "+" : "-"}₹{t.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminWallets = () => {
  const [captains, setCaptains]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalBal, setTotalBal]   = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/wallets", { params: { page, limit: 15 } });
      setCaptains(r.data.captains);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setTotalBal(r.data.totalWalletBalance || 0);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Wallets</h1>
            <p className="text-gray-500 text-sm">{total} captains</p>
          </div>
        </div>

        {/* TOTAL BALANCE CARD */}
        <div className="bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/25 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center">
            <i className="ri-wallet-3-fill text-violet-400 text-2xl"></i>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Wallet Balance (All Captains)</p>
            <p className="text-violet-300 font-black text-3xl">₹{totalBal.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Captain</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Balance</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Min Required</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : captains.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-500 text-sm">No captains found</td></tr>
                ) : captains.map((c) => {
                  const minBal = c.vehicleType === "car" ? 500 : 100;
                  const bal = c.wallet?.balance || 0;
                  const isLow = bal < minBal;
                  return (
                    <tr key={c._id} className="border-b border-white/5 hover:bg-white/3 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                            {c.fullname?.firstname?.[0]?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{c.fullname?.firstname} {c.fullname?.lastname || ""}</p>
                            <p className="text-gray-500 text-xs">+91 {c.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-xs capitalize">{c.vehicleType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-black text-sm ${isLow ? "text-red-400" : "text-violet-400"}`}>₹{bal.toLocaleString("en-IN")}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">₹{minBal}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(c)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-violet-500/15 hover:text-violet-400 text-gray-400 flex items-center justify-center transition text-sm">
                          <i className="ri-eye-line"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {selected && <WalletDetailModal captain={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
};

export default AdminWallets;
