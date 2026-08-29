// src/utils/nativeBridge.js

/**
 * Check if the app is running inside a React Native WebView
 */
export const isRunningInNativeApp = () => {
  return typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';
};

/**
 * Send a message to the native app (React Native WebView)
 * @param {string} type - Message type (e.g., 'SET_DEVICE_UID', 'START_TRACKING')
 * @param {object} data - Additional data to send
 */
export const sendToNative = (type, data = {}) => {
  if (isRunningInNativeApp() && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    console.log(`📤 Sent to Native: ${type}`, data);
  } else {
    console.log(`🌐 Web mode: ${type}`, data);
  }
};

/**
 * Notify the native app to set the device UID (after login)
 */
export const notifyDeviceUID = (deviceUID) => {
  sendToNative('SET_DEVICE_UID', { deviceUID });
};

/**
 * Notify the native app to start background tracking
 */
export const notifyStartTracking = () => {
  sendToNative('START_TRACKING');
};

/**
 * Notify the native app to stop background tracking
 */
export const notifyStopTracking = () => {
  sendToNative('STOP_TRACKING');
};
