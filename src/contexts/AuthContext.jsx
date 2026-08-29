// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { generateFingerprint } from "../utils/fingerprint";
import { notifyDeviceUID } from "../utils/nativeBridge";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  // Auto-login
  const autoLogin = useCallback(async () => {
    const savedUID = localStorage.getItem("deviceUID");
    if (!savedUID) {
      setIsLoading(false);
      return;
    }

    try {
      const docRef = doc(db, "devices", savedUID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({ 
          deviceUID: savedUID, 
          uniqueName: data.uniqueName, 
          pin: data.pin 
        });
        setTracking(true);
        // Notify native app
        notifyDeviceUID(savedUID);
      } else {
        localStorage.removeItem("deviceUID");
      }
    } catch (err) {
      console.error("Auto-login error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  const registerUser = async (uniqueName, pin) => {
    const fingerprint = await generateFingerprint();
    const newDeviceRef = doc(collection(db, "devices"));
    const deviceUID = newDeviceRef.id;
    await setDoc(newDeviceRef, {
      uniqueName,
      pin,
      fingerprint,
      createdAt: new Date().toISOString(),
      lastLocation: null,
    });
    localStorage.setItem("deviceUID", deviceUID);
    setUser({ deviceUID, uniqueName, pin });
    setTracking(true);
    // 👇 Notify native app
    notifyDeviceUID(deviceUID);
    return deviceUID;
  };

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
    // 👇 Notify native app
    notifyDeviceUID(deviceUID);
    return deviceUID;
  };

  const logoutUser = () => {
    localStorage.removeItem("deviceUID");
    setUser(null);
    setTracking(false);
    notifyDeviceUID(null);
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
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      tracking, 
      setTracking, 
      registerUser, 
      loginUser, 
      logoutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
