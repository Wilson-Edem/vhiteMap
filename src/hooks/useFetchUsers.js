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
        snapshot.forEach((doc) => {
          const data = doc.data();
          userList.push({
            deviceUID: doc.id,
            uniqueName: data.uniqueName,
            pin: data.pin,
            fingerprint: data.fingerprint || "N/A",
            createdAt: data.createdAt || "Unknown",
            lastLocation: data.lastLocation || null, // { lat, lng, heading, timestamp }
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