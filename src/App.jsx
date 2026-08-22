import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import LoginModal from "./components/auth/LoginModal";
import Navbar from "./components/common/Navbar";
import UserDashboard from "./components/dashboard/UserDashboard";
import DevDashboard from "./components/dashboard/DevDashboard";

function App() {
  const { user, isLoading } = useAuth();
  const { isDevMode } = useAdmin();

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "Arial", color: "#fff" }}>Loading...</div>;
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div style={{ background: "#12121c", minHeight: "100vh", color: "#f0f0f0" }}>
      <Navbar />
      {isDevMode ? <DevDashboard /> : <UserDashboard />}
    </div>
  );
}

export default App;