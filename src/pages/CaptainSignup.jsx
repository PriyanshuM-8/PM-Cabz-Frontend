import { useState, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../context/CaptainContext";
import axios from "axios";
import logo from "../photo/logo.png";

const STEPS = ["Personal", "Vehicle", "Documents"];

const Input = ({ label, icon, ...props }) => (
  <div>
    {label && <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{label}</label>}
    <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3 transition">
      {icon && <i className={`${icon} text-gray-500 mr-3 text-sm`}></i>}
      <input className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm" {...props} />
    </div>
  </div>
);

const FileInput = ({ label, icon, onChange, file }) => (
  <div>
    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{label}</label>
    <label className={`flex items-center gap-3 border border-dashed rounded-2xl px-4 py-3 cursor-pointer transition ${file ? "border-green-500/40 bg-green-500/5" : "border-white/15 bg-white/5 hover:border-amber-500/40"}`}>
      <i className={`${icon} text-sm ${file ? "text-green-400" : "text-gray-500"}`}></i>
      <span className={`text-sm truncate ${file ? "text-green-400" : "text-gray-500"}`}>
        {file ? file.name : "Tap to upload"}
      </span>
      {file && <i className="ri-check-line text-green-400 ml-auto"></i>}
      <input type="file" className="hidden" onChange={onChange} accept="image/*,.pdf" />
    </label>
  </div>
);

const CaptainSignup = () => {
  const navigate = useNavigate();
  const { setCaptain } = useContext(CaptainDataContext);

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  // Vehicle
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");

  // Documents
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [dlNumber, setDlNumber] = useState("");
  const [dlFile, setDlFile] = useState(null);

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!firstName.trim() || firstName.length < 2) return setError("Enter valid first name") || false;
      if (mobile.length !== 10) return setError("Enter valid 10-digit mobile") || false;
      if (!email.includes("@")) return setError("Enter valid email") || false;
      if (password.length < 6) return setError("Password must be 6+ characters") || false;
    }
    if (step === 1) {
      if (!vehicleType) return setError("Select vehicle type") || false;
      if (!vehicleModel.trim()) return setError("Enter vehicle model") || false;
      if (!vehiclePlate.trim()) return setError("Enter plate number") || false;
      if (!vehicleCapacity) return setError("Enter capacity") || false;
    }
    if (step === 2) {
      if (aadhaarNumber.length !== 12) return setError("Aadhaar must be 12 digits") || false;
      if (!dlNumber.trim()) return setError("Enter driving license number") || false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };
  const handleBack = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    const formData = new FormData();
    if (profilePic) formData.append("profilePic", profilePic);
    if (aadhaarFile) formData.append("aadhaarFile", aadhaarFile);
    if (dlFile) formData.append("drivingLicenseFile", dlFile);
    formData.append("fullname[firstname]", firstName.trim());
    formData.append("fullname[lastname]", lastName.trim());
    formData.append("mobile", mobile.trim());
    formData.append("email", email.trim());
    formData.append("password", password);
    formData.append("vehicle[vehicleType]", vehicleType);
    formData.append("vehicle[vehicleModel]", vehicleModel.trim());
    formData.append("vehicle[color]", vehicleColor.trim() || "Black");
    formData.append("vehicle[plate]", vehiclePlate.trim().toUpperCase());
    formData.append("vehicle[capacity]", vehicleCapacity);
    formData.append("documents[aadhaarNumber]", aadhaarNumber.trim());
    formData.append("documents[drivingLicense]", dlNumber.trim());
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, formData);
      setCaptain(res.data.captain);
      localStorage.setItem("captain-token", res.data.token);
      navigate("/captain-home");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <button onClick={() => step > 0 ? handleBack() : navigate("/captain-login")}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <i className="ri-arrow-left-line text-white text-sm"></i>
        </button>
        <div className="flex items-center gap-2">
       <div className=" w-20 bg-gradient-to-br rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <img src={logo} alt="" className="rounded-4xl h-20 w-20 "  />
          </div>
        </div>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 px-6 py-6 overflow-y-auto">

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > i ? "bg-green-500 text-white" : step === i ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-white/10 text-gray-500"
              }`}>
                {step > i ? <i className="ri-check-line text-xs"></i> : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${step === i ? "text-amber-400" : "text-gray-600"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${step > i ? "bg-green-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <h1 className="text-white text-xl font-black mb-1">{STEPS[step]} Info</h1>
        <p className="text-gray-500 text-xs mb-6">Step {step + 1} of {STEPS.length}</p>

        {/* STEP 0 — PERSONAL */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input label="First Name" icon="ri-user-line" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Last Name" icon="ri-user-line" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Mobile</label>
              <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-amber-500/60 rounded-2xl px-4 py-3 transition">
                <span className="text-amber-400 font-bold text-sm mr-3">+91</span>
                <div className="w-px h-5 bg-white/20 mr-3" />
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile" className="bg-transparent outline-none flex-1 text-white placeholder-gray-600 text-sm" />
                {mobile.length === 10 && <i className="ri-check-line text-green-400 text-sm"></i>}
              </div>
            </div>
            <Input label="Email" icon="ri-mail-line" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" icon="ri-lock-line" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            <FileInput label="Profile Photo (Optional)" icon="ri-camera-line" onChange={(e) => setProfilePic(e.target.files[0])} file={profilePic} />
          </div>
        )}

        {/* STEP 1 — VEHICLE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Vehicle Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ v: "car", e: "🚗", l: "Car" }, { v: "auto", e: "🛺", l: "Auto" }, { v: "motorcycle", e: "🏍", l: "Bike" }].map(({ v, e, l }) => (
                  <button key={v} type="button" onClick={() => setVehicleType(v)}
                    className={`py-3 rounded-2xl border text-center transition active:scale-95 ${vehicleType === v ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                    <div className="text-2xl mb-1">{e}</div>
                    <div className="text-xs font-bold">{l}</div>
                  </button>
                ))}
              </div>
            </div>
            <Input label="Vehicle Model" icon="ri-car-line" placeholder="e.g. Maruti Swift" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
            <Input label="Color" icon="ri-palette-line" placeholder="e.g. White" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
            <Input label="Plate Number" icon="ri-hashtag" placeholder="e.g. DL01AB1234" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} />
            <Input label="Capacity (seats)" icon="ri-group-line" type="number" placeholder="e.g. 4" min={1} max={10} value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value)} />
          </div>
        )}

        {/* STEP 2 — DOCUMENTS */}
        {step === 2 && (
          <div className="space-y-4">
            <Input label="Aadhaar Number" icon="ri-id-card-line" placeholder="12-digit Aadhaar" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))} maxLength={12} />
            <FileInput label="Aadhaar Upload" icon="ri-file-image-line" onChange={(e) => setAadhaarFile(e.target.files[0])} file={aadhaarFile} />
            <Input label="Driving License Number" icon="ri-drive-line" placeholder="License number" value={dlNumber} onChange={(e) => setDlNumber(e.target.value)} />
            <FileInput label="Driving License Upload" icon="ri-file-image-line" onChange={(e) => setDlFile(e.target.files[0])} file={dlFile} />
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
            <i className="ri-error-warning-line text-red-400 text-sm"></i>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* BUTTONS */}
        <div className="mt-6 space-y-3">
          {step < 2 ? (
            <button onClick={handleNext}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25">
              Next Step →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</>
                : <><i className="ri-check-double-line"></i>Create Account</>}
            </button>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Already registered?{" "}
          <Link to="/captain-login" className="text-amber-400 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default CaptainSignup;
