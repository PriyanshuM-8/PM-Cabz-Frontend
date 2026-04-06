import { useState, useEffect } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("captain-token")}` } });

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const QUICK = [100, 200, 500, 1000, 2000];

export default function WalletModal({ onClose, onSuccess, captain }) {
  const [wallet,       setWallet]       = useState(null);
  const [amount,       setAmount]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");
  const [tab,          setTab]          = useState("recharge");

  const vehicleType = captain?.vehicleType || "car";
  const minBalance  = vehicleType === "car" ? 500 : 100;

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    setFetchLoading(true);
    try {
      const r = await axios.get(`${BASE}/captains/wallet`, authHeader());
      setWallet(r.data.wallet);
    } catch { setError("Failed to load wallet"); }
    finally { setFetchLoading(false); }
  };

  const handleRecharge = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1) return setError("Enter a valid amount");
    setError(""); setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment gateway failed to load."); setLoading(false); return; }

      const { data } = await axios.post(`${BASE}/captains/wallet/create-order`, { amount: amt }, authHeader());
      if (!data?.order?.id) { setError("Failed to create payment order"); setLoading(false); return; }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: "INR",
        name: "CabApp Wallet",
        description: "Wallet Recharge",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const vr = await axios.post(`${BASE}/captains/wallet/verify`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount: amt,
            }, authHeader());
            setWallet(vr.data.wallet);
            setSuccessMsg(`₹${amt} added successfully!`);
            setAmount(""); setLoading(false);
            onSuccess?.(vr.data.wallet);
            setTimeout(() => setSuccessMsg(""), 3000);
          } catch (e) {
            setError(e.response?.data?.message || "Payment verification failed");
            setLoading(false);
          }
        },
        prefill: { name: captain?.fullname?.firstname || "Captain" },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => setLoading(false), escape: true },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => { setError(`Payment failed: ${r.error?.description || "Try again"}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order.");
      setLoading(false);
    }
  };

  const balance      = wallet?.balance || 0;
  const isLow        = balance < minBalance;
  const transactions = wallet?.transactions || [];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* MODAL — bottom sheet on mobile, centered on sm+ */}
      <div className="relative w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border border-white/10 animate-slideUp sm:animate-fadeIn"
        style={{ background: "linear-gradient(160deg, #18181b 0%, #1c1917 100%)" }}>

        {/* HANDLE (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <i className="ri-wallet-3-fill text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-white font-black text-base sm:text-lg leading-tight">My Wallet</h2>
              <p className="text-gray-500 text-xs">Manage your balance</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition">
            <i className="ri-close-line text-gray-400 text-lg"></i>
          </button>
        </div>

        {/* BALANCE CARD */}
        <div className="px-5 pt-4 pb-3">
          <div className={`rounded-2xl p-4 border ${isLow ? "bg-red-500/10 border-red-500/30" : "bg-violet-500/10 border-violet-500/30"}`}>
            {fetchLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading balance...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Available Balance</p>
                  {isLow && (
                    <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-red-400 text-xs font-bold">Low</span>
                    </div>
                  )}
                </div>
                <p className={`font-black text-3xl sm:text-4xl mb-1 ${isLow ? "text-red-400" : "text-violet-300"}`}>
                  ₹{balance.toLocaleString("en-IN")}
                </p>
                <p className="text-gray-500 text-xs">
                  Min for {vehicleType === "car" ? "Car" : vehicleType === "auto" ? "Auto" : "Bike"}:{" "}
                  <span className={`font-bold ${isLow ? "text-red-400" : "text-violet-400"}`}>₹{minBalance}</span>
                </p>
                {isLow && (
                  <div className="mt-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <p className="text-red-400 text-xs font-semibold">⚠️ Add ₹{minBalance - balance} more to accept rides</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex mx-5 mb-3 bg-white/5 rounded-2xl p-1 border border-white/10">
          {["recharge", "history"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab === t ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-gray-400 hover:text-white"}`}>
              {t === "recharge" ? "💳 Add Money" : "📋 History"}
            </button>
          ))}
        </div>

        {/* RECHARGE TAB */}
        {tab === "recharge" && (
          <div className="px-5 pb-6 sm:pb-8">
            {/* QUICK AMOUNTS */}
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Quick Select</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {QUICK.map((a) => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition active:scale-95 ${
                    amount === String(a)
                      ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50 hover:text-white"
                  }`}>
                  ₹{a}
                </button>
              ))}
            </div>

            {/* CUSTOM AMOUNT */}
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Or Enter Amount</p>
            <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-violet-500/60 rounded-2xl px-4 py-3 mb-4 transition">
              <span className="text-violet-400 font-black text-xl mr-2">₹</span>
              <input
                type="number" value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                placeholder="Enter amount"
                className="flex-1 bg-transparent text-white text-lg font-bold outline-none placeholder-gray-600"
                min="1"
              />
            </div>

            {/* ERROR / SUCCESS */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-3">
                <i className="ri-error-warning-line text-red-400 text-sm flex-shrink-0"></i>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 mb-3">
                <i className="ri-checkbox-circle-line text-green-400 text-sm flex-shrink-0"></i>
                <p className="text-green-400 text-xs font-semibold">{successMsg}</p>
              </div>
            )}

            {/* PAY BUTTON */}
            <button onClick={handleRecharge} disabled={loading || !amount}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 text-sm sm:text-base">
              {loading
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                : <><i className="ri-secure-payment-line text-lg"></i>Pay ₹{amount || "0"} via Razorpay</>}
            </button>

            <p className="text-center text-gray-600 text-xs mt-3 flex items-center justify-center gap-1">
              <i className="ri-shield-check-line text-green-500"></i>
              Secured by Razorpay · 100% Safe
            </p>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div className="px-5 pb-6 sm:pb-8 max-h-64 sm:max-h-72 overflow-y-auto">
            {fetchLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <i className="ri-receipt-line text-gray-500 text-xl"></i>
                </div>
                <p className="text-gray-500 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...transactions].reverse().map((txn, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        txn.type === "credit" ? "bg-green-500/15 border border-green-500/20" : "bg-red-500/15 border border-red-500/20"
                      }`}>
                        <i className={`text-xs ${txn.type === "credit" ? "ri-arrow-down-line text-green-400" : "ri-arrow-up-line text-red-400"}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{txn.description || "Transaction"}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-black text-sm sm:text-base flex-shrink-0 ml-2 ${txn.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                      {txn.type === "credit" ? "+" : "−"}₹{txn.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
