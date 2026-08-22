import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { haversineDistance } from "../../utils/haversine";
import LiveMap from "../map/LiveMap";
import { db } from "../../firebase/config";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
//import "../../styles/map.css";

const UserDashboard = () => {
  const { user, tracking } = useAuth();
  const { batterySaver, showTrail } = useSettings();
  const { position, error } = useGeolocation(tracking, batterySaver);
  const prevPositionRef = useRef(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [trail, setTrail] = useState([]);
  const saveTrailTimeoutRef = useRef(null);

  // Save location to Firestore (main doc) + Trail to subcollection
  const saveLocationToFirebase = useCallback(async (pos) => {
    if (!user) return;
    try {
      const userRef = doc(db, "devices", user.deviceUID);
      // Update main doc with last location
      await updateDoc(userRef, {
        lastLocation: {
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading || 0,
          timestamp: new Date().toISOString(),
        },
      });
      // Add trail point to subcollection
      const trailRef = collection(userRef, "trail");
      await addDoc(trailRef, {
        lat: pos.lat,
        lng: pos.lng,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed to save location/trail:", err);
    }
  }, [user]);

  // Debounced trail saving (every 10 seconds)
  const debouncedSaveTrail = useCallback((pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 10000); // 10 seconds
  }, [saveLocationToFirebase]);

  // Update trail state and trigger debounced save
  useEffect(() => {
    if (!position) return;
    // Add to local trail state (for map rendering)
    setTrail((prev) => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      // Keep only last 500 points to avoid memory issues
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    // Debounce save to Firebase
    debouncedSaveTrail(position);
  }, [position, debouncedSaveTrail]);

  // Distance and Speed calculations
  useEffect(() => {
    if (!position) return;
    const today = new Date().toDateString();
    const saved = localStorage.getItem("dailyDistance");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) setTotalDistance(parsed.distance || 0);
      else { setTotalDistance(0); localStorage.removeItem("dailyDistance"); }
    }
    if (position.speed !== undefined) setSpeed(position.speed * 3.6);
    if (prevPositionRef.current) {
      const prev = prevPositionRef.current;
      const dist = haversineDistance(prev.lat, prev.lng, position.lat, position.lng);
      if (dist > 1) {
        setTotalDistance((prevTotal) => {
          const newTotal = prevTotal + dist;
          localStorage.setItem("dailyDistance", JSON.stringify({ date: today, distance: newTotal }));
          return newTotal;
        });
      }
    }
    prevPositionRef.current = { lat: position.lat, lng: position.lng };
  }, [position]);

  const handleClearHistory = () => {
    if (window.confirm("Reset today's distance counter and clear saved location?")) {
      setTotalDistance(0);
      localStorage.removeItem("dailyDistance");
      if (user) {
        const userRef = doc(db, "devices", user.deviceUID);
        updateDoc(userRef, { lastLocation: null }).catch(console.warn);
        // Optionally clear trail subcollection? We'll skip for now to keep data.
      }
    }
  };

  const distanceKm = (totalDistance / 1000).toFixed(2);
  const distanceM = totalDistance.toFixed(0);

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">📏 Distance Today</span>
          <span className="stat-value">{totalDistance > 1000 ? `${distanceKm} km` : `${distanceM} m`}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">🏃 Speed</span>
          <span className="stat-value">{speed.toFixed(1)} km/h</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">🎯 Accuracy</span>
          <span className="stat-value">{position?.accuracy?.toFixed(0) || "..."} m</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">🧭 Heading</span>
          <span className="stat-value">{position?.heading?.toFixed(0) || "0"}°</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={handleClearHistory} style={{ padding: "8px 20px", background: "#ef4444", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
          🗑️ Clear History
        </button>
        <span style={{ color: "var(--text-secondary)", fontSize: "13px", alignSelf: "center" }}>
          {batterySaver ? "🔋 Battery Saver: ON (updates every 15s)" : "⚡ Live Mode (updates every 3s)"}
        </span>
      </div>

      <div className="map-wrapper">
        <LiveMap position={position} error={error} isDevView={false} trail={showTrail ? trail : []} />
      </div>

      <div className="status-bar">
        {tracking ? <span className="status-active">🟢 Live Tracking Active</span> : <span className="status-inactive">🔴 Tracking Paused</span>}
        <span className="status-update">Last update: {position ? "just now" : "waiting..."}</span>
      </div>
    </div>
  );
};

export default UserDashboard;