import { useState, useEffect, useRef, useCallback } from "react";

export const useGeolocation = (enabled, batterySaver = false) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude, heading, speed, accuracy } = pos.coords;
    setPosition({
      lat: latitude,
      lng: longitude,
      heading: heading || 0,
      speed: speed || 0,
      accuracy: accuracy || 0,
    });
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    const options = {
      enableHighAccuracy: !batterySaver,
      timeout: batterySaver ? 30000 : 15000,
      maximumAge: batterySaver ? 15000 : 5000,
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }, [batterySaver, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // --- Page visibility: fast resume when tab becomes visible ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        // Restart watching to get a fresh fix quickly
        if (watchIdRef.current) {
          stopWatching();
          startWatching();
        } else {
          startWatching();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, startWatching, stopWatching]);

  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }
    return () => {
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  return { position, error };
};
