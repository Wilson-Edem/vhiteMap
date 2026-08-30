import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { haversineDistance } from "../../utils/haversine";
import LiveMap from "../map/LiveMap";
import { db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

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
  
  // Web GPS (for standalone browser mode)
  const { position: webPosition, error: webError } = useGeolocation(tracking, batterySaver);
  
  const prevPositionRef = useRef(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [trail, setTrail] = useState([]);
  const [mapMode, setMapMode] = useState('standard');
  
  // 👇 NEW: Firebase location state (for native app / WebView mode)
  const [firebaseLocation, setFirebaseLocation] = useState(null);
  const [firebaseError, setFirebaseError] = useState(null);

  // Check if running inside native app
  const isNativeApp = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

  // 👇 NEW: Listen to Firebase for location updates (for WebView / Native App mode)
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "devices", user.deviceUID);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastLocation) {
          const loc = data.lastLocation;
          console.log(`📍 Firebase location update: ${loc.lat}, ${loc.lng}`);
          setFirebaseLocation({
            lat: loc.lat,
            lng: loc.lng,
            heading: loc.heading || 0,
            accuracy: 0, // Accuracy from Firebase is not available
          });
          setFirebaseError(null);
        }
      }
    }, (err) => {
      console.warn("Firebase location listener error:", err);
      setFirebaseError(err.message);
    });

    return () => unsubscribe();
  }, [user]);

  // 👇 DECIDE which location source to use
  // If running in native app (WebView), use Firebase location
  // If running in standalone browser, use web GPS
  const position = isNativeApp ? firebaseLocation : webPosition;
  const error = isNativeApp ? firebaseError : webError;

  // 👇 Distance and speed calculations (runs when position changes)
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

  // 👇 Trail state (for display)
  // Note: Trail is still stored in Firebase, but we read it separately in the map component
  // For now, we'll keep the trail state for display purposes
  useEffect(() => {
    if (!position) return;
    setTrail(prev => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
  }, [position]);

  const handleClearHistory = () => {
    if (window.confirm("Reset today's distance counter and clear saved location?")) {
      setTotalDistance(0);
      localStorage.removeItem("dailyDistance");
      // We don't clear Firebase data from web to avoid conflicts with native app
    }
  };

  const distanceKm = (totalDistance / 1000).toFixed(2);
  const distanceM = totalDistance.toFixed(0);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark">
      <div className="absolute inset-0 z-0">
        <LiveMap 
          position={position} 
          error={error} 
          isDevView={false} 
          trail={showTrail ? trail : []}
          mapMode={mapMode}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="glass rounded-2xl p-3 md:p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg md:text-xl tracking-tight">Vhitemaps</span>
              <span className="text-white/40 text-xs hidden sm:inline">{user?.uniqueName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">
                {tracking ? '🟢 Live' : '🔴 Paused'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <StatCard icon="📏" label="Distance" value={totalDistance > 1000 ? distanceKm : distanceM} subValue={totalDistance > 1000 ? 'km' : 'm'} />
            <StatCard icon="🏃" label="Speed" value={speed.toFixed(1)} subValue="km/h" />
            <StatCard icon="🎯" label="Accuracy" value={position?.accuracy?.toFixed(0) || '...'} subValue="m" />
            <StatCard icon="🧭" label="Heading" value={position?.heading?.toFixed(0) || '0'} subValue="°" />
          </div>

          <div className="glass rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setMapMode(m => m === 'standard' ? 'satellite' : 'standard')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${mapMode === 'satellite' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                {mapMode === 'satellite' ? '🛰️ Satellite' : '🗺️ Map'}
              </button>
              <button onClick={toggleShowTrail} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${showTrail ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                {showTrail ? '📍 Trail ON' : '📍 Trail OFF'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] md:text-xs">{batterySaver ? '🔋 Saver' : '⚡ Live'}</span>
              <button onClick={handleClearHistory} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">🗑️ Clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
