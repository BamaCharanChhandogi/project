import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export const ARViewer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showQRCode, setShowQRCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const modelUrl = queryParams.get('modelUrl') || `${window.location.origin}/custom-chair.glb`;

  const launchAR = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid) {
      const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=Custom Chair`;
      window.location.href = sceneViewerUrl;

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
      setShowQRCode(true);
    }
  };

  useEffect(() => {
    launchAR();
  }, []);

  const qrCodeValue = `${window.location.origin}/ar?modelUrl=${encodeURIComponent(modelUrl)}`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {showQRCode ? (
          <>
            <h2 className="text-xl font-bold mb-6 text-gray-800">View Chair in AR</h2>
            <div className="bg-white p-2 border border-gray-200 rounded-lg inline-block mb-4">
              <QRCode value={qrCodeValue} size={200} level="H" includeMargin={true} />
            </div>
            <p className="mb-6 text-sm text-gray-600">
              Scan this QR code with your mobile device or{' '}
              <a href={qrCodeValue} className="text-blue-500 underline font-medium">
                open directly
              </a>{' '}
              on your AR-capable device
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                Return to Editor
              </button>
              <button
                onClick={() => window.open(modelUrl, '_blank')}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Download Model
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Launching AR</h2>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin" />
              <p className="text-gray-600 text-sm">
                Opening AR viewer on your device...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};