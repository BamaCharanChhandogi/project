import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { ChairConfig } from './ChairConfigurator';
import { forwardRef, useImperativeHandle } from 'react';

const PARTS_URLS: { [key: string]: string } = {
  Cushion_Seat: '/CushionSeat.glb',
  Legs: '/Legs.glb',
  Optional_1: '/Optional1.glb',
  Optional_2: '/Optional2.glb',
};

Object.values(PARTS_URLS).forEach((url) => useGLTF.preload(url));

const textureLoader = new THREE.TextureLoader();

const champlainBaseColor = textureLoader.load('/Champlain_BaseColor.png');
const champlainNormal = textureLoader.load('/Champlain_Normal.png');
const champlainRoughness = textureLoader.load('/Champlain_Roughness.png');

const huronBaseColor = textureLoader.load('/HURON_BaseColor.png');
const huronNormal = textureLoader.load('/HURON_Normal.png');
const huronRoughness = textureLoader.load('/HURON_Roughness.png');

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
  texture.colorSpace = THREE.LinearSRGBColorSpace; // Updated from .encoding
});

interface ChairProps {
  config: ChairConfig;
  showDimensions?: boolean;
}

export const Chair = memo(
  forwardRef<THREE.Group, ChairProps>(({ config, showDimensions = false }, ref) => {
    const chairRef = useRef<THREE.Group>(null);
    const dimensionLinesRef = useRef<THREE.Group>(null);
    const materialCache = useRef<Record<string, THREE.Material>>({});

    const loadedParts = config.parts.map((part) => {
      const { scene } = useGLTF(PARTS_URLS[part]);
      return scene.clone();
    });

    const combinedScene = new THREE.Group();
    loadedParts.forEach((part) => {
      combinedScene.add(part);
    });

    useEffect(() => {
      if (!chairRef.current) return;

      const fabricMaterial = new THREE.MeshStandardMaterial({
        map:
          config.fabricTexture === 'champlain'
            ? champlainBaseColor
            : config.fabricTexture === 'huron'
            ? huronBaseColor
            : config.fabricTexture === 'kaleidoscope'
            ? kaleidoscopeBaseColor
            : config.fabricTexture === 'lugano'
            ? luganoBaseColor
            : config.fabricTexture === 'traveller'
            ? travellerBaseColor
            : champlainBaseColor,
        normalMap:
          config.fabricTexture === 'champlain'
            ? champlainNormal
            : config.fabricTexture === 'huron'
            ? huronNormal
            : config.fabricTexture === 'kaleidoscope'
            ? kaleidoscopeNormal
            : config.fabricTexture === 'lugano'
            ? luganoNormal
            : config.fabricTexture === 'traveller'
            ? travellerNormal
            : champlainNormal,
        roughnessMap:
          config.fabricTexture === 'champlain'
            ? champlainRoughness
            : config.fabricTexture === 'huron'
            ? huronRoughness
            : config.fabricTexture === 'kaleidoscope'
            ? kaleidoscopeRoughness
            : config.fabricTexture === 'lugano'
            ? luganoRoughness
            : config.fabricTexture === 'traveller'
            ? travellerRoughness
            : champlainRoughness,
        roughness: 0.8,
        metalness: 0.05,
        color: config.fabricColor,
      });

      const backFinishMaterial = new THREE.MeshStandardMaterial({
        map:
          config.backFinishTexture === 'antique'
            ? antiqueEnglish
            : config.backFinishTexture === 'brushed'
            ? brushedNickel
            : config.backFinishTexture === 'satin'
            ? satinNickel
            : antiqueEnglish,
        metalnessMap: metalMetalness,
        normalMap: metalNormal,
        roughness: 0.4,
        metalness: 0.9,
        color: config.backFinish,
      });

      chairRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (!materialCache.current[child.uuid]) {
            materialCache.current[child.uuid] = child.material.clone();
          }

          const isFixedMainPart =
            (child.name.toLowerCase().includes('seat') ||
              child.name.toLowerCase().includes('cushion') ||
              child.name.toLowerCase().includes('backrest') ||
              child.name.toLowerCase().includes('arm')) &&
            !(child.name.toLowerCase().includes('optional') || child.name.toLowerCase().includes('pillow'));

          const isFixedMetalPart =
            (child.name.toLowerCase().includes('frame') ||
              child.name.toLowerCase().includes('leg') ||
              child.name.toLowerCase().includes('base')) &&
            !(child.name.toLowerCase().includes('optional') || child.name.toLowerCase().includes('pillow'));

          if (isFixedMainPart) {
            child.material = fabricMaterial.clone(); // Clone to avoid reuse issues
          } else if (isFixedMetalPart) {
            child.material = backFinishMaterial.clone(); // Clone to avoid reuse issues
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
        fabricMaterial.dispose();
        backFinishMaterial.dispose();
        // No need to dispose cached materials here; they’re reused
      };
    }, [config]); // Dependency on full config ensures updates

    useEffect(() => {
      if (!chairRef.current) return;

      if (!dimensionLinesRef.current) {
        dimensionLinesRef.current = new THREE.Group();
        chairRef.current.add(dimensionLinesRef.current);
      } else {
        dimensionLinesRef.current.clear();
      }

      if (!showDimensions) return;

      const box = new THREE.Box3().setFromObject(chairRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const widthLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      const depthLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
      const heightLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });

      const widthLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(box.min.x, box.min.y - 0.2, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y - 0.2, box.min.z),
      ]);
      dimensionLinesRef.current.add(new THREE.Line(widthLine, widthLineMaterial));

      const widthText = `Width: ${size.x.toFixed(2)}m`;
      const widthLabel = createTextSprite(widthText, 'red');
      widthLabel.position.set(center.x, box.min.y - 0.5, box.min.z);
      dimensionLinesRef.current.add(widthLabel);

      const depthLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(box.min.x, box.min.y - 0.2, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y - 0.2, box.max.z),
      ]);
      dimensionLinesRef.current.add(new THREE.Line(depthLine, depthLineMaterial));

      const depthText = `Depth: ${size.z.toFixed(2)}m`;
      const depthLabel = createTextSprite(depthText, 'green');
      depthLabel.position.set(box.min.x - 0.5, box.min.y - 0.2, center.z);
      dimensionLinesRef.current.add(depthLabel);

      const heightLine = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      ]);
      dimensionLinesRef.current.add(new THREE.Line(heightLine, heightLineMaterial));

      const heightText = `Height: ${size.y.toFixed(2)}m`;
      const heightLabel = createTextSprite(heightText, 'blue');
      heightLabel.position.set(box.min.x - 0.5, center.y, box.min.z);
      dimensionLinesRef.current.add(heightLabel);

      const summaryText = `W: ${size.x.toFixed(2)}m H: ${size.y.toFixed(2)}m D: ${size.z.toFixed(2)}m`;
      const summaryLabel = createTextSprite(summaryText, 'yellow');
      summaryLabel.position.set(center.x, box.max.y + 0.7, center.z);
      dimensionLinesRef.current.add(summaryLabel);

      return () => {
        if (dimensionLinesRef.current) dimensionLinesRef.current.clear();
        widthLineMaterial.dispose();
        depthLineMaterial.dispose();
        heightLineMaterial.dispose();
      };
    }, [showDimensions]);

    const createTextSprite = (text: string, color: string): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 1024;
      canvas.height = 256;

      context.font = '80px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(2, 0.5, 1);
      return sprite;
    };

    useImperativeHandle(ref, () => chairRef.current!);

    return (
      <group
        ref={chairRef}
        dispose={null}
        scale={[1, 1, 1]}
        position={[0, 0.9, -1]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <primitive object={combinedScene} />
      </group>
    );
  }),
  (prevProps, nextProps) =>
    prevProps.config.backStyle === nextProps.config.backStyle &&
    prevProps.config.fabricColor === nextProps.config.fabricColor &&
    prevProps.config.backFinish === nextProps.config.backFinish &&
    prevProps.config.parts.join(',') === nextProps.config.parts.join(',') &&
    prevProps.config.fabricTexture === nextProps.config.fabricTexture &&
    prevProps.config.backFinishTexture === nextProps.config.backFinishTexture &&
    prevProps.showDimensions === nextProps.showDimensions
);

export default Chair;