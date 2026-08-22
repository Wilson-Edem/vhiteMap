import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { doc, updateDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useFetchUsers } from "../../hooks/useFetchUsers";
import LiveMap from "../map/LiveMap";
import "../../styles/dev-dashboard.css";

const DevDashboard = () => {
  const { users, loading, error } = useFetchUsers();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userTrail, setUserTrail] = useState([]);

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
        setUserTrail(points.reverse()); // Reverse to show chronological order
      } catch (err) {
        console.warn("Failed to fetch trail:", err);
        setUserTrail([]);
      }
    };
    fetchTrail();
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.uniqueName);
    setEditPin(user.pin);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    if (editName.trim().length < 2) { alert("Name must be at least 2 characters."); return; }
    if (!/^\d{4}$/.test(editPin)) { alert("PIN must be exactly 4 digits."); return; }
    setActionLoading(true);
    try {
      const userRef = doc(db, "devices", editingUser.deviceUID);
      await updateDoc(userRef, { uniqueName: editName.trim(), pin: editPin });
      alert("✅ User updated!");
      setIsEditModalOpen(false);
      if (selectedUser && selectedUser.deviceUID === editingUser.deviceUID) {
        setSelectedUser({ ...selectedUser, uniqueName: editName.trim(), pin: editPin });
      }
    } catch (err) { alert("❌ Failed to update user."); }
    finally { setActionLoading(false); }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ Delete "${user.uniqueName}"?`)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "devices", user.deviceUID));
      alert("✅ Deleted!");
      if (selectedUser?.deviceUID === user.deviceUID) setSelectedUser(null);
    } catch (err) { alert("❌ Failed to delete."); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="dev-loading">Loading users...</div>;
  if (error) return <div className="dev-error">❌ {error}</div>;

  return (
    <div className="dev-dashboard">
      <div className="dev-sidebar">
        <h3 className="dev-sidebar-title">👥 All Users ({users.length})</h3>
        {users.length === 0 ? <p className="dev-empty">No users registered.</p> : (
          <ul className="dev-user-list">
            {users.map((user) => (
              <li key={user.deviceUID} className={`dev-user-item ${selectedUser?.deviceUID === user.deviceUID ? "active" : ""}`} onClick={() => handleSelectUser(user)}>
                <span className="dev-user-name">{user.uniqueName}</span>
                <span className="dev-user-status">{user.lastLocation ? "🟢" : "⚪"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dev-main">
        {selectedUser ? (
          <>
            <div className="dev-user-header">
              <h2>📍 {selectedUser.uniqueName}</h2>
              <div className="dev-actions">
                <button className="dev-btn edit" onClick={() => openEditModal(selectedUser)}>✏️ Edit</button>
                <button className="dev-btn delete" onClick={() => handleDeleteUser(selectedUser)}>🗑️ Delete</button>
              </div>
            </div>
            <div className="dev-user-info">
              <span>🆔 {selectedUser.deviceUID}</span>
              <span>📅 Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              {selectedUser.lastLocation && <span>🕒 Last seen: {new Date(selectedUser.lastLocation.timestamp).toLocaleString()}</span>}
            </div>
            <div className="dev-map-wrapper">
              {selectedUser.lastLocation ? (
                <LiveMap position={selectedUser.lastLocation} error={null} isDevView={true} trail={userTrail} />
              ) : (
                <div className="dev-no-location">⚪ No location data yet.</div>
              )}
            </div>
          </>
        ) : (
          <div className="dev-select-prompt"><p>👈 Select a user to view their location and trail.</p></div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="edit-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit User: {editingUser?.uniqueName}</h3>
            <div className="edit-form">
              <label>Unique Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <label>4-Digit PIN</label>
              <input type="password" maxLength="4" inputMode="numeric" value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ""))} />
              <div className="edit-modal-actions">
                <button className="dev-btn cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button className="dev-btn save" onClick={handleEditSave} disabled={actionLoading}>{actionLoading ? "Saving..." : "💾 Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevDashboard;