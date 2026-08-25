import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 地图模式配置
const MAP_TILES = {
  standard: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CartoDB</a>'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  }
};

// 地图飞行动画组件
const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 18, { duration: 0.8 });
    }
  }, [map, position]);
  return null;
};

// 创建带方向指示的箭头图标
const createArrowIcon = (heading) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="44" height="44">
      <defs>
        <filter id="glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00d4ff" flood-opacity="0.9"/>
        </filter>
      </defs>
      <polygon points="25,4 8,42 25,30 42,42" fill="#00d4ff" filter="url(#glow)" stroke="#fff" stroke-width="2.5"/>
      <circle cx="25" cy="25" r="7" fill="#fff" stroke="#00d4ff" stroke-width="2.5"/>
    </svg>
  `;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return L.divIcon({
    html: `<img src="${url}" style="transform: rotate(${heading || 0}deg); width:44px; height:44px; transition: transform 0.3s ease;" />`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    className: "custom-marker",
  });
};

const LiveMap = ({ 
  position, 
  error, 
  isDevView = false, 
  trail = [],
  mapMode = 'standard' // 'standard' | 'satellite'
}) => {
  const defaultCenter = [6.5244, 3.3792];
  const [map, setMap] = useState(null);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-dark/80 text-red-400 p-8 text-center">
        <div>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-lg font-medium">GPS Error</p>
          <p className="text-sm text-white/60 mt-1">{error}</p>
          <p className="text-xs text-white/40 mt-4">Please allow location access and try again</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center h-full bg-dark/80 text-white/60 p-8 text-center">
        <div>
          <div className="text-4xl mb-3 animate-pulse">📡</div>
          <p className="text-lg font-medium">Acquiring GPS Signal...</p>
          <p className="text-sm text-white/40 mt-1">
            {isDevView ? "Waiting for user location data" : "Make sure location permissions are enabled"}
          </p>
        </div>
      </div>
    );
  }

  const { lat, lng, heading } = position;
  const markerIcon = createArrowIcon(heading || 0);
  const tileConfig = MAP_TILES[mapMode] || MAP_TILES.standard;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={18}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={true}
      whenCreated={setMap}
    >
      <TileLayer
        url={tileConfig.url}
        attribution={tileConfig.attribution}
      />
      
      {/* 轨迹线 */}
      {trail.length > 1 && (
        <Polyline
          positions={trail.map(p => [p.lat, p.lng])}
          color={mapMode === 'satellite' ? '#ffd700' : '#00d4ff'}
          weight={4}
          opacity={0.9}
          dashArray={null}
          smoothFactor={1}
        />
      )}
      
      {/* 当前位置标记 */}
      <Marker position={[lat, lng]} icon={markerIcon} />
      <FlyToLocation position={position} />
    </MapContainer>
  );
};

export default LiveMap;