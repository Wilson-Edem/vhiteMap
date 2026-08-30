import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

export const useGeolocation = (tracking, batterySaver = false) => {
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const saveTrailTimeoutRef = useRef(null);

  // Check if running inside native app
  const isNativeApp = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

  // Save location to Firebase (only for web, not native)
  const saveLocationToFirebase = async (pos) => {
    if (isNativeApp) return; // Native app handles its own writes
    if (!user) {
      console.warn("No user found. Skipping Firebase write.");
      return;
    }

    try {
      const userRef = doc(db, "devices", user.deviceUID);
      const timestamp = new Date().toISOString();

      // 1. Update lastLocation
      await updateDoc(userRef, {
        lastLocation: {
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading || 0,
          timestamp: timestamp,
        }
      });

      // 2. Add trail point (debounced)
      const trailRef = collection(userRef, "trail");
      await addDoc(trailRef, {
        lat: pos.lat,
        lng: pos.lng,
        timestamp: timestamp,
      });

      console.log(`✅ Web location saved to Firebase: ${pos.lat}, ${pos.lng}`);

    } catch (err) {
      console.error("❌ Web save to Firebase error:", err);
    }
  };

  // Debounced trail save (every 5 seconds)
  const debouncedSaveTrail = (pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 5000);
  };

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
      timeout: batterySaver ? 60000 : 30000,
      maximumAge: batterySaver ? 15000 : 5000,
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        const newPosition = {
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 0,
        };

        setPosition(newPosition);
        setError(null);

        // 👇 NEW: Write to Firebase (web writes its own GPS)
        debouncedSaveTrail(newPosition);

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
    if (saveTrailTimeoutRef.current) {
      clearTimeout(saveTrailTimeoutRef.current);
      saveTrailTimeoutRef.current = null;
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
