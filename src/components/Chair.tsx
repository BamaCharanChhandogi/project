import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, memo } from "react";
import * as THREE from "three";
import { ChairConfig } from "./ChairConfigurator";

// Define URLs for chair parts
const PARTS_URLS: { [key: string]: string } = {
  Cushion_Seat: "/CushionSeat.glb",
  Legs: "/Legs.glb",
  Optional_1: "/Optional1.glb",
  Optional_2: "/Optional2.glb",
};

// Preload GLTF models
Object.values(PARTS_URLS).forEach((url) => useGLTF.preload(url));

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load fabric textures
const champlainBaseColor = textureLoader.load('/Champlain_BaseColor.png');
const champlainNormal = textureLoader.load('/Champlain_Normal.png');
const champlainRoughness = textureLoader.load('/Champlain_Roughness.png');

const huronBaseColor = textureLoader.load('/Huron_BaseColor.png');
const huronNormal = textureLoader.load('/Huron_Normal.png');
const huronRoughness = textureLoader.load('/Huron_Roughness.png');

const kaleidoscopeBaseColor = textureLoader.load('/Bazaar_Base_color.png');
const kaleidoscopeNormal = textureLoader.load('/Bazaar_Normal.png');
const kaleidoscopeRoughness = textureLoader.load('/Bazaar_Roughness.png');

const luganoBaseColor = textureLoader.load('/Lugano_BaseColor.png');
const luganoNormal = textureLoader.load('/Lugano_Normal.png');
const luganoRoughness = textureLoader.load('/Lugano_Roughness.png');

const travellerBaseColor = textureLoader.load('/Hay_Base_color.png');
const travellerNormal = textureLoader.load('/Hay_Normal.png');
const travellerRoughness = textureLoader.load('/Hay_Roughness.png');

// Load metal textures
const antiqueEnglish = textureLoader.load('/Anitque English.jpg');
const brushedNickel = textureLoader.load('/Brushed nickel.jpg');
const satinNickel = textureLoader.load('/Satin nickel.jpg');
const metalMetalness = textureLoader.load('/Metal032_2K_Metalness.jpg');
const metalNormal = textureLoader.load('/Metal032_2K_Normal.jpg');

// Configure texture properties
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
  texture.encoding = THREE.LinearEncoding;
});

interface ChairProps {
  config: ChairConfig;
  showDimensions?: boolean;
}

export const Chair = memo(({ config, showDimensions = false }: ChairProps) => {
  const chairRef = useRef<THREE.Group>(null);
  const dimensionLinesRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Record<string, THREE.Material>>({});
  const plainMaterial = useRef<THREE.MeshStandardMaterial | null>(null);

  // Load and combine chair parts
  const loadedParts = config.parts.map((part) => {
    const { scene } = useGLTF(PARTS_URLS[part]);
    return scene.clone();
  });

  const combinedScene = new THREE.Group();
  loadedParts.forEach((part) => {
    combinedScene.add(part);
  });

  // Create materials for chair
  useEffect(() => {
    if (!chairRef.current) return;

    // Plain material for measurement mode (no textures)
    plainMaterial.current = new THREE.MeshStandardMaterial({
      color: 0x808080, // Gray color
      roughness: 0.8,
      metalness: 0.05,
    });

    // Textured materials for normal mode
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

    // Store original materials
    chairRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && !originalMaterials.current[child.uuid]) {
        originalMaterials.current[child.uuid] = child.material.clone();
      }
    });

    // Apply materials based on showDimensions
    chairRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const isFixedMainPart = 
          (child.name.toLowerCase().includes('seat') ||
           child.name.toLowerCase().includes('cushion') ||
           child.name.toLowerCase().includes('backrest') ||
           child.name.toLowerCase().includes('arm')) &&
          !(child.name.toLowerCase().includes('optional') || 
            child.name.toLowerCase().includes('pillow'));

        const isFixedMetalPart = 
          (child.name.toLowerCase().includes('frame') ||
           child.name.toLowerCase().includes('leg') ||
           child.name.toLowerCase().includes('base')) &&
          !(child.name.toLowerCase().includes('optional') || 
            child.name.toLowerCase().includes('pillow'));

        const isOptionalPart = 
          child.name.toLowerCase().includes('optional1') || 
          child.name.toLowerCase().includes('optional_1') ||
          child.name.toLowerCase().includes('optional2') || 
          child.name.toLowerCase().includes('optional_2') ||
          child.name.toLowerCase().includes('pillow');

        if (showDimensions) {
          // Apply plain material when showing dimensions
          child.material = plainMaterial.current;
        } else {
          // Apply textured materials in normal mode
          if (isFixedMainPart) {
            child.material = fabricMaterial;
          } else if (isFixedMetalPart) {
            child.material = backFinishMaterial;
          } else if (isOptionalPart && originalMaterials.current[child.uuid]) {
            child.material = originalMaterials.current[child.uuid];
          }
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

    // Cleanup on unmount
    return () => {
      if (fabricMaterial) fabricMaterial.dispose();
      if (backFinishMaterial) backFinishMaterial.dispose();
      if (plainMaterial.current) plainMaterial.current.dispose();
    };
  }, [config, showDimensions]);

  // Handle dimension lines and labels
  useEffect(() => {
    if (!chairRef.current || !showDimensions) {
      if (dimensionLinesRef.current) {
        dimensionLinesRef.current.clear();
      }
      return;
    }

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(chairRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Initialize dimension group
    if (!dimensionLinesRef.current) {
      dimensionLinesRef.current = new THREE.Group();
      chairRef.current.add(dimensionLinesRef.current);
    } else {
      dimensionLinesRef.current.clear();
    }

    // Define line materials
    const widthLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 }); // Red
    const depthLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 }); // Green
    const heightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 }); // Blue

    // Width (X-axis) - Red
    const widthLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.min.x, box.min.y - 0.2, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y - 0.2, box.min.z),
    ]);
    const widthLineObj = new THREE.Line(widthLine, widthLineMaterial);
    dimensionLinesRef.current.add(widthLineObj);

    const widthText = `Width: ${(size.x).toFixed(2)}m`;
    const widthLabel = createTextSprite(widthText, "red");
    widthLabel.position.set(center.x, box.min.y - 0.5, box.min.z); // Adjusted position to avoid overlap
    dimensionLinesRef.current.add(widthLabel);

    // Depth (Z-axis) - Green
    const depthLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.min.x, box.min.y - 0.2, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y - 0.2, box.max.z),
    ]);
    const depthLineObj = new THREE.Line(depthLine, depthLineMaterial);
    dimensionLinesRef.current.add(depthLineObj);

    const depthText = `Depth: ${(size.z).toFixed(2)}m`;
    const depthLabel = createTextSprite(depthText, "green");
    depthLabel.position.set(box.min.x - 0.5, box.min.y - 0.2, center.z); // Adjusted position
    dimensionLinesRef.current.add(depthLabel);

    // Height (Y-axis) - Blue
    const heightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    ]);
    const heightLineObj = new THREE.Line(heightLine, heightLineMaterial);
    dimensionLinesRef.current.add(heightLineObj);

    const heightText = `Height: ${(size.y).toFixed(2)}m`;
    const heightLabel = createTextSprite(heightText, "blue");
    heightLabel.position.set(box.min.x - 0.5, center.y, box.min.z); // Adjusted position
    dimensionLinesRef.current.add(heightLabel);

    // Summary label at the top
    const summaryText = `W: ${(size.x).toFixed(2)}m H: ${(size.y).toFixed(2)}m D: ${(size.z).toFixed(2)}m`;
    const summaryLabel = createTextSprite(summaryText, "yellow");
    summaryLabel.position.set(center.x, box.max.y + 0.7, center.z); // Adjusted position
    dimensionLinesRef.current.add(summaryLabel);

    // Log dimensions for debugging
    console.log('Dimensions:', { width: size.x, height: size.y, depth: size.z });

    // Cleanup on unmount or when showDimensions changes
    return () => {
      if (dimensionLinesRef.current) {
        dimensionLinesRef.current.clear();
      }
      widthLineMaterial.dispose();
      depthLineMaterial.dispose();
      heightLineMaterial.dispose();
    };
  }, [showDimensions]);

  // Helper function to create a sprite with text
  const createTextSprite = (text: string, color: string): THREE.Sprite => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = 1024; // Increased canvas width for larger text
    canvas.height = 256; // Increased canvas height for larger text

    // Draw text on the canvas
    context.font = "80px Arial"; // Increased font size for larger text
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create a sprite material with the texture
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    // Create and return the sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 0.5, 1); // Adjusted scale to match larger canvas and make text larger
    return sprite;
  };

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
});

// Memoization comparison function
const arePropsEqual = (
  prevProps: { config: ChairConfig; showDimensions?: boolean },
  nextProps: { config: ChairConfig; showDimensions?: boolean }
) => {
  return (
    prevProps.config.backStyle === nextProps.config.backStyle &&
    prevProps.config.fabricColor === nextProps.config.fabricColor &&
    prevProps.config.backFinish === nextProps.config.backFinish &&
    prevProps.config.parts.join(',') === nextProps.config.parts.join(',') &&
    prevProps.config.fabricTexture === nextProps.config.fabricTexture &&
    prevProps.config.backFinishTexture === nextProps.config.backFinishTexture &&
    prevProps.showDimensions === nextProps.showDimensions
  );
};

export default memo(Chair, arePropsEqual);