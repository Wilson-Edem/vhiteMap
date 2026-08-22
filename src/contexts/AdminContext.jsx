import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { hashPassword } from "../utils/hash";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);

  const verifyDevPassword = async (inputPassword) => {
    setIsDevLoading(true);
    try {
      const docRef = doc(db, "config", "devCredentials");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error("Dev credentials not found in Firestore!");
        setIsDevLoading(false);
        return false;
      }

      const storedHash = docSnap.data().masterHash;
      const inputHash = await hashPassword(inputPassword);

      if (inputHash === storedHash) {
        setIsDevMode(true);
        localStorage.setItem("devMode", "true");
        setIsDevLoading(false);
        return true;
      } else {
        setIsDevMode(false);
        localStorage.removeItem("devMode");
        setIsDevLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Dev verification error:", error);
      setIsDevLoading(false);
      return false;
    }
  };

  const logoutDev = () => {
    setIsDevMode(false);
    localStorage.removeItem("devMode");
  };

  // Restore Dev mode from localStorage on app load
  useEffect(() => {
    const saved = localStorage.getItem("devMode");
    if (saved === "true") {
      setIsDevMode(true);
    }
  }, []);

  return (
    <AdminContext.Provider value={{ isDevMode, isDevLoading, verifyDevPassword, logoutDev }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);