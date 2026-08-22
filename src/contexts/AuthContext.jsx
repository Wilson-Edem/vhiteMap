import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { generateFingerprint } from "../utils/fingerprint";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { deviceUID, uniqueName, pin }
  const [isLoading, setIsLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  // Auto-login on page load
  useEffect(() => {
    const savedUID = localStorage.getItem("deviceUID");
    if (savedUID) {
      const fetchUser = async () => {
        try {
          const docRef = doc(db, "devices", savedUID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({ deviceUID: savedUID, uniqueName: data.uniqueName, pin: data.pin });
            setTracking(true); // Auto-start tracking
          } else {
            localStorage.removeItem("deviceUID");
          }
        } catch (err) {
          console.error("Auto-login error:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Register new user ("Track Me")
  const registerUser = async (uniqueName, pin) => {
    const fingerprint = await generateFingerprint();
    const newDeviceRef = doc(collection(db, "devices"));
    const deviceUID = newDeviceRef.id;
    await setDoc(newDeviceRef, {
      uniqueName,
      pin, // We'll hash this later if needed
      fingerprint,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("deviceUID", deviceUID);
    setUser({ deviceUID, uniqueName, pin });
    setTracking(true);
    return deviceUID;
  };

  // Login existing user ("Check Location")
  const loginUser = async (uniqueName, pin) => {
    const q = query(
      collection(db, "devices"),
      where("uniqueName", "==", uniqueName),
      where("pin", "==", pin)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error("Invalid name or PIN");
    }
    const docSnap = snapshot.docs[0];
    const deviceUID = docSnap.id;
    localStorage.setItem("deviceUID", deviceUID);
    setUser({ deviceUID, uniqueName, pin });
    setTracking(true);
    return deviceUID;
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem("deviceUID");
    setUser(null);
    setTracking(false);
  };

  // Auto-restart tracking when internet reconnects
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setTracking(true);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, tracking, setTracking, registerUser, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);