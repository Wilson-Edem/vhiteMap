import React, { useState } from "react";
import { useAdmin } from "../../contexts/AdminContext";

const DevModal = ({ onClose }) => {
  const { verifyDevPassword, isDevLoading } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await verifyDevPassword(password);
    if (success) {
      onClose();
    } else {
      setError("❌ Incorrect developer password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-3xl p-8 max-w-md w-full pointer-events-auto border-red-500/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-xl font-bold">🔐 Developer Access</h2>
            <p className="text-white/40 text-sm mt-0.5">Enter the master password</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-2xl transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/50 text-sm block mb-1.5">Master Password</label>
            <input
              type="password"
              placeholder="Enter secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-all"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isDevLoading}
            className="w-full py-3.5 rounded-xl bg-red-500 text-white font-semibold text-base hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {isDevLoading ? "Verifying..." : "🔓 Unlock Developer Mode"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DevModal;