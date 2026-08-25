import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { haversineDistance } from "../../utils/haversine";
import LiveMap from "../map/LiveMap";
import { db } from "../../firebase/config";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

// 统计卡片组件
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
  const [mapMode, setMapMode] = useState('standard'); // 'standard' | 'satellite'
  const saveTrailTimeoutRef = useRef(null);

  // 保存位置到 Firestore
  const saveLocationToFirebase = useCallback(async (pos) => {
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
  }, [user]);

  // 防抖保存轨迹 (每10秒)
  const debouncedSaveTrail = useCallback((pos) => {
    if (saveTrailTimeoutRef.current) clearTimeout(saveTrailTimeoutRef.current);
    saveTrailTimeoutRef.current = setTimeout(() => {
      saveLocationToFirebase(pos);
    }, 10000);
  }, [saveLocationToFirebase]);

  // 更新轨迹状态
  useEffect(() => {
    if (!position) return;
    setTrail(prev => {
      const newTrail = [...prev, { lat: position.lat, lng: position.lng }];
      if (newTrail.length > 500) return newTrail.slice(-500);
      return newTrail;
    });
    debouncedSaveTrail(position);
  }, [position, debouncedSaveTrail]);

  // 距离和速度计算
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
      {/* 地图 - 全屏背景 */}
      <div className="absolute inset-0 z-0">
        <LiveMap 
          position={position} 
          error={error} 
          isDevView={false} 
          trail={showTrail ? trail : []}
          mapMode={mapMode}
        />
      </div>

      {/* 顶部状态栏 - 毛玻璃效果 */}
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

      {/* 统计卡片 - 底部浮动面板 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {/* 统计卡片行 */}
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

          {/* 控制按钮行 */}
          <div className="glass rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* 地图模式切换 */}
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
              
              {/* 轨迹切换 */}
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