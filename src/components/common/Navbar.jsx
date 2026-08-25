import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAdmin } from "../../contexts/AdminContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import DevModal from "../auth/DevModal";

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { isDevMode } = useAdmin();
  const { isDarkMode, toggleTheme } = useTheme();
  const { batterySaver, toggleBatterySaver, checkBatteryAndSuggest } = useSettings();
  const [showDevModal, setShowDevModal] = useState(false);
  const [showBatterySuggestion, setShowBatterySuggestion] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isLow = await checkBatteryAndSuggest();
      if (isLow) setShowBatterySuggestion(true);
    };
    check();
  }, []);

  return (
    <>
      {/* 导航栏 - 固定在顶部，毛玻璃效果 */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 md:p-4 pointer-events-none">
        <div className="glass rounded-2xl px-4 py-2.5 md:px-6 md:py-3 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg md:text-xl tracking-tight">
              🌍 Vhitemaps
            </span>
            {isDevMode && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/30 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                DEV
              </span>
            )}
            <span className="text-white/40 text-xs hidden sm:inline">
              {user?.uniqueName}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/60 hover:text-white"
              title="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* 电池省电模式 */}
            <button
              onClick={toggleBatterySaver}
              className={`p-2 rounded-xl transition-all ${
                batterySaver 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'hover:bg-white/10 text-white/40 hover:text-white/60'
              }`}
              title="Battery Saver"
            >
              🔋 {batterySaver && '⚡'}
            </button>

            {/* 开发者入口 */}
            <button
              onClick={() => setShowDevModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              🔐 Dev
            </button>

            {/* 登出 */}
            <button
              onClick={logoutUser}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* 电池省电建议提示 */}
      {showBatterySuggestion && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 glass rounded-2xl p-4 pointer-events-auto">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔋</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Battery is low!</p>
              <p className="text-white/50 text-xs mt-0.5">Enable Saver Mode to reduce GPS usage</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { toggleBatterySaver(); setShowBatterySuggestion(false); }}
                  className="px-4 py-1.5 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30 transition-all"
                >
                  Enable
                </button>
                <button
                  onClick={() => setShowBatterySuggestion(false)}
                  className="px-4 py-1.5 rounded-xl bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDevModal && <DevModal onClose={() => setShowDevModal(false)} />}
    </>
  );
};

export default Navbar;