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
  const [arModelUrl, setArModelUrl] = useState<{ glb: string; usdz?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
        const glbFile = new File([blob], 'custom-chair.glb', { type: 'application/octet-stream' });

        try {
          // Save GLB to Appwrite
          const glbResponse = await storage.createFile(
            '67e541df000fda7737de',
            'unique()',
            glbFile
          );
          const glbFileUrl = `${client.config.endpoint}/storage/buckets/67e541df000fda7737de/files/${glbResponse.$id}/view?project=67e54122002b48ebf3d1}`;

          // Trigger USDZ conversion via Appwrite Function
          const usdzFileId = await triggerUsdzConversion(glbResponse.$id);
          const usdzFileUrl = usdzFileId
            ? `${client.config.endpoint}/storage/buckets/67e541df000fda7737de/files/${usdzFileId}/view?project=67e54122002b48ebf3d1}`
            : null;

          setArModelUrl({ glb: glbFileUrl, usdz: usdzFileUrl });
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

  const triggerUsdzConversion = async (glbFileId: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${client.config.endpoint}/functions/67ef997f002931317a12/executions`, // Replace with your Function ID
        {
          method: 'POST',
          headers: {
            'X-Appwrite-Project': '67e54122002b48ebf3d1',
            'X-Appwrite-Key': 'standard_e8c88530fddfd66fd4390a11bea496507099d44fc2854e915e628dc68a10608cf7236825ebcd03e741bf36ee7b049bb1dc8811f5cb46a481656fd853666434ed8520b7942569f1ac362285ce291c3eb9807b6632c5f7849ebd0de7169a63602b3c775c6e839be7772073a8af2d827892edee4dbe3b3244059bb25941b90d07ca', // Replace with your API key
          },
          body: JSON.stringify({ glbFileId }),
        }
      );
      const result = await response.json();
      if (result.usdzFileId) {
        return result.usdzFileId;
      } else {
        throw new Error('Conversion failed: No USDZ file ID returned');
      }
    } catch (err) {
      console.error('Failed to trigger USDZ conversion:', err);
      setError('Failed to convert GLB to USDZ');
      return null;
    }
  };

  const handleARView = useCallback(() => {
    if (arModelUrl) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = /android/i.test(userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);

      if (isAndroid) {
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(arModelUrl.glb)}&mode=ar_preferred&title=Custom Chair`;
        window.location.href = sceneViewerUrl;

        setTimeout(() => {
          if (document.hasFocus()) {
            setError('Failed to launch AR. Please ensure Google Scene Viewer is installed.');
            setShowQRCode(true);
          }
        }, 2000);
      } else if (isIOS && arModelUrl.usdz) {
        fetch(arModelUrl.usdz)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(
              new Blob([blob], { type: 'model/vnd.usdz+zip' })
            );
            const iosArUrl = `${blobUrl}#allowsContentScaling=1&ar`;
            window.location.href = iosArUrl;
          })
          .catch((err) => {
            console.error('Failed to fetch USDZ file:', err);
            setError('Failed to load AR model for iOS.');
            setShowQRCode(true);
          });
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
    ? `${window.location.origin}/ar?modelUrl=${encodeURIComponent(arModelUrl.glb)}${
        arModelUrl.usdz ? `&usdzUrl=${encodeURIComponent(arModelUrl.usdz)}` : ''
      }`
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

        {isSaving && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <p className="mb-4">Saving design to Database...</p>
              <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto" />
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