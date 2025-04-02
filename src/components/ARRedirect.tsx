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
      console.error('Model URL is required');
      setError('Model URL is missing');
      navigate('/');
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    const handleAndroidAR = () => {
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        modelUrl
      )}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
        window.location.origin
      )};end;`;
      window.location.href = intentUrl;
    };

    const handleIOSAR = () => {
      // For local testing, we'll skip iOS AR since USDZ is complex locally
      // You can add USDZ support later for Vercel deployment
      setError('AR is not supported on iOS locally. Please test on Android.');
    };

    if (isAndroid) {
      handleAndroidAR();
    } else if (isIOS) {
      handleIOSAR();
    } else {
      setError('AR is only supported on mobile devices. Scan the QR code from your phone.');
      navigate('/');
    }
  }, [location, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Return to Configurator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="mb-4">Launching AR experience...</p>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
};