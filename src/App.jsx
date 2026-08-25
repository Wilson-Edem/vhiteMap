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
    return (
      <div className="flex items-center justify-center h-screen bg-dark text-white/60">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🌍</div>
          <p>Loading Vhitemaps...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-dark">
      <Navbar />
      {isDevMode ? <DevDashboard /> : <UserDashboard />}
    </div>
  );
}

export default App;