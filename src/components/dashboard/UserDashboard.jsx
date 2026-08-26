import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { doc, updateDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useFetchUsers } from "../../hooks/useFetchUsers";
import LiveMap from "../map/LiveMap";

const DevDashboard = () => {
  const { users, loading, error } = useFetchUsers();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userTrail, setUserTrail] = useState([]);
  const [mapMode, setMapMode] = useState('standard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch trail for selected user
  useEffect(() => {
    if (!selectedUser) {
      setUserTrail([]);
      return;
    }
    const fetchTrail = async () => {
      try {
        const trailRef = collection(db, "devices", selectedUser.deviceUID, "trail");
        const q = query(trailRef, orderBy("timestamp", "desc"), limit(200));
        const snapshot = await getDocs(q);
        const points = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          points.push({ lat: data.lat, lng: data.lng });
        });
        setUserTrail(points.reverse());
      } catch (err) {
        console.warn("Failed to fetch trail:", err);
        setUserTrail([]);
      }
    };
    fetchTrail();
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.uniqueName);
    setEditPin(user.pin);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    if (editName.trim().length < 2) {
      alert("Name must be at least 2 characters.");
      return;
    }
    if (!/^\d{4}$/.test(editPin)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    setActionLoading(true);
    try {
      const userRef = doc(db, "devices", editingUser.deviceUID);
      await updateDoc(userRef, { uniqueName: editName.trim(), pin: editPin });
      alert("✅ User updated!");
      setIsEditModalOpen(false);
      if (selectedUser && selectedUser.deviceUID === editingUser.deviceUID) {
        setSelectedUser({ ...selectedUser, uniqueName: editName.trim(), pin: editPin });
      }
    } catch (err) {
      alert("❌ Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ Delete "${user.uniqueName}"?`)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "devices", user.deviceUID));
      alert("✅ Deleted!");
      if (selectedUser?.deviceUID === user.deviceUID) setSelectedUser(null);
    } catch (err) {
      alert("❌ Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark text-white/60">
        <div className="text-center">
          <div className="text-2xl mb-3 animate-pulse">👥</div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark text-red-400">
        <div className="text-center">
          <div className="text-2xl mb-3">❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-dark">
      {/* Map background */}
      <div className="absolute inset-0 z-0">
        {selectedUser?.lastLocation ? (
          <LiveMap
            position={selectedUser.lastLocation}
            error={null}
            isDevView={true}
            trail={userTrail}
            mapMode={mapMode}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-dark/90 text-white/40">
            <div className="text-center">
              <div className="text-5xl mb-4">👈</div>
              <p className="text-lg">Select a user from the sidebar</p>
              <p className="text-sm text-white/20 mt-1">to view their location and trail</p>
            </div>
          </div>
        )}
      </div>

      {/* Hamburger menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl glass text-white text-xl hover:bg-white/10 transition-all"
        aria-label="Toggle user list"
      >
        ☰
      </button>

      {/* Sidebar drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-72 z-20 
          glass rounded-r-2xl 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:rounded-none
          flex flex-col
        `}
        style={{
          background: 'rgba(20, 20, 30, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="p-4 border-b border-white/5 flex-shrink-0 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <span>👥</span> Users <span className="text-white/40 text-xs font-normal">({users.length})</span>
          </h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-white/40 hover:text-white/80 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {users.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No users registered</p>
          ) : (
            users.map((user) => (
              <button
                key={user.deviceUID}
                onClick={() => handleSelectUser(user)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm 
                  flex items-center justify-between
                  ${selectedUser?.deviceUID === user.deviceUID 
                    ? 'bg-white/15 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium truncate">{user.uniqueName}</span>
                  <span className="text-[10px] text-white/30 truncate">
                    {user.isOnline ? '🟢 Online' : `⚪ ${user.lastSeenText}`}
                  </span>
                </div>
                <span className="text-xs flex-shrink-0 ml-2">
                  {user.isOnline ? '🟢' : '⚪'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom control bar */}
      {selectedUser && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="glass rounded-2xl p-3 md:p-4 pointer-events-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-sm md:text-base">
                {selectedUser.uniqueName}
              </span>
              <span className="text-white/40 text-xs">
                {selectedUser.isOnline ? '🟢 Online' : `⚪ ${selectedUser.lastSeenText}`}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setMapMode(m => m === 'standard' ? 'satellite' : 'standard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  mapMode === 'satellite'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {mapMode === 'satellite' ? '🛰️ Satellite' : '🗺️ Map'}
              </button>
              <button
                onClick={() => openEditModal(selectedUser)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="glass rounded-2xl p-6 md:p-8 max-w-md w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-xl font-bold mb-4">✏️ Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm block mb-1.5">Unique Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">4-Digit PIN</label>
                <input
                  type="password"
                  maxLength="4"
                  inputMode="numeric"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                  placeholder="1234"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "💾 Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevDashboard;
