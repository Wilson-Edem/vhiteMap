import { useState, useEffect, useRef } from "react";

export const useGeolocation = (tracking, batterySaver = false) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  // Check if running inside the native app (React Native WebView)
  const isNativeApp = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

  // Start watching GPS (web only)
  const startWatching = () => {
    // If running inside native app, skip GPS — native layer handles it
    if (isNativeApp) {
      console.log('📱 Native app handles GPS. Web GPS disabled.');
      setError(null);
      return;
    }

    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    // Configure GPS options
    const options = {
      enableHighAccuracy: !batterySaver,
      timeout: batterySaver ? 30000 : 15000,
      maximumAge: batterySaver ? 15000 : 5000,
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        setPosition({
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 0,
        });
        setError(null);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setError(err.message);
      },
      options
    );
  };

  // Stop watching GPS (web only)
  const stopWatching = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Effect to start/stop tracking
  useEffect(() => {
    // If running in native app, skip GPS and clear any errors
    if (isNativeApp) {
      setError(null);
      return;
    }

    if (tracking) {
      startWatching();
    } else {
      stopWatching();
    }

    // Cleanup on unmount
    return () => {
      stopWatching();
    };
  }, [tracking, batterySaver, isNativeApp]);

  return { position, error };
};
