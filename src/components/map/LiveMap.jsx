import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "../../contexts/ThemeContext";
import "leaflet/dist/leaflet.css";

const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 18, { duration: 0.5 });
    }
  }, [map, position]);
  return null;
};

const createArrowIcon = (heading) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="40" height="40">
      <defs>
        <filter id="glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#00d4ff" flood-opacity="0.8"/>
        </filter>
      </defs>
      <polygon points="25,5 10,40 25,30 40,40" fill="#00d4ff" filter="url(#glow)" stroke="#fff" stroke-width="2"/>
      <circle cx="25" cy="25" r="6" fill="#fff" stroke="#00d4ff" stroke-width="2"/>
    </svg>
  `;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return L.divIcon({
    html: `<img src="${url}" style="transform: rotate(${heading || 0}deg); width:40px; height:40px; transition: transform 0.2s ease;" />`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: "custom-marker",
  });
};

const LiveMap = ({ position, error, isDevView = false, trail = [] }) => {
  const { isDarkMode } = useTheme();
  const markerRef = useRef(null);
  const defaultCenter = [6.5244, 3.3792];

  // Trail line color based on theme
  const trailColor = isDarkMode ? "#00d4ff" : "#7b2ffc";

  if (error) {
    return (
      <div style={{ padding: "20px", background: "var(--bg-card)", borderRadius: "12px", color: "#ff6b6b" }}>
        ⚠️ GPS Error: {error}
      </div>
    );
  }

  if (!position) {
    return (
      <div style={{ padding: "20px", background: "var(--bg-card)", borderRadius: "12px", color: "var(--text-secondary)" }}>
        {isDevView ? "⏳ No location data for this user yet." : "🟡 Waiting for GPS signal..."}
      </div>
    );
  }

  const { lat, lng, heading } = position;
  const markerIcon = createArrowIcon(heading || 0);

  return (
    <div style={{ height: "100%", width: "100%", minHeight: "400px" }}>
      <MapContainer
        center={[lat, lng]}
        zoom={18}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {/* 🧭 Trail Polyline */}
        {trail.length > 0 && (
          <Polyline
            positions={trail.map((p) => [p.lat, p.lng])}
            color={trailColor}
            weight={4}
            opacity={0.8}
            dashArray={null}
          />
        )}
        <Marker position={[lat, lng]} icon={markerIcon} ref={markerRef} />
        <FlyToLocation position={position} />
      </MapContainer>
    </div>
  );
};

export default LiveMap;