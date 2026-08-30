// src/utils/nativeBridge.js

export const isRunningInNativeApp = () => {
  return typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';
};

export const sendToNative = (type, data = {}) => {
  if (isRunningInNativeApp() && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    console.log(`📤 Sent to Native: ${type}`, data);
  } else {
    console.log(`🌐 Web mode: ${type}`, data);
  }
};

export const notifyDeviceUID = (deviceUID) => {
  sendToNative('SET_DEVICE_UID', { deviceUID });
};

export const notifyStartTracking = () => {
  sendToNative('START_TRACKING');
};

export const notifyStopTracking = () => {
  sendToNative('STOP_TRACKING');
};
