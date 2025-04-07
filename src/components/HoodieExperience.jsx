import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  Decal, 
  useTexture, 
  useGLTF, 
  ContactShadows,
  Environment,
  Float,
  PerspectiveCamera
} from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { TextureLoader } from 'three';

// Improved MugModel component with logo upload
function MugModel({ customLogo }) {
  const { scene } = useGLTF('/Hoodie/tggrg.glb');
  const defaultLogoTexture = useTexture('/Hoodie/logoPrint.jpeg');
  
  // Use the custom logo if provided, otherwise use the default
  const logoTexture = customLogo || defaultLogoTexture;
  
  // Load five different fabric textures
  const textures = useTexture({
    cotton: '/Hoodie/Alpaca_BaseColor.png',
    fleece: '/Hoodie/Fabric Upholstery Pyramids_diffuse.png',
    knit: '/Hoodie/Fabric_Normal.jpg',
    denim: '/Hoodie/FabricUpholsteryBrightAnglePattern001_COL_VAR1_1K.jpg',
    leather: '/Hoodie/Floral.jpg'
  });

  const mugRef = useRef();
  const [decalParent, setDecalParent] = useState(null);
  const [availableMeshes, setAvailableMeshes] = useState([]);
  const [selectedMeshName, setSelectedMeshName] = useState('Main003');

  // Controls including texture selection
  const { 
    posX, posY, posZ, 
    rotX, rotY, rotZ, 
    scaleX, scaleY, 
    debug, 
    meshName,
    roughness,
    metalness,
    textureScale,
    selectedTexture
  } = useControls('Logo Decal', {
    meshName: {
      options: availableMeshes,
      value: selectedMeshName,
      onChange: (value) => setSelectedMeshName(value)
    },
    posX: { value: 0, min: -2, max: 2, step: 0.01 },
    posY: { value: 0, min: -2, max: 2, step: 0.01 },
    posZ: { value: 0.10, min: -1, max: 1, step: 0.01 },
    rotX: { value: 0.04, min: 0, max: Math.PI * 2, step: 0.01 },
    rotY: { value: 0.01, min: 0, max: Math.PI * 2, step: 0.01 },
    rotZ: { value: 0.00, min: 0, max: Math.PI * 2, step: 0.01 },
    scaleX: { value: 0.10, min: 0.1, max: 2, step: 0.01 },
    scaleY: { value: 0.17, min: 0.1, max: 2, step: 0.01 },
    debug: { value: false },
    roughness: { value: 0.7, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    textureScale: { value: 1, min: 0.1, max: 10, step: 0.1 },
    selectedTexture: {
      options: ['cotton', 'fleece', 'knit', 'denim', 'leather'],
      value: 'cotton'
    }
  });

  // Apply selected texture and find meshes
  useEffect(() => {
    if (!scene) return;

    const meshNames = [];
    console.log('Scanning scene for mesh options...');
    
    const currentTexture = textures[selectedTexture];
    currentTexture.repeat.set(textureScale, textureScale);
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;

    scene.traverse((child) => {
      if (child.isMesh) {
        console.log(`Found mesh: ${child.name}`);
        meshNames.push(child.name);
        
        // Apply selected texture to all meshes
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness,
          metalness: metalness
        });
        child.material = material;

        // Set decal parent
        if (child.name === selectedMeshName) {
          console.log(`Selected ${child.name} as decal parent`);
          setDecalParent(child);
        }
      }
    });

    setAvailableMeshes(meshNames);
  }, [scene, selectedMeshName, selectedTexture, roughness, metalness, textureScale]);

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={mugRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <primitive object={scene} />
        {decalParent && (
          <mesh geometry={decalParent.geometry}>
            <Decal
              debug={debug}
              position={[posX, posY, posZ]}
              rotation={[rotX, rotY, rotZ]}
              scale={[scaleX, scaleY, 1]}
              map={logoTexture}
              polygonOffset
              polygonOffsetFactor={-10}
              transparent
            >
              <meshStandardMaterial
                map={logoTexture}
                transparent
                opacity={1}
                depthTest={true}
                depthWrite={false}
                polygonOffset={true}
                polygonOffsetFactor={-10}
                roughness={roughness}
                metalness={metalness}
              />
            </Decal>
          </mesh>
        )}
      </group>
    </Float>
  );
}

// Simple Mug component (unchanged)
function SimpleMug() {
  const texture = useTexture('/Hoodie/logoPrint1.png');
  const mugRef = useRef();
  const bodyMeshRef = useRef();

  const { posX, posY, posZ, rotX, rotY, rotZ, scaleX, scaleY, debug, mugColor } = useControls('Simple Mug', {
    posX: { value: 0, min: -1, max: 1, step: 0.01 },
    posY: { value: 0, min: -1, max: 1, step: 0.01 },
    posZ: { value: 0.51, min: 0, max: 1, step: 0.01 },
    rotX: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    rotY: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    rotZ: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    scaleX: { value: 0.3, min: 0.1, max: 1, step: 0.01 },
    scaleY: { value: 0.3, min: 0.1, max: 1, step: 0.01 },
    debug: { value: false },
    mugColor: { value: '#2d8a58' }
  });

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={mugRef}>
        <mesh ref={bodyMeshRef} position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
          <meshStandardMaterial color={mugColor} roughness={0.3} metalness={0.1} />
          <Decal
            debug={debug}
            position={[posX, posY, posZ]}
            rotation={[rotX, rotY, rotZ]}
            scale={[scaleX, scaleY, 1]}
            map={texture}
            polygonOffset
            polygonOffsetFactor={-1}
            transparent
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.75, 32]} />
          <meshStandardMaterial color={mugColor} side={THREE.BackSide} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 32]} />
          <meshStandardMaterial color={mugColor} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.55, 0, 0]} castShadow>
          <torusGeometry args={[0.15, 0.07, 16, 32, Math.PI]} />
          <meshStandardMaterial color={mugColor} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 32]} />
          <meshStandardMaterial color="white" roughness={0.2} metalness={0.05} />
        </mesh>
      </group>
    </Float>
  );
}

// MugViewer component with logo upload and download
function MugViewer() {
  const controlsRef = useRef();
  const canvasRef = useRef();
  const [useMugModel, setUseMugModel] = useState(true);
  const [customLogo, setCustomLogo] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);

  const { background, environment, intensity, shadowOpacity, shadowBlur } = useControls('Scene Settings', {
    environment: {
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
      value: 'sunset'
    },
    background: { value: true },
    intensity: { value: 0.7, min: 0, max: 2, step: 0.1 },
    shadowOpacity: { value: 0.4, min: 0, max: 1, step: 0.1 },
    shadowBlur: { value: 2, min: 0, max: 10, step: 0.5 }
  });

  useControls('Model Selection', {
    'Use imported model': {
      value: true,
      onChange: (value) => setUseMugModel(value)
    }
  });

  // Store renderer, scene, and camera when canvas initializes
  useEffect(() => {
    if (canvasRef.current) {
      setRenderer(canvasRef.current.gl);
      setScene(canvasRef.current.scene);
      setCamera(canvasRef.current.camera);
    }
  }, []);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          setCustomLogo(texture);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!renderer || !scene || !camera) {
      console.error('Required components not available for rendering');
      return;
    }

    try {
      // Ensure the renderer preserves the drawing buffer
      const originalPreserve = renderer.preserveDrawingBuffer;
      renderer.preserveDrawingBuffer = true;

      // Force a render with current view
      renderer.render(scene, camera);

      // Capture the canvas
      const dataURL = renderer.domElement.toDataURL('image/png');

      // Create download link
      const link = document.createElement('a');
      link.download = 'custom_mug_design.png';
      link.href = dataURL;
      link.click();

      // Restore original preserveDrawingBuffer setting
      renderer.preserveDrawingBuffer = originalPreserve;
    } catch (error) {
      console.error('Error during download:', error);
    }
  };

  // Button styles (unchanged)
  const buttonStyle = {
    padding: '12px 24px',
    margin: '0 10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const uploadButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2196F3',
    color: 'white',
    position: 'absolute',
    top: '20px',
    left: '20px',
  };

  const downloadButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: 'white',
    position: 'absolute',
    top: '20px',
    left: '180px',
  };

  const hoverStyle = {
    ':hover': {
      filter: 'brightness(110%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#f0f0f0', position: 'relative' }}>
      <Canvas
        ref={canvasRef}
        shadows
        gl={{ preserveDrawingBuffer: false, antialias: true }}
        onCreated={({ gl, scene, camera }) => {
          setRenderer(gl);
          setScene(scene);
          setCamera(camera);
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={45} />
        
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color="blue" wireframe />
          </mesh>
        }>
          <ambientLight intensity={intensity * 0.5} />
          
          {useMugModel ? <MugModel customLogo={customLogo} /> : <SimpleMug />}
          
          <ContactShadows 
            position={[0, -0.5, 0]} 
            opacity={shadowOpacity} 
            blur={shadowBlur} 
            scale={10} 
          />
          <Environment preset={environment} background={background} blur={4} />
          
          <OrbitControls 
            ref={controlsRef} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 1.5}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </Suspense>
      </Canvas>

      {/* Upload Button */}
      <label 
        style={{ 
          ...uploadButtonStyle,
          ...hoverStyle,
          display: 'inline-block'
        }}
      >
        Upload Logo
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </label>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        style={{
          ...downloadButtonStyle,
          ...hoverStyle
        }}
      >
        Download Design
      </button>
    </div>
  );
}

export default MugViewer;