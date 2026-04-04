import { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login"); // ✅ was /home before — bug fixed
      });
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-500">
        <div className="bg-white/10 backdrop-blur-md px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 border border-white/20">
          <div className="w-12 h-12 border-4 border-white/30 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-white text-sm tracking-wide">Finding your ride...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserProtectWrapper;
