import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ARRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    const launchAR = () => {
      if (isAndroid) {
        // Direct Scene Viewer URL (no intent)
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=3D Chair Viewer`;
        
        console.log('Launching AR with URL:', sceneViewerUrl); // Debug log
        window.location.href = sceneViewerUrl;
        
        // Fallback only if needed
        setTimeout(() => {
          if (document.hasFocus()) {
            console.log('Scene viewer failed to launch, trying intent...');
            const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=3D Chair Viewer#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin)};end;`;
            window.location.href = intentUrl;
            
            // Final fallback
            setTimeout(() => {
              if (document.hasFocus()) {
                setError('Failed to launch AR. Ensure Google Scene Viewer is installed.');
              }
            }, 2000);
          }
        }, 2000);
      } else if (isIOS) {
        setError('iOS AR requires a USDZ file, not supported with local GLTF. Test on Android.');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError('AR is only supported on mobile devices.');
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