import { useEffect, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { AiOutlineQrcode, AiOutlineCamera, AiOutlineReload } from 'react-icons/ai';
import { FaRuler } from 'react-icons/fa';
import { Chair } from './Chair';
import { ConfigPanel } from './ConfigPanel';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
  const [chairConfig, setChairConfig] = useState<ChairConfig>(defaultConfig);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const [arModelUrl, setArModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const chairRef = useRef<THREE.Group>(null);

// In your component (e.g., DesignPage.tsx)
const handleSaveDesign = useCallback(async () => {
  const exporter = new GLTFExporter();
  exporter.parse(
    chairRef.current,
    async (gltf) => {
      // Convert GLTF data to a Blob
      const blob = new Blob([gltf], { type: 'application/octet-stream' });

      try {
        // Send the Blob to the local server
        const response = await fetch('http://192.168.1.100:4000/upload', {
          method: 'POST',
          body: blob,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        if (!response.ok) throw new Error('Upload failed');
        const { url } = await response.json();
        
        // Set the URL for the QR code
        setArModelUrl(url); // Assuming setArModelUrl is your state setter
        setShowQRCode(true); // Assuming this triggers QR code display
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload model'); // Assuming setError is your error handler
      }
    },
    { binary: true }, // Use binary GLTF for smaller file size
    (error) => {
      console.error('Export error:', error);
      setError('Failed to export model');
    }
  );
}, [chairRef]);

// In ChairConfigurator.tsx
const handleARView = () => {
  if (arModelUrl) {
    const isAndroid = /android/i.test(navigator.userAgent.toLowerCase());
    
    if (isAndroid) {
      // Use our /ar route for more controlled handling
      window.location.href = `${window.location.origin}/ar?modelUrl=${encodeURIComponent(arModelUrl)}`;
    } else {
      // Fallback to QR code for iOS or desktop
      setShowQRCode(true);
    }
  } else {
    // Generate the model first
    handleSaveDesign();
  }
}

  const handleScreenshot = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'chair-configurator-screenshot.png';
      link.click();
    }
  }, []);

  const handleResetView = () => {
    if (controlsRef.current) controlsRef.current.reset();
  };

  const qrCodeValue = arModelUrl
  ? `${window.location.origin}/ar?modelUrl=${encodeURIComponent(arModelUrl)}`
  : `${window.location.origin}/ar`;
  

  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: [0, 2, 5], fov: 60, near: 0.1, far: 1000 }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Stage environment="city" intensity={0.5} adjustCamera={false}>
            <Chair config={chairConfig} showDimensions={showMeasure} ref={chairRef} />
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
                Scan this QR code or{' '}
                <a href={qrCodeValue} className="text-blue-500 underline">
                  click here
                </a>{' '}
                to view in AR
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

        {error && (
          <div className="absolute top-4 left-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
      <ConfigPanel config={chairConfig} setConfig={setChairConfig} onSave={handleSaveDesign} />
    </div>
  );
};