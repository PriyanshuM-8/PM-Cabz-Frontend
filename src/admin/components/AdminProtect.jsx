import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const AdminProtect = ({ children }) => {
  const [ok, setOk]           = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) { navigate("/admin/login"); return; }

    api.get("/dashboard")
      .then(() => setOk(true))
      .catch(() => { localStorage.removeItem("admin-token"); navigate("/admin/login"); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return ok ? children : null;
};

export default AdminProtect;
