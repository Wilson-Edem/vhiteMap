import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminProvider } from "./contexts/AdminContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import "leaflet/dist/leaflet.css";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <AdminProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AdminProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
);
