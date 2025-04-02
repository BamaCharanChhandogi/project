import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, memo } from "react";
import * as THREE from "three";
import { ChairConfig } from "./ChairConfigurator";
import { Text } from "@react-three/drei";

const PARTS_URLS: { [key: string]: string } = {
  Cushion_Seat: "/CushionSeat.glb",
  Legs: "/Legs.glb",
  Optional_1: "/Optional1.glb",
  Optional_2: "/Optional2.glb",
};

Object.values(PARTS_URLS).forEach((url) => useGLTF.preload(url));

const textureLoader = new THREE.TextureLoader();

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

const antiqueEnglish = textureLoader.load('/Anitque English.jpg');
const brushedNickel = textureLoader.load('/Brushed nickel.jpg');
const satinNickel = textureLoader.load('/Satin nickel.jpg');
const metalMetalness = textureLoader.load('/Metal032_2K_Metalness.jpg');
const metalNormal = textureLoader.load('/Metal032_2K_Normal.jpg');

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

export const Chair = memo(({ config, showDimensions = false }: { config: ChairConfig; showDimensions?: boolean }) => {
  const chairRef = useRef<THREE.Group>(null);
  const dimensionLinesRef = useRef<THREE.Group>(null);

  const loadedParts = config.parts.map((part) => {
    const { scene } = useGLTF(PARTS_URLS[part]);
    return scene.clone();
  });

  const combinedScene = new THREE.Group();
  loadedParts.forEach((part) => {
    combinedScene.add(part);
  });

  const originalMaterials = useRef<Record<string, THREE.Material>>({});

  useEffect(() => {
    if (!chairRef.current) return;

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

    chairRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && !originalMaterials.current[child.uuid]) {
        originalMaterials.current[child.uuid] = child.material.clone();
      }
    });

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

        if (isFixedMainPart) {
          child.material = fabricMaterial;
        } else if (isFixedMetalPart) {
          child.material = backFinishMaterial;
        } else if (isOptionalPart && originalMaterials.current[child.uuid]) {
          child.material = originalMaterials.current[child.uuid];
        }

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

    return () => {
      if (fabricMaterial) fabricMaterial.dispose();
      if (backFinishMaterial) backFinishMaterial.dispose();
    };
  }, [config]);

  useEffect(() => {
    if (!chairRef.current || !showDimensions) return;

    const box = new THREE.Box3().setFromObject(chairRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    if (!dimensionLinesRef.current) {
      dimensionLinesRef.current = new THREE.Group();
      chairRef.current.add(dimensionLinesRef.current);
    } else {
      dimensionLinesRef.current.clear();
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

    // Width (X-axis)
    const widthLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.min.x, box.max.y + 0.2, box.max.z + 0.2),
      new THREE.Vector3(box.max.x, box.max.y + 0.2, box.max.z + 0.2),
    ]);
    const widthLineObj = new THREE.Line(widthLine, lineMaterial);
    dimensionLinesRef.current.add(widthLineObj);

    const widthText = `${(size.x).toFixed(2)} units`;
    const widthLabel = (
      <Text
        position={[center.x, box.max.y + 0.3, box.max.z + 0.2]}
        fontSize={0.1}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        {widthText}
      </Text>
    );
    dimensionLinesRef.current.add(widthLabel);

    // Height (Y-axis)
    const heightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.max.x + 0.2, box.min.y, box.max.z + 0.2),
      new THREE.Vector3(box.max.x + 0.2, box.max.y, box.max.z + 0.2),
    ]);
    const heightLineObj = new THREE.Line(heightLine, lineMaterial);
    dimensionLinesRef.current.add(heightLineObj);

    const heightText = `${(size.y).toFixed(2)} units`;
    const heightLabel = (
      <Text
        position={[box.max.x + 0.3, center.y, box.max.z + 0.2]}
        fontSize={0.1}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        {heightText}
      </Text>
    );
    dimensionLinesRef.current.add(heightLabel);

    // Depth (Z-axis)
    const depthLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(box.max.x + 0.2, box.max.y + 0.2, box.min.z),
      new THREE.Vector3(box.max.x + 0.2, box.max.y + 0.2, box.max.z),
    ]);
    const depthLineObj = new THREE.Line(depthLine, lineMaterial);
    dimensionLinesRef.current.add(depthLineObj);

    const depthText = `${(size.z).toFixed(2)} units`;
    const depthLabel = (
      <Text
        position={[box.max.x + 0.3, box.max.y + 0.3, center.z]}
        fontSize={0.1}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        {depthText}
      </Text>
    );
    dimensionLinesRef.current.add(depthLabel);

    console.log('Dimensions:', { width: size.x, height: size.y, depth: size.z });

    return () => {
      if (dimensionLinesRef.current) {
        dimensionLinesRef.current.clear();
      }
    };
  }, [config, showDimensions]);

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

const arePropsEqual = (prevProps: { config: ChairConfig; showDimensions?: boolean }, nextProps: { config: ChairConfig; showDimensions?: boolean }) => {
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