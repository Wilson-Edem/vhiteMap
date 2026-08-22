import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [batterySaver, setBatterySaver] = useState(() => {
    const saved = localStorage.getItem("batterySaver");
    return saved === "true";
  });
  const [showTrail, setShowTrail] = useState(true); // User can toggle trail visibility on the map

  useEffect(() => {
    localStorage.setItem("batterySaver", batterySaver);
  }, [batterySaver]);

  const toggleBatterySaver = () => setBatterySaver((prev) => !prev);
  const toggleShowTrail = () => setShowTrail((prev) => !prev);

  // Auto-detect battery level and suggest Saver Mode
  const checkBatteryAndSuggest = async () => {
    if (!navigator.getBattery) return; // Only works on Chromium
    try {
      const battery = await navigator.getBattery();
      const isLow = battery.level < 0.2 && !battery.charging;
      if (isLow && !batterySaver) {
        // We will handle the UI popup in the Navbar or Dashboard
        return true; // Return true so the UI can show a suggestion
      }
    } catch (_) {}
    return false;
  };

  return (
    <SettingsContext.Provider
      value={{
        batterySaver,
        toggleBatterySaver,
        showTrail,
        toggleShowTrail,
        checkBatteryAndSuggest,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);