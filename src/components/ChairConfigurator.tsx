import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { AiOutlineQrcode, AiOutlineCamera, AiOutlineReload } from 'react-icons/ai';
import { FaRuler } from 'react-icons/fa';
import { Chair } from './Chair';
import { ConfigPanel } from './ConfigPanel';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export interface ChairConfig {
  backStyle: 'standard' | 'welted';
  fabricColor: string;
  backFinish: string;
  parts: string[];
  fabricTexture: 'champlain' | 'huron' | 'kaleidoscope' | 'lugano' | 'traveller';
  backFinishTexture: 'antique' | 'brushed' | 'satin';
}

export const ChairConfigurator: React.FC = () => {
  const defaultConfig: ChairConfig = {
    backStyle: 'standard',
    fabricColor: '#4A4A4A',
    backFinish: '#8B4513',
    parts: ['Cushion_Seat', 'Legs'],
    fabricTexture: 'champlain',
    backFinishTexture: 'antique',
  };
  const [config, setConfig] = useState<ChairConfig>(defaultConfig);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);

  const generateModelId = (): string => {
    return `chair-${config.backStyle}-${config.fabricTexture}-${config.backFinishTexture}-${Date.now()}`;
  };

  const handleARView = () => {
    const modelId = generateModelId();
    const arUrl = `${window.location.origin}/ar?modelId=${modelId}`;
    setShowQRCode(true);
  };

  const handleScreenshot = useCallback(() => {
    if (canvasRef.current) {
      // Force a render by waiting for the next frame
      setTimeout(() => {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        if (dataUrl.includes('data:image/png;base64,iVBOR')) { // Check if the image is not empty
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'chair-configurator-screenshot.png';
          link.click();
        } else {
          console.error('Failed to capture screenshot: Canvas is empty or not rendered.');
        }
      }, 100); // Small delay to ensure rendering
    }
  }, []);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const qrCodeValue = `${window.location.origin}/ar?modelId=${generateModelId()}`;

  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: [0, 2, 5], fov: 60, near: 0.1, far: 1000 }}
          gl={{ preserveDrawingBuffer: true }} // Enable preserveDrawingBuffer for toDataURL
        >
          <Stage environment="city" intensity={0.5} adjustCamera={false}>
            <Chair config={config} />
          </Stage>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={2}
            maxDistance={15}
            target={[0, 1, 0]}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.5}
          />
        </Canvas>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button
            onClick={() => setShowMeasure(!showMeasure)}
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-md transition-colors flex items-center"
            title="Measure"
          >
            <FaRuler size={20} />
          </button>
          <button
            onClick={handleScreenshot}
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-md transition-colors flex items-center"
            title="Take Screenshot"
          >
            <AiOutlineCamera size={20} />
          </button>
          <button
            onClick={handleARView}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md transition-colors flex items-center"
            title="View in AR"
          >
            <AiOutlineQrcode size={20} className="mr-2" />
            <span>View in AR</span>
          </button>
          <button
            onClick={handleResetView}
            className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-md transition-colors flex items-center"
            title="Reset View"
          >
            <AiOutlineReload size={20} />
          </button>
        </div>

        {showQRCode && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-bold mb-4">Scan to View in AR</h3>
              <QRCode value={qrCodeValue} size={200} level="H" includeMargin={true} />
              <p className="mt-4 text-sm text-gray-600">
                Scan this QR code with your mobile device to view in AR
              </p>
              <button
                onClick={() => setShowQRCode(false)}
                className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showMeasure && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-bold mb-4">Measurement Tool</h3>
              <p className="text-sm text-gray-600">Measurement feature coming soon!</p>
              <button
                onClick={() => setShowMeasure(false)}
                className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <ConfigPanel config={config} setConfig={setConfig} />
    </div>
  );
};