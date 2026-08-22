import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/login.css";

const LoginModal = () => {
  const { registerUser, loginUser } = useAuth();
  const [activeTab, setActiveTab] = useState("register"); // "register" | "login"
  const [uniqueName, setUniqueName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (uniqueName.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      setLoading(false);
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "register") {
        await registerUser(uniqueName.trim(), pin);
        // User is now logged in → App will auto-switch to Dashboard
      } else {
        await loginUser(uniqueName.trim(), pin);
        // User is now logged in
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1 className="login-title">🌍 Vhitemaps</h1>
        <p className="login-subtitle">made by vhite</p>

        {/* Tab Buttons */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => { setActiveTab("register"); setError(""); }}
          >
            📍 Track Me
          </button>
          <button
            className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => { setActiveTab("login"); setError(""); }}
          >
            🔍 Check Location
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="uniqueName">Your Unique Name</label>
            <input
              id="uniqueName"
              type="text"
              placeholder="e.g. JohnDoe"
              value={uniqueName}
              onChange={(e) => setUniqueName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="pin">4-Digit Passcode</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength="4"
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Processing..." : activeTab === "register" ? "🔒 Start Tracking" : "📍 Show My Location"}
          </button>

          <p className="login-hint">
            {activeTab === "register"
              ? "This will create a permanent ID for this device."
              : "Enter the name and PIN you used when you first tracked this device."}
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;