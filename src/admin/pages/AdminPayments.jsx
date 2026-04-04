import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";

const StatusBadge = ({ status }) => {
  const map = {
    success: "bg-green-500/15 text-green-400 border-green-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    failed:  "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${map[status] || "bg-white/5 text-gray-400 border-white/10"}`}>
      {status}
    </span>
  );
};

const AdminPayments = () => {
  const [payments, setPayments]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [revenue, setRevenue]     = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [status, setStatus]       = useState("");
  const [loading, setLoading]     = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/payments", { params: { page, status, limit: 15 } });
      setPayments(r.data.payments);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setRevenue(r.data.totalPaymentRevenue || 0);
    } catch {} finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Payments</h1>
            <p className="text-gray-500 text-sm">{total} total transactions</p>
          </div>
        </div>

        {/* REVENUE CARD */}
        <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/25 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
            <i className="ri-money-rupee-circle-line text-green-400 text-2xl"></i>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Payment Revenue</p>
            <p className="text-green-400 font-black text-3xl">₹{revenue.toLocaleString("en-IN")}</p>
            <p className="text-gray-600 text-xs">From successful payments</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {["", "success", "pending", "failed"].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${status === s ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Ride</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-500 text-sm">No payments found</td></tr>
                ) : payments.map((p) => (
                  <tr key={p._id} className="border-b border-white/5 hover:bg-white/3 transition">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-semibold">{p.user?.fullname || "—"}</p>
                      <p className="text-gray-500 text-xs">+91 {p.user?.mobile}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {p.ride ? (
                        <>
                          <p className="text-white text-xs truncate">{p.ride.pickup}</p>
                          <p className="text-gray-500 text-xs truncate">→ {p.ride.destination}</p>
                        </>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-black text-sm">₹{p.amount}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <p className="text-gray-500 text-xs font-mono truncate max-w-[120px]">{p.razorpay_order_id || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
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
    </AdminLayout>
  );
};

export default AdminPayments;
