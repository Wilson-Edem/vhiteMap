# 🌍 Vhitemaps

### Live Location Tracker — Made by vhite

Vhitemaps is a **Progressive Web App (PWA)** that turns your browser into a real-time GPS tracker. It features automatic login, live map tracking with a rotating compass arrow, daily distance tracking, and a powerful **Developer Dashboard** for monitoring all registered users.

![Vhitemaps Demo](https://raw.githubusercontent.com/Wilson-Edem/vhiteMap/main/public/screenshot.png)

---

## ✨ Features

### For Regular Users
- **🔐 Automatic Login** — Stores your device ID in `localStorage`. Just open the app and it resumes tracking instantly.
- **📍 Live GPS Tracking** — Updates every 3 seconds (or 15s in Battery Saver mode). Shows your exact location, speed, heading (compass direction), and GPS accuracy.
- **🧭 Rotating Compass Arrow** — The map marker rotates to show the exact direction you are facing (if your device has a compass).
- **📏 Daily Distance Tracker** — Automatically calculates how many meters or kilometers you've moved today. Resets at midnight.
- **🗺️ Trail / Path History** — Stores your movement trail in Firebase Firestore. You can view your exact path on the map.
- **🌙 Dark / Light Theme Toggle** — Switch themes instantly. Your preference is saved automatically.
- **🔋 Battery Saver Mode** — Reduces GPS accuracy and update frequency (3s → 15s) to save battery life. Auto-suggestion when battery drops below 20%.
- **🔄 Internet Recovery** — Automatically resumes tracking when your internet connection is restored.
- **🗑️ Clear History** — Reset your daily distance counter and clear your saved location with one click.

### For Developers (Admin Panel)
- **🔐 Developer Access** — Secure login using a SHA-256 hashed master password stored in Firestore.
- **👥 View All Users** — See a list of every registered device and their current online status.
- **📍 View Any User's Location** — Click any user to see their live location on the map — **without needing their PIN**.
- **🗺️ View Any User's Trail** — See the full movement history (last 200 points) for any user.
- **✏️ Edit User Info** — Change a user's unique name or 4-digit PIN.
- **🗑️ Delete User Accounts** — Permanently remove a user and all their data from Firestore.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** + **Vite** | Frontend framework & build tool |
| **Firebase Firestore** | Real-time database & authentication (hashed passwords) |
| **Leaflet.js** + **react-leaflet** | Interactive maps with custom rotating markers |
| **Vercel** | Hosting & continuous deployment (HTTPS + PWA ready) |
| **PWA Manifest** | Installable as a native app on Android & iOS |
| **Geolocation API** | Browser-based GPS tracking |

---

## 🚀 Live Demo

**[View the live app →](https://vhitemap.vercel.app)** *(Replace with your actual Vercel URL)*

---

## 📦 Getting Started (Local Development)

Follow these steps to run Vhitemaps on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Firebase project (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wilson-Edem/vhiteMap.git
   cd vhiteMap
