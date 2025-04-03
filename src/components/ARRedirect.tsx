import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ARRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract model URL from query parameters
    const params = new URLSearchParams(location.search);
    const modelUrl = params.get('modelUrl');
    console.log('Model URL:', modelUrl); // Debug log
    
    if (!modelUrl) {
      setError('Model URL is missing');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid) {
      // Use the Intent URL approach directly - more reliable than plain URL
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=3D Chair Viewer#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin + '/ar-fallback')};end;`;
      
      console.log('Launching AR with Intent URL:', intentUrl);
      window.location.href = intentUrl;
      
      // Only set a single fallback timer
      const fallbackTimer = setTimeout(() => {
        // Check if we're still on the same page (AR didn't launch)
        if (document.hasFocus()) {
          console.log('AR failed to launch');
          setError('Failed to launch AR. Ensure Google Scene Viewer is installed.');
          // Don't auto-navigate away - let user choose
        }
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    } else if (isIOS) {
      setError('iOS AR requires a USDZ file, not supported with local GLTF. Please test on Android.');
      // Don't auto-navigate away
    } else {
      setError('AR is only supported on mobile devices.');
      // Don't auto-navigate away
    }
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