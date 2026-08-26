import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { haversineDistance } from "../../utils/haversine";
import LiveMap from "../map/LiveMap";
import { db } from "../../firebase/config";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

const StatCard = ({ icon, label, value, subValue }) => (
  <div className="glass rounded-xl p-3 flex-1 min-w-[70px] text-center">
    <div className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-0.5">{label}</div>
    <div className="text-white text-lg md:text-xl font-bold tracking-tight">
      {value}
      {subValue && <span className="text-white/40 text-xs font-normal ml-0.5">{subValue}</span>}
    </div>
    <div className="text-white/20 text-[10px] mt-0.5">{icon}</div>
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

  const saveLocationToFirebase = async (pos) => {
    if (!user) return;
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
  };

  const debouncedSaveTrail = (pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 15000);
  };

  useEffect(() => {
    if (!position) return;
    setTrail(prev => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    debouncedSaveTrail(position);
  }, [position]);

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

      {/* Top bar - minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none">
        <div className="glass rounded-xl px-4 py-2 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">🌍 Vhitemaps</span>
            <span className="text-white/30 text-xs hidden sm:inline">{user?.uniqueName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs">{tracking ? '🟢 Live' : '🔴 Paused'}</span>
          </div>
        </div>
      </div>

      {/* Bottom controls - compact and fluid */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {/* Stats row - compact */}
          <div className="flex gap-2">
            <StatCard icon="📏" label="Distance" value={totalDistance > 1000 ? distanceKm : distanceM} subValue={totalDistance > 1000 ? 'km' : 'm'} />
            <StatCard icon="🏃" label="Speed" value={speed.toFixed(1)} subValue="km/h" />
            <StatCard icon="🎯" label="Acc." value={position?.accuracy?.toFixed(0) || '...'} subValue="m" />
            <StatCard icon="🧭" label="Heading" value={position?.heading?.toFixed(0) || '0'} subValue="°" />
          </div>

          {/* Controls - compact */}
          <div className="glass rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setMapMode(m => m === 'standard' ? 'satellite' : 'standard')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mapMode === 'satellite' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {mapMode === 'satellite' ? '🛰️' : '🗺️'}
              </button>
              <button 
                onClick={toggleShowTrail} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showTrail 
                    ? 'bg-emerald-500/30 text-emerald-400' 
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {showTrail ? '📍 ON' : '📍 OFF'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px]">{batterySaver ? '🔋' : '⚡'}</span>
              <button 
                onClick={handleClearHistory} 
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
