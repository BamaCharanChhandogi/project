import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter';

function HoodieModel({ customLogo, onDownloadImage, onDownloadGLB, controlsRef }) {
  const { scene } = useGLTF('/Hoodie/tggrg.glb');
  const defaultLogoTexture = useTexture('/Hoodie/logoPrint.jpeg');
  const logoTexture = customLogo || defaultLogoTexture;
  const { raycaster, camera, mouse, gl: renderer, scene: fullScene } = useThree();
  
  const textures = useTexture({
    cotton: '/Hoodie/Alpaca_BaseColor.png',
    fleece: '/Hoodie/Fabric Upholstery Pyramids_diffuse.png',
    knit: '/Hoodie/Fabric_Normal.jpg',
    denim: '/Hoodie/FabricUpholsteryBrightAnglePattern001_COL_VAR1_1K.jpg',
    leather: '/Hoodie/Floral.jpg'
  });

  const hoodieRef = useRef();
  const [availableMeshes, setAvailableMeshes] = useState([]);
  const [selectedMeshName, setSelectedMeshName] = useState('Main003');
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [logoMeshRefs, setLogoMeshRefs] = useState([]);

  const { 
    posX, posY, posZ, 
    rotX, rotY, rotZ, 
    scaleX, scaleY, 
    debug, 
    meshName,
    roughness,
    metalness,
    textureScale,
    selectedTexture,
    enableMultiMeshDecal,
    set: setControlValues
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
    },
    enableMultiMeshDecal: { value: true, label: 'Enable Full Surface Logo' }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [decalPosition, setDecalPosition] = useState([posX, posY, posZ]);
  
  // Check if click is on logo decal
  const isClickOnLogo = (event) => {
    raycaster.setFromCamera(mouse, camera);
    
    // First check if we're clicking on the decal meshes specifically
    const decalIntersects = raycaster.intersectObjects(logoMeshRefs);
    if (decalIntersects.length > 0) {
      return true;
    }
    
    // If not directly on decal mesh, check if near the decal position
    const meshIntersects = raycaster.intersectObjects(decalMeshes);
    if (meshIntersects.length > 0) {
      const intersect = meshIntersects[0];
      const clickPosition = intersect.point;
      const decalPosVector = new THREE.Vector3(...decalPosition);
      
      // Check if click is within a threshold distance of the decal
      const distance = clickPosition.distanceTo(decalPosVector);
      const threshold = Math.max(scaleX, scaleY) * 0.5; // Adjust based on decal size
      
      if (distance < threshold) {
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (isClickOnLogo(event)) {
        setIsDragging(true);
        if (controlsRef.current) {
          controlsRef.current.enabled = false; // Disable OrbitControls when logo is clicked
        }
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (controlsRef.current) {
          controlsRef.current.enabled = true; // Re-enable OrbitControls
        }
      }
    };
    
    const handlePointerMove = (event) => {
      if (!isDragging) return;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(decalMeshes);
      
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const newPosition = intersect.point.clone().add(
          intersect.face.normal.multiplyScalar(0.01)
        );
        
        setDecalPosition([newPosition.x, newPosition.y, newPosition.z]);
        setControlValues({
          posX: newPosition.x,
          posY: newPosition.y,
          posZ: newPosition.z
        });
      }
    };
    
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [raycaster, camera, mouse, isDragging, decalMeshes, logoMeshRefs, setControlValues, decalPosition, scaleX, scaleY, controlsRef, isClickOnLogo]);

  useEffect(() => {
    if (!scene) return;

    const meshNames = [];
    const meshList = [];
    const currentTexture = textures[selectedTexture];
    currentTexture.repeat.set(textureScale, textureScale);
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;

    scene.traverse((child) => {
      if (child.isMesh) {
        meshNames.push(child.name);
        meshList.push(child);
        
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness,
          metalness: metalness
        });
        child.material = material;
        child.material.needsUpdate = true;
      }
    });

    setAvailableMeshes(meshNames);
    setDecalMeshes(meshList);
  }, [scene, selectedTexture, roughness, metalness, textureScale, textures]);

  // Download handlers
  useEffect(() => {
    if (onDownloadImage) {
      renderer.render(fullScene, camera);
      const dataURL = renderer.domElement.toDataURL('image/png');
      onDownloadImage(dataURL);
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  useEffect(() => {
    if (onDownloadGLB) {
      const exportScene = new THREE.Scene();
      const hoodieGroup = hoodieRef.current;
      
      if (!hoodieGroup) {
        console.error('Hoodie group not found via ref');
        return;
      }

      const hoodieClone = hoodieGroup.clone();
      exportScene.add(hoodieClone);

      exportScene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          if (customLogo) {
            child.material.map = customLogo;
            child.material.needsUpdate = true;
          }
        }
      });

      const exporter = new GLTFExporter();
      exporter.parse(
        exportScene,
        (gltf) => {
          const blob = new Blob([gltf], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          onDownloadGLB(url);
        },
        (error) => {
          console.error('Error exporting GLB:', error);
        },
        { binary: true }
      );
    }
  }, [onDownloadGLB, fullScene, customLogo]);

  // Store refs to logo mesh instances
  const storeLogoMeshRef = (ref) => {
    if (ref && !logoMeshRefs.includes(ref)) {
      setLogoMeshRefs(prev => [...prev, ref]);
    }
  };

  // Clear logo mesh refs when selection changes
  useEffect(() => {
    setLogoMeshRefs([]);
  }, [selectedMeshName, enableMultiMeshDecal]);

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={hoodieRef} name="HoodieGroup" position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <primitive object={scene} />
        
        {enableMultiMeshDecal ? (
          decalMeshes.map((mesh, index) => (
            <mesh key={index} geometry={mesh.geometry}>
              <Decal
                ref={storeLogoMeshRef}
                debug={debug}
                position={decalPosition}
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
          ))
        ) : (
          decalMeshes.map((mesh, index) => (
            mesh.name === selectedMeshName && (
              <mesh key={index} geometry={mesh.geometry}>
                <Decal
                  ref={storeLogoMeshRef}
                  debug={debug}
                  position={decalPosition}
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
            )
          ))
        )}
      </group>
    </Float>
  );
}

function HoodieViewer() {
  const controlsRef = useRef();
  const [customLogo, setCustomLogo] = useState(null);
  const [dragInstructions, setDragInstructions] = useState(true);
  const [downloadImageTrigger, setDownloadImageTrigger] = useState(null);
  const [downloadGLBTrigger, setDownloadGLBTrigger] = useState(null);

  const { background, environment, intensity, shadowOpacity, shadowBlur } = useControls('Scene Settings', {
    environment: {
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
      value: 'studio'
    },
    background: { value: true },
    intensity: { value: 0.7, min: 0, max: 2, step: 0.1 },
    shadowOpacity: { value: 0.4, min: 0, max: 1, step: 0.1 },
    shadowBlur: { value: 2, min: 0, max: 10, step: 0.5 }
  });

  useEffect(() => {
    const timer = setTimeout(() => setDragInstructions(false), 5000);
    return () => clearTimeout(timer);
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

  const handleImageDownload = () => {
    setDownloadImageTrigger(Date.now());
  };

  const handleGLBDownload = () => {
    setDownloadGLBTrigger(Date.now());
  };

  const handleImageDownloadComplete = (dataURL) => {
    if (dataURL) {
      const link = document.createElement('a');
      link.download = 'custom_hoodie_design.png';
      link.href = dataURL;
      link.click();
      setDownloadImageTrigger(null);
    }
  };

  const handleGLBDownloadComplete = (url) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'custom_hoodie.glb';
      link.click();
      URL.revokeObjectURL(url);
      setDownloadGLBTrigger(null);
    }
  };

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

  const imageDownloadButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: 'white',
    position: 'absolute',
    top: '20px',
    left: '180px',
  };

  const glbDownloadButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#FF9800',
    color: 'white',
    position: 'absolute',
    top: '20px',
    left: '360px',
  };

  const instructionsStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    pointerEvents: 'none',
    opacity: dragInstructions ? 1 : 0,
    transition: 'opacity 0.5s ease',
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#f0f0f0', position: 'relative' }}>
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={45} />
        
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color="blue" wireframe />
          </mesh>
        }>
          <ambientLight intensity={intensity * 0.5} />
          
          <HoodieModel 
            customLogo={customLogo} 
            onDownloadImage={downloadImageTrigger ? handleImageDownloadComplete : null}
            onDownloadGLB={downloadGLBTrigger ? handleGLBDownloadComplete : null}
            controlsRef={controlsRef} // Pass the controls ref to the model
          />
          
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

      <label style={uploadButtonStyle}>
        Upload Logo
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </label>

      <button
        onClick={handleImageDownload}
        style={imageDownloadButtonStyle}
      >
        Download PNG
      </button>

      <button
        onClick={handleGLBDownload}
        style={glbDownloadButtonStyle}
      >
        Download GLB
      </button>

      <div style={instructionsStyle}>
        <h3>Click and drag on the logo to move it</h3>
        <p>Use controls on the right to adjust size and rotation</p>
        <p>Click on the hoodie to rotate the view</p>
      </div>
    </div>
  );
}

export default HoodieViewer;