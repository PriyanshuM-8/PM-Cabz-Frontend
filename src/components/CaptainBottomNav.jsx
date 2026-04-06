import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { CaptainDataContext } from "../context/CaptainContext";

const BASE = import.meta.env.VITE_BASE_URL;
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("captain-token")}` },
});

/* ─── BOTTOM NAV BAR ─── */
export function CaptainBottomNav({ active, onChange }) {
  const tabs = [
    { key: "home", icon: "ri-home-5-fill", label: "Home" },
    { key: "history", icon: "ri-route-line", label: "Rides" },
    { key: "payments", icon: "ri-bank-card-2-line", label: "Payments" },
    { key: "profile", icon: "ri-user-3-line", label: "Profile" },
  ];

  return (
    <div className="flex items-center px-2 pt-1 pb-2 border-t border-white/8">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 transition active:scale-95"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                isActive ? "bg-amber-500/15 border border-amber-500/30" : ""
              }`}
            >
              <i
                className={`${t.icon} text-xl ${
                  isActive ? "text-amber-400" : "text-gray-500"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-bold ${
                isActive ? "text-amber-400" : "text-gray-600"
              }`}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── RIDE HISTORY TAB ─── */
export function RideHistoryTab() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE}/captains/rides/history`, auth())
      .then((r) => setRides(r.data.rides || []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (s) =>
    s === "completed"
      ? { text: "text-green-400", bg: "bg-green-500/10 border-green-500/20" }
      : s === "cancelled"
      ? { text: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }
      : { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-7 h-7 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-gray-500 text-xs">Loading rides...</p>
      </div>
    );

  if (rides.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
          <i className="ri-route-line text-gray-500 text-2xl" />
        </div>
        <p className="text-gray-400 font-bold text-sm">No rides yet</p>
        <p className="text-gray-600 text-xs">Completed rides will appear here</p>
      </div>
    );

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5">
      {rides.map((ride, i) => {
        const st = statusStyle(ride.status);
        return (
          <div
            key={ride._id || i}
            className="bg-white/4 border border-white/8 rounded-2xl p-3.5"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                  <i className="ri-car-line text-amber-400 text-sm" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">
                    {new Date(ride.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {new Date(ride.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${st.bg} ${st.text}`}
              >
                {ride.status}
              </span>
            </div>

            <div className="space-y-1.5 mb-2.5">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#4ade80]" />
                <p className="text-gray-300 text-[11px] line-clamp-1">{ride.pickup || "—"}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0 shadow-[0_0_4px_#f87171]" />
                <p className="text-gray-300 text-[11px] line-clamp-1">{ride.destination || "—"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/6">
              <div className="flex items-center gap-1.5">
                <i className="ri-user-line text-gray-500 text-[10px]" />
                <p className="text-gray-400 text-[11px]">
                  {ride.user?.fullname?.firstname || "Passenger"}
                </p>
              </div>
              <p className="text-green-400 font-black text-sm">
                ₹{ride.fare?.toLocaleString("en-IN") || "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PAYMENT HISTORY TAB ─── */
export function PaymentHistoryTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE}/captains/payments/history`, auth())
      .then((r) => setPayments(r.data.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const modeIcon = (m) =>
    m === "cash" ? "ri-money-rupee-circle-line" : "ri-bank-card-2-line";
  const modeColor = (m) => (m === "cash" ? "text-green-400" : "text-violet-400");
  const modeBg = (m) =>
    m === "cash"
      ? "bg-green-500/10 border-green-500/20"
      : "bg-violet-500/10 border-violet-500/20";

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        <p className="text-gray-500 text-xs">Loading payments...</p>
      </div>
    );

  if (payments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
          <i className="ri-bank-card-2-line text-gray-500 text-2xl" />
        </div>
        <p className="text-gray-400 font-bold text-sm">No payments yet</p>
        <p className="text-gray-600 text-xs">Payment records will appear here</p>
      </div>
    );

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-3">
      {/* TOTAL CARD */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs">Total Earned</p>
          <p className="text-violet-300 font-black text-xl">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/25 rounded-2xl flex items-center justify-center">
          <i className="ri-wallet-3-fill text-violet-400 text-lg" />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-0.5">
        {payments.map((p, i) => (
          <div
            key={p._id || i}
            className="bg-white/4 border border-white/8 rounded-2xl px-3.5 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${modeBg(p.paymentMode)}`}
              >
                <i className={`${modeIcon(p.paymentMode)} text-base ${modeColor(p.paymentMode)}`} />
              </div>
              <div>
                <p className="text-white text-xs font-bold capitalize">
                  {p.paymentMode || "Payment"}
                </p>
                <p className="text-gray-500 text-[10px]">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {new Date(p.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <p className="text-green-400 font-black text-sm">
              +₹{p.amount?.toLocaleString("en-IN") || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PROFILE TAB ─── */
export function ProfileTab({ captain, isOnline, walletBal, onLogout }) {
  const vehicleType = captain?.vehicleType || "car";
  const firstName = captain?.fullname?.firstname || "Captain";
  const lastName = captain?.fullname?.lastname || "";

  const info = [
    { icon: "ri-phone-line", label: "Phone", value: captain?.mobile || "—" },
    { icon: "ri-mail-line", label: "Email", value: captain?.email || "—" },
    {
      icon: "ri-star-fill",
      label: "Rating",
      value: `★ ${captain?.rating || "5.0"}`,
      color: "text-amber-400",
    },
    {
      icon: "ri-riding-line",
      label: "Total Rides",
      value: captain?.totalRides || 0,
      color: "text-white",
    },
  ];

  return (
    <div className="space-y-3">
      {/* AVATAR + NAME */}
      <div className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl px-4 py-3">
        {captain?.profilePic ? (
          <img
            src={captain.profilePic}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/30"
            alt=""
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-black text-white flex-shrink-0">
            {firstName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base truncate">
            {firstName} {lastName}
          </p>
          <p className="text-gray-500 text-xs capitalize">{vehicleType} Driver</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-green-400 shadow-[0_0_4px_#4ade80]" : "bg-gray-500"
              }`}
            />
            <span
              className={`text-[11px] font-semibold ${
                isOnline ? "text-green-400" : "text-gray-500"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-[10px]">Wallet</p>
          <p className="text-violet-300 font-black text-sm">
            ₹{walletBal?.toLocaleString("en-IN") ?? "—"}
          </p>
        </div>
      </div>

      {/* VEHICLE */}
      <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <i
              className={`${
                vehicleType === "motorcycle"
                  ? "ri-motorbike-line"
                  : vehicleType === "auto"
                  ? "ri-taxi-line"
                  : "ri-car-line"
              } text-amber-400 text-base`}
            />
          </div>
          <div>
            <p className="text-white text-xs font-bold">
              {captain?.vehicle?.vehicleModel || "Vehicle"}
            </p>
            <p className="text-gray-500 text-[10px] capitalize">{vehicleType}</p>
          </div>
        </div>
        <div className="bg-white/8 border border-white/12 rounded-xl px-3 py-1">
          <p className="text-white font-black text-xs tracking-widest">
            {captain?.vehicle?.plate || "----"}
          </p>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-2">
        {info.map((item) => (
          <div
            key={item.label}
            className="bg-white/4 border border-white/8 rounded-2xl px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <i className={`${item.icon} text-gray-500 text-xs`} />
              <p className="text-gray-500 text-[10px]">{item.label}</p>
            </div>
            <p className={`font-bold text-xs truncate ${item.color || "text-gray-300"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* LOGOUT */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl py-3 text-red-400 font-bold text-sm transition active:scale-[0.98]"
      >
        <i className="ri-logout-box-r-line text-base" />
        Logout
      </button>
    </div>
  );
}
