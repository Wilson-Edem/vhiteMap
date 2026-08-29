// src/App.jsx
import React, { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import LoginModal from "./components/auth/LoginModal";
import Navbar from "./components/common/Navbar";
import UserDashboard from "./components/dashboard/UserDashboard";
import DevDashboard from "./components/dashboard/DevDashboard";
import DownloadPopup from "./components/common/DownloadPopup";
import { isRunningInNativeApp } from "./utils/nativeBridge";

function App() {
  const { user, isLoading } = useAuth();
  const { isDevMode } = useAdmin();

  // Detect if running inside native app (for console logging)
  useEffect(() => {
    if (isRunningInNativeApp()) {
      console.log("📱 Running inside Vhitemap Native App");
      window.isRunningInNativeApp = true;
    } else {
      console.log("🌐 Running in web browser");
      window.isRunningInNativeApp = false;
    }
  }, []);

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
      
      {/* Download popup — only shown on mobile web (not inside native app) */}
      <DownloadPopup />
    </div>
  );
}

export default App;
