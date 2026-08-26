import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { haversineDistance } from "../../utils/haversine";
import LiveMap from "../map/LiveMap";
import { db } from "../../firebase/config";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

// Stat card component
const StatCard = ({ icon, label, value, subValue }) => (
  <div className="glass rounded-2xl p-4 md:p-5 flex-1 min-w-[80px]">
    <div className="flex items-center gap-2 text-white/50 text-xs md:text-sm font-medium mb-1">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <div className="text-white text-xl md:text-2xl font-bold tracking-tight">
      {value}
      {subValue && <span className="text-white/40 text-sm font-normal ml-1">{subValue}</span>}
    </div>
  </div>
);

const UserDashboard = () => {
  const { user, tracking } = useAuth();
  const { batterySaver, showTrail, toggleShowTrail } = useSettings();
  const { position, error } = useGeolocation(tracking, batterySaver);
  const prevPositionRef = useRef(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [trail, setTrail] = useState([]);
  const [mapMode, setMapMode] = useState('standard');
  const saveTrailTimeoutRef = useRef(null);

  // --- Save location to Firebase (with logging) ---
  const saveLocationToFirebase = useCallback(async (pos) => {
    if (!user) {
      console.warn("No user, skipping save.");
      return;
    }
    try {
      const userRef = doc(db, "devices", user.deviceUID);
      await updateDoc(userRef, {
        lastLocation: {
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading || 0,
          timestamp: new Date().toISOString(),
        },
      });
      const trailRef = collection(userRef, "trail");
      await addDoc(trailRef, {
        lat: pos.lat,
        lng: pos.lng,
        timestamp: new Date().toISOString(),
      });
      console.log(`✅ Trail point saved: ${pos.lat}, ${pos.lng}`);
    } catch (err) {
      console.error("❌ Failed to save location/trail:", err);
    }
  }, [user]);

  // --- Debounced save (15 seconds) ---
  const debouncedSaveTrail = useCallback((pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 15000);
  }, [saveLocationToFirebase]);

  // --- Update local trail state ---
  useEffect(() => {
    if (!position) return;
    setTrail(prev => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    debouncedSaveTrail(position);
  }, [position, debouncedSaveTrail]);

  // --- Distance and speed calculations ---
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
        setTotalDistance(prevTotal => {
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
      }
    }
  };

  const distanceKm = (totalDistance / 1000).toFixed(2);
  const distanceM = totalDistance.toFixed(0);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark">
      {/* Map - full‑screen background */}
      <div className="absolute inset-0 z-0">
        <LiveMap 
          position={position} 
          error={error} 
          isDevView={false} 
          trail={showTrail ? trail : []}
          mapMode={mapMode}
        />
      </div>

      {/* Top status bar - frosted‑glass effect */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="glass rounded-2xl p-3 md:p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg md:text-xl tracking-tight">
                Vhitemaps
              </span>
              <span className="text-white/40 text-xs hidden sm:inline">
                {user?.uniqueName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">
                {tracking ? '🟢 Live' : '🔴 Paused'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards - bottom floating panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {/* Stats card row */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <StatCard 
              icon="📏" 
              label="Distance" 
              value={totalDistance > 1000 ? distanceKm : distanceM}
              subValue={totalDistance > 1000 ? 'km' : 'm'}
            />
            <StatCard 
              icon="🏃" 
              label="Speed" 
              value={speed.toFixed(1)}
              subValue="km/h"
            />
            <StatCard 
              icon="🎯" 
              label="Accuracy" 
              value={position?.accuracy?.toFixed(0) || '...'}
              subValue="m"
            />
            <StatCard 
              icon="🧭" 
              label="Heading" 
              value={position?.heading?.toFixed(0) || '0'}
              subValue="°"
            />
          </div>

          {/* Control button row */}
          <div className="glass rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Map mode toggle */}
              <button
                onClick={() => setMapMode(m => m === 'standard' ? 'satellite' : 'standard')}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  mapMode === 'satellite' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {mapMode === 'satellite' ? '🛰️ Satellite' : '🗺️ Map'}
              </button>
              
              {/* Trail toggle */}
              <button
                onClick={toggleShowTrail}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  showTrail 
                    ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {showTrail ? '📍 Trail ON' : '📍 Trail OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] md:text-xs">
                {batterySaver ? '🔋 Saver' : '⚡ Live'}
              </span>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;  // ✅ This line is crucial    async (pos) => {
      if (!user) {
        console.warn("No user, skipping save.");
        return;
      }
      try {
        const userRef = doc(db, "devices", user.deviceUID);
        // Update last location
        await updateDoc(userRef, {
          lastLocation: {
            lat: pos.lat,
            lng: pos.lng,
            heading: pos.heading || 0,
            timestamp: new Date().toISOString(),
          },
        });
        // Add trail point
        const trailRef = collection(userRef, "trail");
        await addDoc(trailRef, {
          lat: pos.lat,
          lng: pos.lng,
          timestamp: new Date().toISOString(),
        });
        console.log(`✅ Trail point saved: ${pos.lat}, ${pos.lng}`);
      } catch (err) {
        console.error("❌ Failed to save location/trail:", err);
      }
    },
    [user]
  );

  // --- Debounced save (adjusted to 15 seconds) ---
  const debouncedSaveTrail = useCallback(
    (pos) => {
      if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
      saveTrailTimeoutRef.current = setTimeout(() => {
        saveLocationToFirebase(pos);
      }, 15000); // changed from 10s to 15s
    },
    [saveLocationToFirebase]
  );

  // --- Update trail state ---
  useEffect(() => {
    if (!position) return;
    // Local trail array (max 500 points)
    setTrail((prev) => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    // Trigger debounced save
    debouncedSaveTrail(position);
  }, [position, debouncedSaveTrail]);

  // --- Distance and speed calculation (unchanged) ---
  useEffect(() => {
    if (!position) return;
    const today = new Date().toDateString();
    const saved = localStorage.getItem("dailyDistance");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) setTotalDistance(parsed.distance || 0);
      else {
        setTotalDistance(0);
        localStorage.removeItem("dailyDistance");
      }
    }
    if (position.speed !== undefined) setSpeed(position.speed * 3.6);
    if (prevPositionRef.current) {
      const prev = prevPositionRef.current;
      const dist = haversineDistance(prev.lat, prev.lng, position.lat, position.lng);
      if (dist > 1) {
        setTotalDistance((prevTotal) => {
          const newTotal = prevTotal + dist;
          localStorage.setItem(
            "dailyDistance",
            JSON.stringify({ date: today, distance: newTotal })
          );
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
      }
    }
  };

  const distanceKm = (totalDistance / 1000).toFixed(2);
  const distanceM = totalDistance.toFixed(0);

  // --- UI (unchanged) ---
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark">
      {/* Map - full‑screen background */}
      <div className="absolute inset-0 z-0">
        <LiveMap
          position={position}
          error={error}
          isDevView={false}
          trail={showTrail ? trail : []}
          mapMode={mapMode}
        />
      </div>

      {/* Top status bar - frosted‑glass effect */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="glass rounded-2xl p-3 md:p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg md:text-xl tracking-tight">
                Vhitemaps
              </span>
              <span className="text-white/40 text-xs hidden sm:inline">
                {user?.uniqueName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">
                {tracking ? "🟢 Live" : "🔴 Paused"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards - bottom floating panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {/* Stats card row */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <StatCard
              icon="📏"
              label="Distance"
              value={totalDistance > 1000 ? distanceKm : distanceM}
              subValue={totalDistance > 1000 ? "km" : "m"}
            />
            <StatCard
              icon="🏃"
              label="Speed"
              value={speed.toFixed(1)}
              subValue="km/h"
            />
            <StatCard
              icon="🎯"
              label="Accuracy"
              value={position?.accuracy?.toFixed(0) || "..."}
              subValue="m"
            />
            <StatCard
              icon="🧭"
              label="Heading"
              value={position?.heading?.toFixed(0) || "0"}
              subValue="°"
            />
          </div>

          {/* Control button row */}
          <div className="glass rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Map mode toggle */}
              <button
                onClick={() =>
                  setMapMode((m) => (m === "standard" ? "satellite" : "standard"))
                }
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  mapMode === "satellite"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {mapMode === "satellite" ? "🛰️ Satellite" : "🗺️ Map"}
              </button>

              {/* Trail toggle */}
              <button
                onClick={toggleShowTrail}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  showTrail
                    ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/50 hover:bg-white/20"
                }`}
              >
                {showTrail ? "📍 Trail ON" : "📍 Trail OFF"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] md:text-xs">
                {batterySaver ? "🔋 Saver" : "⚡ Live"}
              </span>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;    if (!user) return;
    try {
      const userRef = doc(db, "devices", user.deviceUID);
      await updateDoc(userRef, {
        lastLocation: {
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading || 0,
          timestamp: new Date().toISOString(),
        },
      });
      const trailRef = collection(userRef, "trail");
      await addDoc(trailRef, {
        lat: pos.lat,
        lng: pos.lng,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed to save location:", err);
    }
  }, [user]);

  // Debounced trail save (every 10 seconds)
  const debouncedSaveTrail = useCallback((pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 10000);
  }, [saveLocationToFirebase]);

  // Update trail state
  useEffect(() => {
    if (!position) return;
    setTrail(prev => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    debouncedSaveTrail(position);
  }, [position, debouncedSaveTrail]);

  // Distance and speed calculations
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
        setTotalDistance(prevTotal => {
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
      }
    }
  };

  const distanceKm = (totalDistance / 1000).toFixed(2);
  const distanceM = totalDistance.toFixed(0);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark">
      {/* Map - full‑screen background */}
      <div className="absolute inset-0 z-0">
        <LiveMap 
          position={position} 
          error={error} 
          isDevView={false} 
          trail={showTrail ? trail : []}
          mapMode={mapMode}
        />
      </div>

      {/* Top status bar - frosted‑glass effect */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="glass rounded-2xl p-3 md:p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg md:text-xl tracking-tight">
                Vhitemaps
              </span>
              <span className="text-white/40 text-xs hidden sm:inline">
                {user?.uniqueName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">
                {tracking ? '🟢 Live' : '🔴 Paused'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards - bottom floating panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {/* Stats card row */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <StatCard 
              icon="📏" 
              label="Distance" 
              value={totalDistance > 1000 ? distanceKm : distanceM}
              subValue={totalDistance > 1000 ? 'km' : 'm'}
            />
            <StatCard 
              icon="🏃" 
              label="Speed" 
              value={speed.toFixed(1)}
              subValue="km/h"
            />
            <StatCard 
              icon="🎯" 
              label="Accuracy" 
              value={position?.accuracy?.toFixed(0) || '...'}
              subValue="m"
            />
            <StatCard 
              icon="🧭" 
              label="Heading" 
              value={position?.heading?.toFixed(0) || '0'}
              subValue="°"
            />
          </div>

          {/* Control button row */}
          <div className="glass rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Map mode toggle */}
              <button
                onClick={() => setMapMode(m => m === 'standard' ? 'satellite' : 'standard')}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  mapMode === 'satellite' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {mapMode === 'satellite' ? '🛰️ Satellite' : '🗺️ Map'}
              </button>
              
              {/* Trail toggle */}
              <button
                onClick={toggleShowTrail}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  showTrail 
                    ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {showTrail ? '📍 Trail ON' : '📍 Trail OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] md:text-xs">
                {batterySaver ? '🔋 Saver' : '⚡ Live'}
              </span>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserDashboard;

