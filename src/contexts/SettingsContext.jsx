import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [batterySaver, setBatterySaver] = useState(() => {
    const saved = localStorage.getItem("batterySaver");
    return saved === "true";
  });
  const [showTrail, setShowTrail] = useState(() => {
    const saved = localStorage.getItem("showTrail");
    return saved !== "false"; // 默认为 true
  });

  useEffect(() => {
    localStorage.setItem("batterySaver", batterySaver);
  }, [batterySaver]);

  useEffect(() => {
    localStorage.setItem("showTrail", showTrail);
  }, [showTrail]);

  const toggleBatterySaver = () => setBatterySaver(prev => !prev);
  const toggleShowTrail = () => setShowTrail(prev => !prev);

  const checkBatteryAndSuggest = async () => {
    if (!navigator.getBattery) return false;
    try {
      const battery = await navigator.getBattery();
      return battery.level < 0.2 && !battery.charging && !batterySaver;
    } catch (_) {
      return false;
    }
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