import { useState, useEffect } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("captain-token")}` },
});

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

const WalletModal = ({ onClose, onSuccess, captain }) => {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tab, setTab] = useState("recharge");

  const vehicleType = captain?.vehicleType || "car";
  const minBalance = vehicleType === "car" ? 500 : 100;

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    setFetchLoading(true);
    try {
      const res = await axios.get(`${BASE}/captains/wallet`, authHeader());
      setWallet(res.data.wallet);
    } catch {
      setError("Failed to load wallet");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleRecharge = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1) return setError("Enter a valid amount");
    setError("");
    setLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment gateway failed to load. Check internet connection."); setLoading(false); return; }

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
            const verifyRes = await axios.post(
              `${BASE}/captains/wallet/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amt,
              },
              authHeader()
            );
            setWallet(verifyRes.data.wallet);
            setSuccessMsg(`₹${amt} added successfully!`);
            setAmount("");
            setLoading(false);
            onSuccess?.(verifyRes.data.wallet);
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
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error?.description || "Try again"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order. Try again.");
      setLoading(false);
    }
  };

  const balance = wallet?.balance || 0;
  const isLow = balance < minBalance;
  const transactions = wallet?.transactions || [];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "linear-gradient(160deg, #18181b 0%, #1c1917 100%)" }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <i className="ri-wallet-3-fill text-white text-base"></i>
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-tight">My Wallet</h2>
              <p className="text-gray-500 text-xs">Manage your balance</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <i className="ri-close-line text-gray-400 text-lg"></i>
          </button>
        </div>

        {/* BALANCE CARD */}
        <div className="mx-5 mb-4">
          <div className={`rounded-2xl p-4 border ${isLow ? "bg-red-500/10 border-red-500/30" : "bg-violet-500/10 border-violet-500/30"}`}>
            {fetchLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading balance...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Available Balance</p>
                  {isLow && (
                    <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-red-400 text-xs font-bold">Low</span>
                    </div>
                  )}
                </div>
                <p className={`font-black text-4xl mb-1 ${isLow ? "text-red-400" : "text-violet-300"}`}>
                  ₹{balance.toLocaleString("en-IN")}
                </p>
                <p className="text-gray-500 text-xs">
                  Min required for {vehicleType === "car" ? "Car" : vehicleType === "auto" ? "Auto" : "Bike"}:{" "}
                  <span className={`font-bold ${isLow ? "text-red-400" : "text-violet-400"}`}>₹{minBalance}</span>
                </p>
                {isLow && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <p className="text-red-400 text-xs font-semibold">⚠️ Add ₹{minBalance - balance} more to accept rides</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex mx-5 mb-4 bg-white/5 rounded-2xl p-1 border border-white/10">
          {["recharge", "history"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab === t ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-gray-400 hover:text-white"}`}>
              {t === "recharge" ? "💳 Add Money" : "📋 History"}
            </button>
          ))}
        </div>

        {/* RECHARGE TAB */}
        {tab === "recharge" && (
          <div className="px-5 pb-8">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Quick Select</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {QUICK_AMOUNTS.map((a) => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition active:scale-95 ${
                    amount === String(a)
                      ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50 hover:text-white"
                  }`}>
                  ₹{a}
                </button>
              ))}
            </div>

            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Or Enter Amount</p>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-4 focus-within:border-violet-500/60 transition">
              <span className="text-violet-400 font-black text-xl mr-2">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                placeholder="Enter amount"
                className="flex-1 bg-transparent text-white text-lg font-bold outline-none placeholder-gray-600"
                min="1"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3">
                <i className="ri-error-warning-line text-red-400 text-sm"></i>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mb-3">
                <i className="ri-checkbox-circle-line text-green-400 text-sm"></i>
                <p className="text-green-400 text-xs font-semibold">{successMsg}</p>
              </div>
            )}

            <button
              onClick={handleRecharge}
              disabled={loading || !amount}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 text-base">
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
          <div className="px-5 pb-8 max-h-72 overflow-y-auto">
            {fetchLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <i className="ri-receipt-line text-gray-500 text-2xl"></i>
                </div>
                <p className="text-gray-500 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...transactions].reverse().map((txn, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        txn.type === "credit" ? "bg-green-500/15 border border-green-500/20" : "bg-red-500/15 border border-red-500/20"
                      }`}>
                        <i className={`text-sm ${txn.type === "credit" ? "ri-arrow-down-line text-green-400" : "ri-arrow-up-line text-red-400"}`}></i>
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">{txn.description || "Transaction"}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-black text-base ${txn.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
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
};

export default WalletModal;
