// src/utils/nativeBridge.js

/**
 * Check if the app is running inside a React Native WebView
 */
export const isRunningInNativeApp = () => {
  return typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';
};

/**
 * Send a message to the native app (React Native WebView)
 * @param {string} type - Message type
 * @param {object} data - Additional data
 */
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
