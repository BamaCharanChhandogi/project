import React, { useRef, Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Decal,
  useTexture,
  useGLTF,
  ContactShadows,
  Environment,
  Float,
  PerspectiveCamera,
} from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter";
import { 
  Palette, 
  Droplet, 
  Image as ImageIcon, 
  BadgeHelp, 
  Text, 
  Sun, 
  ShoppingCart,
  Save,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
function HoodieModel({
  customLogo,
  customText,
  showText,
  textStyle,
  textShape,
  onDownloadImage,
  onDownloadGLB,
  controlsRef,
  selectedColor,
  selectedTexture,
}) {
  const { scene } = useGLTF("/Hoodie/tggrg.glb");
  const defaultLogoTexture = useTexture("/Hoodie/logoPrint.jpeg");
  const logoTexture = customLogo || defaultLogoTexture;
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
  const [selectedMeshName, setSelectedMeshName] = useState("Main003");
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [decalPosition, setDecalPosition] = useState([0, 0, 0.1]);
  const [textTexture, setTextTexture] = useState(null);

  const { 
    posX, posY, posZ, rotX, rotY, rotZ, scaleX, scaleY, debug, roughness, metalness, textureScale, enableMultiMeshDecal 
  } = useControls("Decal Controls", {
    meshName: { options: availableMeshes, value: selectedMeshName, onChange: (value) => setSelectedMeshName(value) },
    posX: { value: 0, min: -2, max: 2, step: 0.01 },
    posY: { value: 0, min: -2, max: 2, step: 0.01 },
    posZ: { value: 0.1, min: -1, max: 1, step: 0.01 },
    rotX: { value: 0.04, min: 0, max: Math.PI * 2, step: 0.01 },
    rotY: { value: 0.01, min: 0, max: Math.PI * 2, step: 0.01 },
    rotZ: { value: 0.0, min: 0, max: Math.PI * 2, step: 0.01 },
    scaleX: { value: 0.1, min: 0.1, max: 2, step: 0.01 },
    scaleY: { value: 0.11, min: 0.1, max: 2, step: 0.01 },
    debug: { value: false },
    roughness: { value: 0.7, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    textureScale: { value: 1, min: 0.1, max: 10, step: 0.1 },
    enableMultiMeshDecal: { value: true, label: "Enable Full Surface Decal" },
  });

  const [isDragging, setIsDragging] = useState(false);

  // Generate text texture with dynamic size, selected style, and shape
  useEffect(() => {
    if (customText && showText) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Default style settings
      const styles = {
        classic: { font: "bold 60px Arial", color: "black", shadow: { blur: 4, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.3)" } },
        bold: { font: "bold 70px Helvetica", color: "white", shadow: { blur: 6, offsetX: 3, offsetY: 3, color: "rgba(0, 0, 0, 0.5)" } },
        fancy: { font: "italic 50px Times New Roman", color: "red", shadow: { blur: 3, offsetX: 1, offsetY: 1, color: "rgba(255, 0, 0, 0.3)" } },
        modern: { font: "bold 60px sans-serif", color: "#3b82f6", shadow: { blur: 5, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.4)" } },
      };

      const selectedStyle = styles[textStyle] || styles.classic;

      // Measure text dimensions
      ctx.font = selectedStyle.font;
      const metrics = ctx.measureText(customText);
      const textWidth = metrics.width;
      const textHeight = parseInt(selectedStyle.font.match(/\d+/)[0]); // Extract font size

      // Add padding (20% of text dimensions)
      const padding = Math.max(textWidth, textHeight) * 0.2;
      const totalWidth = textWidth + 2 * padding;
      const totalHeight = textHeight + 2 * padding;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Draw shape background
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent background
      if (textShape === "circle") {
        ctx.beginPath();
        ctx.arc(totalWidth / 2, totalHeight / 2, Math.min(totalWidth, totalHeight) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (textShape === "oval") {
        ctx.save();
        ctx.scale(1.5, 1); // Stretch horizontally for oval effect
        ctx.beginPath();
        ctx.arc(totalWidth / 2 / 1.5, totalHeight / 2, Math.min(totalWidth, totalHeight) / 2, 0, Math.PI * 2);
        ctx.restore();
        ctx.fill();
      } else { // Default rectangle
        ctx.fillRect(0, 0, totalWidth, totalHeight);
      }

      // Apply shadow
      ctx.shadowColor = selectedStyle.shadow.color;
      ctx.shadowBlur = selectedStyle.shadow.blur;
      ctx.shadowOffsetX = selectedStyle.shadow.offsetX;
      ctx.shadowOffsetY = selectedStyle.shadow.offsetY;

      ctx.fillStyle = selectedStyle.color;
      ctx.font = selectedStyle.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(customText, totalWidth / 2, totalHeight / 2);

      // Clear shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      setTextTexture(texture);
    } else {
      setTextTexture(null);
    }
  }, [customText, showText, textStyle, textShape]);

  useEffect(() => {
    if (!scene) return;

    const currentTexture = textures[selectedTexture];
    currentTexture.repeat.set(textureScale, textureScale);
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;

    const meshList = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        meshList.push(child);
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness,
          metalness: metalness,
          color: new THREE.Color(selectedColor),
        });
        child.material = material;
        child.material.needsUpdate = true;
      }
    });

    setAvailableMeshes(meshList.map((mesh) => mesh.name));
    setDecalMeshes(meshList);
  }, [scene, selectedTexture, selectedColor, roughness, metalness, textureScale, textures]);

  useEffect(() => {
    const isClickOnDecal = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(decalMeshes);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const clickPosition = intersect.point;
        const decalPosVector = new THREE.Vector3(...decalPosition);
        const distance = clickPosition.distanceTo(decalPosVector);
        const threshold = Math.max(scaleX, scaleY) * 0.5;
        return distance < threshold;
      }
      return false;
    };

    const handlePointerDown = (event) => {
      if (isClickOnDecal()) {
        setIsDragging(true);
        if (controlsRef.current) controlsRef.current.enabled = false;
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };

    const handlePointerMove = (event) => {
      if (!isDragging) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(decalMeshes);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const newPosition = intersect.point.clone().add(intersect.face.normal.multiplyScalar(0.01));
        setDecalPosition([newPosition.x, newPosition.y, newPosition.z]);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [isDragging, raycaster, camera, mouse, decalMeshes, controlsRef, scaleX, scaleY, decalPosition]);

  useEffect(() => {
    if (onDownloadImage) {
      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  useEffect(() => {
    if (onDownloadGLB) {
      const exporter = new GLTFExporter();
      exporter.parse(fullScene, (gltf) => {
        const blob = new Blob([gltf], { type: "application/octet-stream" });
        onDownloadGLB(URL.createObjectURL(blob));
      }, { binary: true });
    }
  }, [onDownloadGLB, fullScene]);

  const activeTexture = showText && textTexture ? textTexture : logoTexture;

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={hoodieRef} position={[0, 0, 0]}>
        <primitive object={scene} />
        {enableMultiMeshDecal ? (
          decalMeshes.map((mesh, index) => (
            <mesh key={index} geometry={mesh.geometry}>
              <Decal
                position={decalPosition}
                rotation={[rotX, rotY, rotZ]}
                scale={[scaleX, scaleY, 1]}
                map={activeTexture}
                debug={debug}
                polygonOffset
                polygonOffsetFactor={-10}
                transparent
              />
            </mesh>
          ))
        ) : (
          decalMeshes.map(
            (mesh, index) =>
              mesh.name === selectedMeshName && (
                <mesh key={index} geometry={mesh.geometry}>
                  <Decal
                    position={decalPosition}
                    rotation={[rotX, rotY, rotZ]}
                    scale={[scaleX, scaleY, 1]}
                    map={activeTexture}
                    debug={debug}
                    polygonOffset
                    polygonOffsetFactor={-10}
                    transparent
                  />
                </mesh>
              )
          )
        )}
      </group>
    </Float>
  );
}

export default HoodieModel;