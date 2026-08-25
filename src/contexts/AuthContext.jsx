import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { generateFingerprint } from "../utils/fingerprint";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  // 自动登录 - 修复版：添加错误边界和重试逻辑
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
      } else {
        // UID 无效，清除存储
        localStorage.removeItem("deviceUID");
      }
    } catch (err) {
      console.error("Auto-login error:", err);
      // 网络错误时不清除 UID，等待下次重试
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
    return deviceUID;
  };

  const logoutUser = () => {
    localStorage.removeItem("deviceUID");
    setUser(null);
    setTracking(false);
  };

  // 网络恢复时自动重新连接
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setTracking(true);
        // 强制刷新位置
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