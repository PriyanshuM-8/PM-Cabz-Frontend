import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api";

const StatusBadge = ({ status }) => {
  const map = {
    completed:           "bg-green-500/15 text-green-400 border-green-500/25",
    cancelled:           "bg-red-500/15 text-red-400 border-red-500/25",
    ongoing:             "bg-blue-500/15 text-blue-400 border-blue-500/25",
    accepted:            "bg-amber-500/15 text-amber-400 border-amber-500/25",
    pending:             "bg-orange-500/15 text-orange-400 border-orange-500/25",
    "no-drivers-available": "bg-zinc-700/50 text-gray-400 border-white/10",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${map[status] || "bg-white/5 text-gray-400 border-white/10"}`}>
      {status}
    </span>
  );
};

const RideDetailModal = ({ ride, onClose, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h3 className="text-white font-black text-base">Ride Details</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
          <i className="ri-close-line text-gray-400"></i>
        </button>
      </div>
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* STATUS + FARE */}
        <div className="flex items-center justify-between">
          <StatusBadge status={ride.status} />
          <p className="text-amber-400 font-black text-2xl">₹{ride.fare}</p>
        </div>

        {/* ROUTE */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <p className="text-gray-300 text-sm">{ride.pickup}</p>
          </div>
          <div className="w-0.5 h-3 bg-gray-700 ml-[3px]" />
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <p className="text-gray-300 text-sm">{ride.destination}</p>
          </div>
        </div>

        {/* USER */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Passenger</p>
          <p className="text-white text-sm font-semibold">{ride.user?.fullname || "—"}</p>
          <p className="text-gray-400 text-xs">+91 {ride.user?.mobile}</p>
        </div>

        {/* CAPTAIN */}
        {ride.captain && (
          <div className="bg-white/5 border border-white/8 rounded-xl p-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Captain</p>
            <p className="text-white text-sm font-semibold">{ride.captain?.fullname?.firstname} {ride.captain?.fullname?.lastname || ""}</p>
            <p className="text-gray-400 text-xs">+91 {ride.captain?.mobile} · {ride.captain?.vehicle?.plate}</p>
          </div>
        )}

        {/* META */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-3 space-y-1.5">
          <Row label="Vehicle"  value={ride.vehicleType} />
          <Row label="Distance" value={ride.distance ? `${(ride.distance / 1000).toFixed(1)} km` : "—"} />
          <Row label="Duration" value={ride.duration ? `${Math.round(ride.duration / 60)} min` : "—"} />
          <Row label="Date"     value={new Date(ride.createdAt).toLocaleString("en-IN")} />
        </div>

        {/* CANCEL */}
        {!["completed", "cancelled"].includes(ride.status) && (
          <button onClick={() => onCancel(ride._id)}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition active:scale-95 flex items-center justify-center gap-2">
            <i className="ri-close-circle-line"></i>Force Cancel Ride
          </button>
        )}
      </div>
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-500 text-xs">{label}</span>
    <span className="text-white text-xs font-semibold capitalize">{value ?? "—"}</span>
  </div>
);

const STATUSES = ["", "pending", "accepted", "ongoing", "completed", "cancelled"];
const VEHICLES = ["", "car", "auto", "motorcycle"];

const AdminRides = () => {
  const [rides, setRides]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [status, setStatus]   = useState("");
  const [vehicle, setVehicle] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]     = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/rides", { params: { page, status, vehicleType: vehicle, limit: 15 } });
      setRides(r.data.rides); setTotal(r.data.total); setPages(r.data.pages);
    } catch {} finally { setLoading(false); }
  }, [page, status, vehicle]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const handleCancel = async (id) => {
    try {
      await api.patch(`/rides/${id}/cancel`);
      showToast("Ride cancelled");
      setSelected(null);
      fetchRides();
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Rides</h1>
            <p className="text-gray-500 text-sm">{total} total rides</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${status === s ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"}`}>
                {s === "" ? "All Status" : s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {VEHICLES.map((v) => (
              <button key={v} onClick={() => { setVehicle(v); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${vehicle === v ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "bg-zinc-900 border-white/10 text-gray-400 hover:text-white"}`}>
                {v === "" ? "All Vehicles" : v}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Route</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">User</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Captain</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Fare</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : rides.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-500 text-sm">No rides found</td></tr>
                ) : rides.map((r) => (
                  <tr key={r._id} className="border-b border-white/5 hover:bg-white/3 transition">
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-white text-xs font-semibold truncate">{r.pickup}</p>
                      <p className="text-gray-500 text-xs truncate">→ {r.destination}</p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <p className="text-white text-xs font-semibold">{r.user?.fullname || "—"}</p>
                      <p className="text-gray-500 text-xs">{r.user?.mobile}</p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <p className="text-white text-xs font-semibold">{r.captain ? `${r.captain.fullname?.firstname} ${r.captain.fullname?.lastname || ""}` : "—"}</p>
                      <p className="text-gray-500 text-xs">{r.captain?.vehicle?.plate}</p>
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-bold text-sm">₹{r.fare}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(r)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-400 text-gray-400 flex items-center justify-center transition text-sm">
                        <i className="ri-eye-line"></i>
                      </button>
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

      {selected && <RideDetailModal ride={selected} onClose={() => setSelected(null)} onCancel={handleCancel} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-green-400"></i>
          <p className="text-white text-sm font-semibold">{toast}</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRides;
