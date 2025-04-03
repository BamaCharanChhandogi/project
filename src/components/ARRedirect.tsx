// ARRedirect.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ARRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modelUrl = params.get('modelUrl');

    if (!modelUrl) {
      setError('Model URL is missing');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('Received modelUrl:', modelUrl);

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    const launchAR = () => {
      // Updated Android Scene Viewer intent
      const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&resizable=true&title=Chair%20Model`;
      
      // For Android
      if (isAndroid) {
        const intentUrl = `intent://${sceneViewerUrl.replace('https://', '')}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin + '/ar-fallback')};end;`;
        
        console.log('Launching AR with Intent:', intentUrl);
        window.location.href = intentUrl;

        // Check if AR launched successfully
        setTimeout(() => {
          if (document.hasFocus()) {
            setError('Failed to launch AR. Please ensure Google Scene Viewer is installed and try again.');
          }
        }, 2500);
      } 
      // For iOS (Note: Blob URLs won't work natively with iOS AR Quick Look)
      else if (isIOS) {
        // For iOS, we need a USDZ file served from a proper URL, not a Blob
        setError('iOS AR requires a USDZ file. Please test on Android or use a hosted GLB file.');
        setTimeout(() => navigate('/'), 3000);
      } 
      else {
        setError('AR is only supported on mobile devices. Please scan the QR code from your Android device.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    launchAR();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => navigate('/')} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Return to Configurator
            </button>
          </>
        ) : (
          <>
            <p className="mb-4">Launching AR experience...</p>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mt-4" />
          </>
        )}
      </div>
    </div>
  );
};