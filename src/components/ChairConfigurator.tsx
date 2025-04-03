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

  const handleSaveDesign = useCallback(async () => {
    if (!chairRef.current) {
      setError('No chair model to save');
      return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      chairRef.current,
      async (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const fileName = `custom-chair-${Date.now()}.glb`; // Unique filename
        const formData = new FormData();
        formData.append('model', blob, fileName);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data.url) {
            setArModelUrl(data.url);
            setShowQRCode(true);
            setError(null);
          } else {
            setError('Failed to get model URL from server');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setError('Failed to save model to server');
        }
      },
      (error) => {
        console.error('GLTF Export error:', error);
        setError(`Failed to export model: ${error.message}`);
      },
      { binary: true, trs: true, embedImages: true }
    );
  }, []);

  const handleARView = useCallback(() => {
    if (arModelUrl) {
      const isAndroid = /android/i.test(navigator.userAgent.toLowerCase());
      if (isAndroid) {
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(arModelUrl)}&mode=ar_preferred&title=Custom Chair&t=${Date.now()}`;
        window.location.href = sceneViewerUrl;

        setTimeout(() => {
          if (document.hasFocus()) {
            setError('Failed to launch AR. Ensure Google Scene Viewer is installed.');
            setShowQRCode(true);
          }
        }, 2000);
      } else {
        setShowQRCode(true);
      }
    } else {
      handleSaveDesign();
    }
  }, [arModelUrl, handleSaveDesign]);

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