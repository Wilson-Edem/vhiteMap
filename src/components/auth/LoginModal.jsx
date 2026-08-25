import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const LoginModal = () => {
  const { registerUser, loginUser } = useAuth();
  const [activeTab, setActiveTab] = useState("register");
  const [uniqueName, setUniqueName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      } else {
        await loginUser(uniqueName.trim(), pin);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/95 p-4">
      <div className="glass rounded-3xl p-8 md:p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            🌍 Vhitemaps
          </h1>
          <p className="text-white/30 text-sm mt-1 tracking-wider">made by vhite</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1.5 bg-white/5 rounded-2xl p-1.5 mb-6">
          <button
            onClick={() => { setActiveTab("register"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "register" 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white/60"
            }`}
          >
            📍 Track Me
          </button>
          <button
            onClick={() => { setActiveTab("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "login" 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white/60"
            }`}
          >
            🔍 Check Location
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/50 text-sm block mb-1.5">Your Unique Name</label>
            <input
              type="text"
              placeholder="e.g. JohnDoe"
              value={uniqueName}
              onChange={(e) => setUniqueName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-white/50 text-sm block mb-1.5">4-Digit Passcode</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
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
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : activeTab === "register" ? "🔒 Start Tracking" : "📍 Show My Location"}
          </button>

          <p className="text-center text-white/20 text-xs mt-2">
            {activeTab === "register"
              ? "This creates a permanent ID for this device"
              : "Enter the name and PIN you used when you first tracked"}
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;