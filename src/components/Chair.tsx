import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ChairConfig } from "./ChairConfigurator";

// Define the available parts and their corresponding .glb files
const PARTS_URLS: { [key: string]: string } = {
  Cushion_Seat: "/CushionSeat.glb",
  Legs: "/Legs.glb",
  Optional_1: "/Optional1.glb",
  Optional_2: "/Optional2.glb",
};

// Preload all parts
Object.values(PARTS_URLS).forEach((url) => useGLTF.preload(url));

// Load textures
const textureLoader = new THREE.TextureLoader();

// Champlain textures
const champlainBaseColor = textureLoader.load('/Champlain_BaseColor.png');
const champlainNormal = textureLoader.load('/Champlain_Normal.png');
const champlainRoughness = textureLoader.load('/Champlain_Roughness.png');

// Huron textures
const huronBaseColor = textureLoader.load('/Huron_BaseColor.png');
const huronNormal = textureLoader.load('/Huron_Normal.png');
const huronRoughness = textureLoader.load('/Huron_Roughness.png');

// Kaleidoscope textures (named Bazaar in the files)
const kaleidoscopeBaseColor = textureLoader.load('/Bazaar_Base_color.png');
const kaleidoscopeNormal = textureLoader.load('/Bazaar_Normal.png');
const kaleidoscopeRoughness = textureLoader.load('/Bazaar_Roughness.png');

// Lugano textures
const luganoBaseColor = textureLoader.load('/Lugano_BaseColor.png');
const luganoNormal = textureLoader.load('/Lugano_Normal.png');
const luganoRoughness = textureLoader.load('/Lugano_Roughness.png');

// Traveller textures (named Hay in the files)
const travellerBaseColor = textureLoader.load('/Hay_Base_color.png');
const travellerNormal = textureLoader.load('/Hay_Normal.png');
const travellerRoughness = textureLoader.load('/Hay_Roughness.png');

// Metal textures
const antiqueEnglish = textureLoader.load('/Anitque English.jpg');
const brushedNickel = textureLoader.load('/Brushed nickel.jpg');
const satinNickel = textureLoader.load('/Satin nickel.jpg');
const metalMetalness = textureLoader.load('/Metal032_2K_Metalness.jpg');
const metalNormal = textureLoader.load('/Metal032_2K_Normal.jpg');

// Configure texture properties for BaseColor maps (sRGB color space)
[
  champlainBaseColor,
  huronBaseColor,
  kaleidoscopeBaseColor,
  luganoBaseColor,
  travellerBaseColor,
  antiqueEnglish,
  brushedNickel,
  satinNickel,
].forEach((texture) => {
  texture.flipY = false; // Adjust for correct orientation
  texture.encoding = THREE.sRGBEncoding; // Use sRGB for color maps
  texture.repeat.set(2, 2); // Repeat texture for better detail on larger surfaces
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Enable wrapping
});

// Configure texture properties for Normal and Roughness maps (linear color space)
[
  champlainNormal,
  champlainRoughness,
  huronNormal,
  huronRoughness,
  kaleidoscopeNormal,
  kaleidoscopeRoughness,
  luganoNormal,
  luganoRoughness,
  travellerNormal,
  travellerRoughness,
  metalMetalness,
  metalNormal,
].forEach((texture) => {
  texture.flipY = false;
  texture.encoding = THREE.LinearEncoding; // Use linear for non-color data (normal, roughness, metalness)
});

export function Chair({ config }: { config: ChairConfig }) {
  const chairRef = useRef<THREE.Group>(null);

  // Load the selected parts
  const loadedParts = config.parts.map((part) => {
    const { scene } = useGLTF(PARTS_URLS[part]);
    return scene.clone();
  });

  // Combine all parts into a single group
  const combinedScene = new THREE.Group();
  loadedParts.forEach((part) => {
    combinedScene.add(part);
  });

  // Add this at the component level, before the useEffect
  const originalMaterials = useRef<Record<string, THREE.Material>>({});

  // Apply configuration changes
useEffect(() => {
  if (!chairRef.current) return;

  // Create materials for fixed parts
  const fabricMaterial = new THREE.MeshStandardMaterial({
    map: config.fabricTexture === 'champlain' ? champlainBaseColor :
         config.fabricTexture === 'huron' ? huronBaseColor :
         config.fabricTexture === 'kaleidoscope' ? kaleidoscopeBaseColor :
         config.fabricTexture === 'lugano' ? luganoBaseColor :
         config.fabricTexture === 'traveller' ? travellerBaseColor :
         champlainBaseColor,
    
    normalMap: config.fabricTexture === 'champlain' ? champlainNormal :
               config.fabricTexture === 'huron' ? huronNormal :
               config.fabricTexture === 'kaleidoscope' ? kaleidoscopeNormal :
               config.fabricTexture === 'lugano' ? luganoNormal :
               config.fabricTexture === 'traveller' ? travellerNormal :
               champlainNormal,
    
    roughnessMap: config.fabricTexture === 'champlain' ? champlainRoughness :
                  config.fabricTexture === 'huron' ? huronRoughness :
                  config.fabricTexture === 'kaleidoscope' ? kaleidoscopeRoughness :
                  config.fabricTexture === 'lugano' ? luganoRoughness :
                  config.fabricTexture === 'traveller' ? travellerRoughness :
                  champlainRoughness,
    
    roughness: 0.8,
    metalness: 0.05,
  });

  const backFinishMaterial = new THREE.MeshStandardMaterial({
    map: config.backFinishTexture === 'antique' ? antiqueEnglish :
         config.backFinishTexture === 'brushed' ? brushedNickel :
         config.backFinishTexture === 'satin' ? satinNickel :
         antiqueEnglish,
    
    metalnessMap: metalMetalness,
    normalMap: metalNormal,
    roughness: 0.4,
    metalness: 0.9,
  });

  // Store original materials for all parts on first load
  chairRef.current.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material && !originalMaterials.current[child.uuid]) {
      originalMaterials.current[child.uuid] = child.material.clone();
    }
  });

  // Apply materials based on part type
  chairRef.current.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Define fixed main parts (fabric texture)
      const isFixedMainPart = 
        (child.name.toLowerCase().includes('seat') ||
         child.name.toLowerCase().includes('cushion') ||
         child.name.toLowerCase().includes('backrest') ||
         child.name.toLowerCase().includes('arm')) &&
        !(child.name.toLowerCase().includes('optional') || 
          child.name.toLowerCase().includes('pillow'));

      // Define fixed metal parts (metal texture)
      const isFixedMetalPart = 
        (child.name.toLowerCase().includes('frame') ||
         child.name.toLowerCase().includes('leg') ||
         child.name.toLowerCase().includes('base')) &&
        !(child.name.toLowerCase().includes('optional') || 
          child.name.toLowerCase().includes('pillow'));

      // Define optional parts (to keep original material)
      const isOptionalPart = 
        child.name.toLowerCase().includes('optional1') || 
        child.name.toLowerCase().includes('optional_1') ||
        child.name.toLowerCase().includes('optional2') || 
        child.name.toLowerCase().includes('optional_2') ||
        child.name.toLowerCase().includes('pillow');

      if (isFixedMainPart) {
        child.material = fabricMaterial;
      } else if (isFixedMetalPart) {
        child.material = backFinishMaterial;
      } else if (isOptionalPart && originalMaterials.current[child.uuid]) {
        // Restore original material for optional parts
        child.material = originalMaterials.current[child.uuid];
      }

      // Handle back style visibility
      if (child.name.toLowerCase().includes('back')) {
        if (child.name.toLowerCase().includes('standard')) {
          child.visible = config.backStyle === 'standard';
        } else if (child.name.toLowerCase().includes('welted')) {
          child.visible = config.backStyle === 'welted';
        }
      }

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Cleanup: Dispose of materials when component unmounts or config changes
  return () => {
    fabricMaterial.dispose();
    backFinishMaterial.dispose();
  };
}, [config]);

  // Debug the model size and structure
  useEffect(() => {
    if (!chairRef.current) return;

    // Calculate bounding box to understand dimensions
    const box = new THREE.Box3().setFromObject(chairRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    console.log('Combined model size (after scaling):', size.x, size.y, size.z);
    console.log('Combined model center (after scaling):', center.x, center.y, center.z);
  }, [config.parts]);

  return (
    <group
      ref={chairRef}
      dispose={null}
      scale={[1, 1, 1]}
      position={[0, 0.5, 0]}
      rotation={[0, Math.PI / 4, 0]}
    >
      <primitive object={combinedScene} />
    </group>
  );
}