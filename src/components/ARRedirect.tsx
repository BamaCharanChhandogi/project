import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {QRCodeSVG as QRCode} from 'qrcode.react';
export const ARViewer: React.FC = () => {
  const navigate = useNavigate();
  const [showQRCode, setShowQRCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Assuming your model is in public/models folder
  const modelUrl = `${window.location.origin}/custom-chair.glb`;

  const launchAR = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid) {
      const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=Simple Model`;
      window.location.href = sceneViewerUrl;

      // Fallback if AR doesn't launch
      setTimeout(() => {
        if (document.hasFocus()) {
          setError('Failed to launch AR. Please ensure Google Scene Viewer is installed.');
          setShowQRCode(true);
        }
      }, 2000);
    } else if (isIOS) {
      setError('iOS requires USDZ format. Using QR code fallback.');
      setShowQRCode(true);
    } else {
      setShowQRCode(true); // Show QR for desktop users
    }
  };

  useEffect(() => {
    launchAR();
  }, []);

  const qrCodeValue = `${window.location.origin}/ar?modelUrl=${encodeURIComponent(modelUrl)}`;

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        {showQRCode ? (
          <>
            <h3 className="text-lg font-bold mb-4">Scan to View in AR</h3>
            <QRCode value={qrCodeValue} size={200} level="H" includeMargin={true} />
            <p className="mt-4 text-sm text-gray-600">
              Scan this QR code or{' '}
              <a href={qrCodeValue} className="text-blue-500 underline">
                click here
              </a>
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Back
            </button>
          </>
        ) : (
          <>
            <p className="mb-4">Launching AR experience...</p>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  );
};