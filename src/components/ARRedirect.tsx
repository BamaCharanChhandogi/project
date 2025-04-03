import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ARRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

// ARRedirect.tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const modelUrl = params.get('modelUrl');
  if (modelUrl) {
    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=Chair%20Model#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin + '/ar-fallback')};end;`;
    console.log('Intent URL:', intentUrl); // Debug log
    window.location.href = intentUrl;

    // Fallback if AR doesn't launch
    setTimeout(() => {
      if (document.hasFocus()) {
        setError('Failed to launch AR. Ensure Google Scene Viewer is installed.');
      }
    }, 3000);
  } else {
    setError('No model URL provided');
  }
}, [location]);

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