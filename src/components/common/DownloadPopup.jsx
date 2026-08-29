import React, { useState, useEffect } from "react";
import { isRunningInNativeApp } from "../../utils/nativeBridge";

const DownloadPopup = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show the download button on mobile web (not inside the native app)
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isRunningInNativeApp() && isMobile) {
      setShouldShow(true);
    }
  }, []);

  // If not on mobile web, don't render anything
  if (!shouldShow) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2"
        aria-label="Download App"
      >
        <span className="text-xl">📱</span>
        <span className="hidden sm:inline font-semibold text-sm">Get App</span>
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Get the Vhitemap App
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
                Download the Android app for <strong>background location tracking</strong>, better battery efficiency, and real-time updates.
              </p>

              <div className="mt-6 space-y-3">
                {/* Download Button */}
                <a
                  href="https://expo.dev/artifacts/eas/62qTkH6XePjQ5DWDMGuvWq52rsA_9fD41x30_WuX-u4.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-purple-600 text-white py-3.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>📥</span> Download APK
                </a>

                {/* Close / Maybe Later */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="block w-full text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadPopup;
