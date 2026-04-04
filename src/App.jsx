// import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// User pages
// import Start from "./pages/Start";
import BookRide from "./pages/BookRide";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import UserLogout from "./pages/UserLogout";
import UserProtectWrapper from "./pages/UserProtectWrapper";
import Home from "./pages/Home";
import Riding from "./pages/Riding";

// Captain pages
import CaptainLogin from "./pages/CaptainLogin";
import CaptainSignup from "./pages/CaptainSignup";
import CaptainLogout from "./pages/CaptainLogout";
import CaptainProtectWrapper from "./pages/CaptainProtectWrapper";
import CaptainHome from "./pages/CaptainHome";
import CaptainRiding from "./pages/CaptainRiding";

// Admin pages
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminCaptains from "./admin/pages/AdminCaptains";
import AdminRides from "./admin/pages/AdminRides";
import AdminPayments from "./admin/pages/AdminPayments";
import AdminWallets from "./admin/pages/AdminWallets";
import AdminProtect from "./admin/components/AdminProtect";

const App = () => {
  return (
    <div>
      <Routes>
        {/* ── USER ROUTES ── */}
        <Route path="/" element={<Navigate to="/book" replace />} />  
        <Route path="/book" element={<BookRide />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/user/logout" element={<UserLogout />} />

        <Route
          path="/home"
          element={
            <UserProtectWrapper>
              <Home />
            </UserProtectWrapper>
          }
        />
        <Route
          path="/riding"
          element={
            <UserProtectWrapper>
              <Riding />
            </UserProtectWrapper>
          }
        />

        {/* ── CAPTAIN ROUTES ── */}
        <Route path="/captain-login" element={<CaptainLogin />} />
        <Route path="/captain-signup" element={<CaptainSignup />} />

        <Route
          path="/captain-home"
          element={
            <CaptainProtectWrapper>
              <CaptainHome />
            </CaptainProtectWrapper>
          }
        />
        <Route
          path="/captain-riding"
          element={
            <CaptainProtectWrapper>
              <CaptainRiding />
            </CaptainProtectWrapper>
          }
        />
        <Route
          path="/captain-logout"
          element={
            <CaptainProtectWrapper>
              <CaptainLogout />
            </CaptainProtectWrapper>
          }
        />

        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtect>
              <AdminDashboard />
            </AdminProtect>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtect>
              <AdminUsers />
            </AdminProtect>
          }
        />
        <Route
          path="/admin/captains"
          element={
            <AdminProtect>
              <AdminCaptains />
            </AdminProtect>
          }
        />
        <Route
          path="/admin/rides"
          element={
            <AdminProtect>
              <AdminRides />
            </AdminProtect>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminProtect>
              <AdminPayments />
            </AdminProtect>
          }
        />
        <Route
          path="/admin/wallets"
          element={
            <AdminProtect>
              <AdminWallets />
            </AdminProtect>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
