import React, { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import "../../styles/login.css"; // reuses same styling

const DevModal = ({ onClose }) => {
  const { verifyDevPassword, isDevLoading } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await verifyDevPassword(password);
    if (success) {
      onClose(); // Close modal and activate Dev mode
    } else {
      setError("❌ Incorrect developer password.");
    }
  };

  return (
    <div className="login-overlay" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="login-card" style={{ maxWidth: "400px", border: "2px solid #ff4444" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#ff4444", margin: 0 }}>🔐 Developer Access</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: "24px", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ color: "#aaa", fontSize: "14px", marginTop: "4px" }}>Enter the master password to unlock admin features.</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="devPassword">Master Password</label>
            <input
              id="devPassword"
              type="password"
              placeholder="Enter secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" style={{ background: "#ff4444" }} disabled={isDevLoading}>
            {isDevLoading ? "Verifying..." : "🔓 Unlock Developer Mode"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DevModal;