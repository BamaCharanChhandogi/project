import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export const ARRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [arLink, setArLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modelId = params.get('modelId');

    if (!modelId) {
      console.error('Model ID is required');
      setError('Model ID is required');
      return;
    }

    const glbModelUrl = '/Lion High.glb';
    const usdzModelUrl = `/lion high.usdz`; // Ensure you have a USDZ version

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    const handleAndroidAR = () => {
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        glbModelUrl
      )}&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
        `${window.location.origin}/ar-viewer?modelId=${modelId}`
      )};end;`;
      window.location.href = intentUrl;
    };

    const handleIOSAR = () => {
      fetch(usdzModelUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(
            new Blob([blob], { type: 'model/vnd.usdz+zip' })
          );
          const iosArUrl = `${blobUrl}#allowsContentScaling=1&ar`;
          setArLink(iosArUrl);
          window.location.href = iosArUrl;
        })
        .catch(err => {
          console.error('Failed to fetch USDZ file:', err);
          setError('Failed to load AR model for iOS');
        });
    };

    if (isAndroid) {
      handleAndroidAR();
    } else if (isIOS) {
      handleIOSAR();
    } else {
      // Desktop fallback - show QR code
      setShowQRCode(true);
    }
  }, [location, navigate]);

  const qrCodeValue = `${window.location.origin}${location.pathname}${location.search}`;

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

  if (showQRCode) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-lg font-bold mb-4">Scan to View in AR</h3>
          <QRCode value={qrCodeValue} size={200} level="H" includeMargin={true} />
          <p className="mt-4 text-sm text-gray-600">
            Scan this QR code with your mobile device to view in AR
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
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
        {arLink && (
          <a
            href={arLink}
            rel="ar"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-block"
          >
            Click here if AR doesn't start
          </a>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Return to Configurator
        </button>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
};