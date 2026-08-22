import { useState, useEffect, useRef } from "react";

export const useGeolocation = (tracking, batterySaver = false) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!tracking) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const handleSuccess = (pos) => {
      const { latitude, longitude, heading, speed, accuracy } = pos.coords;
      setPosition({
        lat: latitude,
        lng: longitude,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 0,
      });
      setError(null);
    };

    const handleError = (err) => {
      console.warn("Geolocation error:", err.message);
      setError(err.message);
    };

    // 🧠 Battery Saver Logic
    const options = {
      enableHighAccuracy: !batterySaver, // If saver is ON, disable high accuracy (uses less GPS power)
      timeout: batterySaver ? 20000 : 10000,
      maximumAge: batterySaver ? 15000 : 3000, // Update every 15s in saver mode, 3s normally
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, batterySaver]);

  return { position, error };
};