import { useEffect } from "react";
import axios from "axios";
import BASE_URL from "../baseURL";
import { useNavigate } from "react-router-dom";

const UserLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${BASE_URL}/users/logout`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("rideData");
        navigate("/login");
      });
  }, []);

  return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Logging out...</p>
    </div>
  );
};

export default UserLogout;
