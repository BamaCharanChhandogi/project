import React, { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import {
  Decal,
  useTexture,
  useGLTF,
  Float,
} from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter";

function HoodieModel({
  customLogos,
  customText = "Sample Text",
  showText = true,
  textStyle = "classic",
  textShape = "rectangle",
  textColor = "#000000", // New prop
  backgroundColor = "rgba(255, 255, 255, 0.8)", // New prop
  fontSize = 60, // New prop
  onDownloadImage,
  onDownloadGLB,
  controlsRef,
  selectedColor,
  selectedTexture,
  selectedTab,
  textureScale, // New prop
  roughness, // New prop
}) {
  const { scene } = useGLTF("/Hoodie/newUI/newbama1.glb");
  const defaultLogoTexture = useTexture("/Hoodie/logoPrint.jpeg");
  const { raycaster, camera, mouse, gl: renderer, scene: fullScene } = useThree();

  const textures = useTexture({
    cotton: "/Hoodie/Alpaca_BaseColor.png",
    fleece: "/Hoodie/Fabric Upholstery Pyramids_diffuse.png",
    knit: "/Hoodie/Fabric_Normal.jpg",
    denim: "/Hoodie/FabricUpholsteryBrightAnglePattern001_COL_VAR1_1K.jpg",
    leather: "/Hoodie/Floral.jpg",
  });

  const hoodieRef = useRef();
  const [availableMeshes, setAvailableMeshes] = useState([]);
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [textTexture, setTextTexture] = useState(null);

  const [decalPositions, setDecalPositions] = useState({
    chest: [0.01, 0.20, 0.10],
    arms: [0.26, 0.10, -0.03],
    back: [0, 0.2, -0.1],
  });

  const [decalRotations, setDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    arms: [-1.62, Math.PI / 2, 0],
    back: [0, Math.PI, 0],
  });

  const [decalUniformScales, setDecalUniformScales] = useState({
    chest: 0.14,
    arms: 0.155,
    back: 0.14,
  });

  const [aspectRatios, setAspectRatios] = useState({
    chest: 0.15 / 0.13,
    arms: 0.16 / 0.15,
    back: 0.15 / 0.13,
  });

  const { posX, posY, posZ, rotX, rotY, rotZ, uniformScale, debug, metalness } = useControls(
    "Decal Controls",
    {
      [`${selectedTab} posX`]: {
        value: decalPositions[selectedTab][0],
        min: -2,
        max: 2,
        step: 0.01,
        onChange: (value) =>
          setDecalPositions((prev) => ({
            ...prev,
            [selectedTab]: [value, prev[selectedTab][1], prev[selectedTab][2]],
          })),
      },
      [`${selectedTab} posY`]: {
        value: decalPositions[selectedTab][1],
        min: -2,
        max: 2,
        step: 0.01,
        onChange: (value) =>
          setDecalPositions((prev) => ({
            ...prev,
            [selectedTab]: [prev[selectedTab][0], value, prev[selectedTab][2]],
          })),
      },
      [`${selectedTab} posZ`]: {
        value: decalPositions[selectedTab][2],
        min: -1,
        max: 1,
        step: 0.01,
        onChange: (value) =>
          setDecalPositions((prev) => ({
            ...prev,
            [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], value],
          })),
      },
      [`${selectedTab} rotX`]: {
        value: decalRotations[selectedTab][0],
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        onChange: (value) =>
          setDecalRotations((prev) => ({
            ...prev,
            [selectedTab]: [value, prev[selectedTab][1], prev[selectedTab][2]],
          })),
      },
      [`${selectedTab} rotY`]: {
        value: decalRotations[selectedTab][1],
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        onChange: (value) =>
          setDecalRotations((prev) => ({
            ...prev,
            [selectedTab]: [prev[selectedTab][0], value, prev[selectedTab][2]],
          })),
      },
      [`${selectedTab} rotZ`]: {
        value: decalRotations[selectedTab][2],
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        onChange: (value) =>
          setDecalRotations((prev) => ({
            ...prev,
            [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], value],
          })),
      },
      [`${selectedTab} uniformScale`]: {
        value: decalUniformScales[selectedTab],
        min: 0.05,
        max: 2,
        step: 0.01,
        onChange: (value) =>
          setDecalUniformScales((prev) => ({
            ...prev,
            [selectedTab]: value,
          })),
      },
      debug: { value: false },
      metalness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    },
    [selectedTab]
  );

  useEffect(() => {
    if (customText && showText) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const styles = {
        classic: { font: `${fontSize}px Arial`, color: textColor, shadow: { blur: 4, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.3)" } },
        bold: { font: `bold ${fontSize}px Helvetica`, color: textColor, shadow: { blur: 6, offsetX: 3, offsetY: 3, color: "rgba(0, 0, 0, 0.5)" } },
        fancy: { font: `italic ${fontSize}px Times New Roman`, color: textColor, shadow: { blur: 3, offsetX: 1, offsetY: 1, color: "rgba(255, 0, 0, 0.3)" } },
        modern: { font: `bold ${fontSize}px sans-serif`, color: textColor, shadow: { blur: 5, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.4)" } },
      };
      const selectedStyle = styles[textStyle] || styles.classic;

      ctx.font = selectedStyle.font;
      const metrics = ctx.measureText(customText);
      const textWidth = metrics.width;
      const textHeight = fontSize; // Use fontSize directly
      const padding = Math.max(textWidth, textHeight) * 0.2;
      const totalWidth = textWidth + 2 * padding;
      const totalHeight = textHeight + 2 * padding;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = backgroundColor;
      if (textShape === "circle") {
        ctx.beginPath();
        ctx.arc(totalWidth / 2, totalHeight / 2, Math.min(totalWidth, totalHeight) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (textShape === "oval") {
        ctx.save();
        ctx.scale(1.5, 1);
        ctx.beginPath();
        ctx.arc(totalWidth / 2 / 1.5, totalHeight / 2, Math.min(totalWidth, totalHeight) / 2, 0, Math.PI * 2);
        ctx.restore();
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, totalWidth, totalHeight);
      }

      ctx.shadowColor = selectedStyle.shadow.color;
      ctx.shadowBlur = selectedStyle.shadow.blur;
      ctx.shadowOffsetX = selectedStyle.shadow.offsetX;
      ctx.shadowOffsetY = selectedStyle.shadow.offsetY;

      ctx.fillStyle = selectedStyle.color;
      ctx.font = selectedStyle.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(customText, totalWidth / 2, totalHeight / 2);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      renderer.initTexture(texture);
      setTextTexture(texture);
    } else {
      setTextTexture(null);
    }
  }, [customText, showText, textStyle, textShape, textColor, backgroundColor, fontSize, renderer]);

  useEffect(() => {
    if (!scene) return;

    const currentTexture = textures[selectedTexture];
    currentTexture.repeat.set(textureScale, textureScale); // Apply texture scale
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;

    const meshList = [];
    const meshMap = {
      chest: null,
      arms: null,
      back: null,
    };

    scene.traverse((child) => {
      if (child.isMesh) {
        meshList.push(child);
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness, // Apply roughness
          metalness: metalness,
          color: new THREE.Color(selectedColor),
          side: THREE.DoubleSide,
        });
        child.material = material;
        child.material.needsUpdate = true;

        if (child.name === "Main004") {
          meshMap.chest = child;
        } else if (child.name === "Arms002") {
          meshMap.arms = child;
        } else if (child.name === "Main003") {
          meshMap.back = child;
        }
      }
    });

    setAvailableMeshes(meshList.map((mesh) => mesh.name));
    setDecalMeshes([meshMap.chest, meshMap.arms, meshMap.back].filter(Boolean));
  }, [scene, selectedTexture, selectedColor, textureScale, roughness, metalness]);

  useEffect(() => {
    if (onDownloadImage) {
      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  useEffect(() => {
    if (onDownloadGLB && hoodieRef.current) {
      const exporter = new GLTFExporter();
      const sceneToExport = hoodieRef.current.clone();

      exporter.parse(
        sceneToExport,
        (gltf) => {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          onDownloadGLB(URL.createObjectURL(blob));
        },
        (error) => console.error("GLB Export Error:", error),
        { binary: true }
      );
    }
  }, [onDownloadGLB]);

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={hoodieRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <primitive object={scene} />
        {decalMeshes.map((mesh, index) => {
          let textureToApply = defaultLogoTexture;
          let position = [0, 0, 0];
          let rotation = [0, 0, 0];
          let scale = [0.15, 0.13, 1];

          if (mesh === decalMeshes[0]) { // Chest
            textureToApply = showText && textTexture ? textTexture : (customLogos.chest || defaultLogoTexture);
            position = decalPositions.chest;
            rotation = decalRotations.chest;
            const uniformScale = decalUniformScales.chest;
            scale = [uniformScale * aspectRatios.chest, uniformScale, 1];
          } else if (mesh === decalMeshes[1]) { // Arms
            textureToApply = showText && textTexture ? textTexture : (customLogos.arms || defaultLogoTexture);
            position = decalPositions.arms;
            rotation = decalRotations.arms;
            const uniformScale = decalUniformScales.arms;
            scale = [uniformScale * aspectRatios.arms, uniformScale, 1];
          } else if (mesh === decalMeshes[2]) { // Back
            textureToApply = showText && textTexture ? textTexture : (customLogos.back || defaultLogoTexture);
            position = decalPositions.back;
            rotation = decalRotations.back;
            const uniformScale = decalUniformScales.back;
            scale = [uniformScale * aspectRatios.back, uniformScale, 1];
          }

          return (
            <mesh key={index} geometry={mesh.geometry}>
              <Decal
                position={position}
                rotation={new THREE.Euler(...rotation)}
                scale={scale}
                map={textureToApply}
                debug={debug}
                polygonOffset
                polygonOffsetFactor={-50}
                transparent
                depthTest={false}
                renderOrder={2}
                material={new THREE.MeshBasicMaterial({
                  map: textureToApply,
                  opacity: 1.0,
                  blending: THREE.NormalBlending,
                  side: THREE.FrontSide,
                })}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

export default HoodieModel;