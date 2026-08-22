import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAdmin } from "../../contexts/AdminContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import DevModal from "../auth/DevModal";
import "../../styles/navbar.css";

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { isDevMode } = useAdmin();
  const { isDarkMode, toggleTheme } = useTheme();
  const { batterySaver, toggleBatterySaver, checkBatteryAndSuggest } = useSettings();
  const [showDevModal, setShowDevModal] = useState(false);
  const [showBatterySuggestion, setShowBatterySuggestion] = useState(false);

  // Check battery on mount
  useEffect(() => {
    const check = async () => {
      const isLow = await checkBatteryAndSuggest();
      if (isLow) {
        setShowBatterySuggestion(true);
        // Auto-enable? Or just suggest. We'll suggest.
      }
    };
    check();
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo">🌍 Vhitemaps</span>
          {isDevMode && <span className="dev-badge">👨‍💻 DEV</span>}
        </div>

        <div className="nav-right">
          {/* Theme Toggle */}
          <button className="nav-btn icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {/* Battery Saver Toggle */}
          <button
            className={`nav-btn icon-btn ${batterySaver ? "active-saver" : ""}`}
            onClick={toggleBatterySaver}
            title="Battery Saver Mode"
          >
            🔋 {batterySaver && "⚡"}
          </button>

          <span className="nav-user">👤 {user?.uniqueName}</span>
          <button className="nav-btn dev-btn" onClick={() => setShowDevModal(true)}>
            🔐 Dev Access
          </button>
          <button className="nav-btn logout-btn" onClick={logoutUser}>
            Logout
          </button>
        </div>
      </nav>

      {/* Battery Saver Suggestion Toast */}
      {showBatterySuggestion && (
        <div className="battery-toast">
          <span>🔋 Battery is low! Would you like to enable Saver Mode?</span>
          <button onClick={() => { toggleBatterySaver(); setShowBatterySuggestion(false); }}>
            Yes, Enable
          </button>
          <button onClick={() => setShowBatterySuggestion(false)}>Dismiss</button>
        </div>
      )}

      {showDevModal && <DevModal onClose={() => setShowDevModal(false)} />}
    </>
  );
};

export default Navbar;