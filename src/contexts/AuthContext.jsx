// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { generateFingerprint } from "../utils/fingerprint";
import { notifyDeviceUID } from "../utils/nativeBridge";

const AuthContext = createContext();

// VhitePizza referral access
const VHITEPIZZA_USERNAME = "Vhitepizza";
const VHITEPIZZA_PIN = "1477";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  // Create a separate VhiteMaps device record for each
  // customer arriving from VhitePizza.
  const createReferralUser = useCallback(async () => {
    const fingerprint = await generateFingerprint();

    const newDeviceRef = doc(collection(db, "devices"));
    const deviceUID = newDeviceRef.id;

    await setDoc(newDeviceRef, {
      uniqueName: VHITEPIZZA_USERNAME,
      pin: VHITEPIZZA_PIN,
      fingerprint,
      createdAt: new Date().toISOString(),
      lastLocation: null,
      source: "vhitepizza",
    });

    localStorage.setItem("deviceUID", deviceUID);

    setUser({
      deviceUID,
      uniqueName: VHITEPIZZA_USERNAME,
      pin: VHITEPIZZA_PIN,
    });

    setTracking(true);

    // Tell the native Android app which device should be tracked.
    notifyDeviceUID(deviceUID);

    return deviceUID;
  }, []);

  // Auto-login
  const autoLogin = useCallback(async () => {
    const savedUID = localStorage.getItem("deviceUID");

    const params = new URLSearchParams(window.location.search);
    const fromVhitePizza =
      params.get("from")?.toLowerCase() === "vhitepizza";

    try {
      // ---------------------------------------------------------
      // 1. Existing VhiteMaps user
      // ---------------------------------------------------------
      if (savedUID) {
        const docRef = doc(db, "devices", savedUID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setUser({
            deviceUID: savedUID,
            uniqueName: data.uniqueName,
            pin: data.pin,
          });

          setTracking(true);

          // Notify native app.
          notifyDeviceUID(savedUID);

          return;
        }

        // Stored device no longer exists.
        localStorage.removeItem("deviceUID");
      }

      // ---------------------------------------------------------
      // 2. Customer came from VhitePizza
      // ---------------------------------------------------------
      if (fromVhitePizza) {
        await createReferralUser();

        // Remove ?from=vhitepizza from the address bar
        // after the referral has been processed.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch (err) {
      console.error("Auto-login error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [createReferralUser]);

  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  // -----------------------------------------------------------
  // Normal VhiteMaps registration
  // -----------------------------------------------------------
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

    setUser({
      deviceUID,
      uniqueName,
      pin,
    });

    setTracking(true);

    // Notify native app.
    notifyDeviceUID(deviceUID);

    return deviceUID;
  };

  // -----------------------------------------------------------
  // Normal VhiteMaps login
  // -----------------------------------------------------------
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

    setUser({
      deviceUID,
      uniqueName,
      pin,
    });

    setTracking(true);

    // Notify native app.
    notifyDeviceUID(deviceUID);

    return deviceUID;
  };

  // -----------------------------------------------------------
  // Logout
  // -----------------------------------------------------------
  const logoutUser = () => {
    localStorage.removeItem("deviceUID");

    setUser(null);
    setTracking(false);

    notifyDeviceUID(null);
  };

  // -----------------------------------------------------------
  // Restart tracking when internet connection returns
  // -----------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setTracking(true);
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        tracking,
        setTracking,
        registerUser,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
