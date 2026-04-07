import axios from "axios";
import BASE_URL from "../baseURL";

const api = axios.create({ baseURL: `${BASE_URL}/admin` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin-token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;
