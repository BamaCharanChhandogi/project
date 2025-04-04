import { useEffect, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { AiOutlineQrcode, AiOutlineCamera, AiOutlineReload } from 'react-icons/ai';
import { FaRuler } from 'react-icons/fa';
import { Chair } from './Chair';
import { ConfigPanel } from './ConfigPanel';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Client, Storage, Account } from 'appwrite';

export interface ChairConfig {
  backStyle: 'standard' | 'welted';
  fabricColor: string;
  backFinish: string;
  parts: string[];
  fabricTexture: 'champlain' | 'huron' | 'kaleidoscope' | 'lugano' | 'traveller';
  backFinishTexture: 'antique' | 'brushed' | 'satin';
}

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67e54122002b48ebf3d1');

const storage = new Storage(client);
const account = new Account(client);

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
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const chairRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const setupAnonymousSession = async () => {
      try {
        await account.get();
        console.log('Existing session found');
      } catch (err: any) {
        if (err.code === 401) {
          try {
            await account.createAnonymousSession();
            console.log('Anonymous session created');
          } catch (sessionErr: any) {
            console.error('Failed to create anonymous session:', sessionErr);
            setError(`Authentication failed: ${sessionErr.message}`);
          }
        } else {
          console.error('Unexpected error checking session:', err);
          setError(`Unexpected error: ${err.message}`);
        }
      }
    };
    setupAnonymousSession();
  }, []);

  const handleSaveDesign = useCallback(async () => {
    if (!chairRef.current) {
      setError('No chair model to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    const exporter = new GLTFExporter();
    exporter.parse(
      chairRef.current,
      async (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const file = new File([blob], 'custom-chair.glb', { type: 'application/octet-stream' });

        try {
          const response = await storage.createFile(
            '67e541df000fda7737de',
            'unique()',
            file
          );
          const fileUrl = `${client.config.endpoint}/storage/buckets/67e541df000fda7737de/files/${response.$id}/view?project=67e54122002b48ebf3d1`;
          setArModelUrl(fileUrl);
          setShowQRCode(true);
        } catch (err: any) {
          console.error('Appwrite upload error:', err);
          setError(`Failed to save model: ${err.message || 'Unknown error'}`);
        } finally {
          setIsSaving(false);
        }
      },
      (error) => {
        console.error('GLTF Export error:', error);
        setError('Failed to export model');
        setIsSaving(false);
      },
      { binary: true, trs: true, embedImages: true }
    );
  }, []);

  const handleARView = useCallback(() => {
    if (arModelUrl) {
      const isAndroid = /android/i.test(navigator.userAgent.toLowerCase());
      if (isAndroid) {
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(arModelUrl)}&mode=ar_preferred&title=Custom Chair`;
        window.location.href = sceneViewerUrl;

        setTimeout(() => {
          if (document.hasFocus()) {
            setError('Failed to launch AR. Please ensure Google Scene Viewer is installed.');
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

  const toggleMobileConfig = () => {
    setIsMobileConfigOpen(!isMobileConfigOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative overflow-hidden">
      {/* Mobile Config Toggle Button */}
      <button 
        onClick={toggleMobileConfig}
        className="md:hidden fixed bottom-20 right-4 z-20 bg-blue-500 text-white p-3 rounded-full shadow-lg"
      >
        {isMobileConfigOpen ? 'X' : '≡'}
      </button>

      {/* 3D Viewer Area */}
      <div className="flex-1 relative h-full">
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

        {/* Top Banner - Product Info */}
        <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-90 p-3 md:p-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Rhythm Round Chair</h1>
            <p className="text-xs md:text-sm text-gray-500">Banquet Chair Configurator</p>
          </div>
          {/* <div className="hidden md:block">
            <button
              onClick={handleSaveDesign}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
            >
              Save Design
            </button>
          </div> */}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm p-2 rounded-full flex space-x-1 md:space-x-3">
            <button
              onClick={() => setShowMeasure(!showMeasure)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:p-3 rounded-full transition-colors flex items-center justify-center"
              title="Measure"
            >
              <FaRuler size={16} />
            </button>
            <button
              onClick={handleScreenshot}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:p-3 rounded-full transition-colors flex items-center justify-center"
              title="Take Screenshot"
            >
              <AiOutlineCamera size={16} />
            </button>
            <button
              onClick={handleARView}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 md:px-4 rounded-full transition-colors flex items-center"
              title="View in AR"
            >
              <AiOutlineQrcode size={16} className="mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">AR View</span>
            </button>
            <button
              onClick={handleResetView}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:p-3 rounded-full transition-colors flex items-center justify-center"
              title="Reset View"
            >
              <AiOutlineReload size={16} />
            </button>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg text-center max-w-xs md:max-w-md mx-4">
              <h3 className="text-lg font-bold mb-3 md:mb-4">Scan to View in AR</h3>
              <QRCode value={qrCodeValue} size={200} level="H" includeMargin={true} className="mx-auto" />
              <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600">
                Scan this QR code or{' '}
                <a href={qrCodeValue} className="text-blue-500 underline">
                  click here
                </a>{' '}
                to view in AR
              </p>
              <button
                onClick={() => setShowQRCode(false)}
                className="mt-3 md:mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {isSaving && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg text-center">
              <p className="mb-3 md:mb-4">Saving design to Database...</p>
              <div className="w-10 h-10 md:w-16 md:h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="absolute top-16 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-red-500 text-white p-3 rounded-lg shadow-lg z-20">
            <div className="flex justify-between items-center">
              <p className="text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-2 text-white">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panel - Desktop (fixed right) / Mobile (sliding up) */}
      <div className={`
        md:w-80 md:relative md:block bg-white shadow-lg overflow-y-auto
        fixed inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-in-out
        ${isMobileConfigOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        max-h-[80vh] md:max-h-screen md:h-full
      `}>
        <ConfigPanel 
          config={chairConfig} 
          setConfig={setChairConfig} 
          onSave={handleSaveDesign} 
          onClose={() => setIsMobileConfigOpen(false)}
        />
      </div>
    </div>
  );
};