import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export const useFetchUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "devices"),
      (snapshot) => {
        const userList = [];
        const now = Date.now();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const lastLocation = data.lastLocation || null;
          
          let isOnline = false;
          let lastSeenText = "Never";
          if (lastLocation && lastLocation.timestamp) {
            const lastTime = new Date(lastLocation.timestamp).getTime();
            const diffSeconds = (now - lastTime) / 1000;
            isOnline = diffSeconds < 30;
            
            if (diffSeconds < 60) {
              lastSeenText = "Just now";
            } else if (diffSeconds < 3600) {
              const mins = Math.floor(diffSeconds / 60);
              lastSeenText = `${mins}m ago`;
            } else if (diffSeconds < 86400) {
              const hrs = Math.floor(diffSeconds / 3600);
              lastSeenText = `${hrs}h ago`;
            } else {
              const days = Math.floor(diffSeconds / 86400);
              lastSeenText = `${days}d ago`;
            }
          }

          userList.push({
            deviceUID: doc.id,
            uniqueName: data.uniqueName,
            pin: data.pin,
            fingerprint: data.fingerprint || "N/A",
            createdAt: data.createdAt || "Unknown",
            lastLocation: lastLocation,
            isOnline: isOnline,
            lastSeenText: lastSeenText,
          });
        });
        setUsers(userList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { users, loading, error };
};
