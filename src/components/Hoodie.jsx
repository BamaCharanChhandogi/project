import React, { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Decal, useTexture, useGLTF, Float } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter";

function HoodieModel({
  customText = "Sample Text",
  showText = true,
  textStyle = "classic",
  textShape = "rectangle",
  textColor = "#000000",
  backgroundColor = "rgba(255, 255, 255, 0.8)",
  fontSize = 60,
  onDownloadImage,
  onDownloadGLB,
  controlsRef,
  partColors,
  selectedTab, 
  selectedTexture,
  textureScale,
  roughness,
  selectedColor,
  onDownloadGLBTrigger,
  customLogos
}) {
  const { scene } = useGLTF("/Hoodie/newUI/bama44444.glb");
  const defaultLogoTexture = useTexture("/Hoodie/logoPrint.jpeg");
  const { raycaster, camera, mouse, gl: renderer, scene: fullScene } = useThree();

  const textures = useTexture({
    cotton: "/Equinox.jpg",
    fleece: "/Elementary.jpg",
    knit: "/Legend.jpg",
    denim: "/Legacy.jpg",
    leather: "/York Plaid.jpg",
  });

  // Load icon textures for all four handles
  const rotateIconTexture = useTexture("/Color.png"); // Replace with your rotate icon path
  const deleteIconTexture = useTexture("/Color.png"); // Replace with your delete icon path
  const resizeIconTexture = useTexture("/Color.png"); // Replace with your resize icon path
  const moveIconTexture = useTexture("/Color.png"); // Replace with your move icon path

  const hoodieRef = useRef();
  const [availableMeshes, setAvailableMeshes] = useState([]);
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [textTexture, setTextTexture] = useState(null);
  const [decalVisibility, setDecalVisibility] = useState({
    chest: true,
    arms: true,
    back: true,
  });

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

  const [activeHandle, setActiveHandle] = useState(null);
  const [initialMouse, setInitialMouse] = useState([0, 0]);
  const [initialScale, setInitialScale] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialPosition, setInitialPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle positions updated to place rotate at top-left
  const handlePositions = {
    rotate: [-1.2, 1.2, 0], // Top-left for rotate
    delete: [1.2, 1.2, 0], // Top-right for delete
    resize: [1.2, -1.2, 0], // Bottom-right for resize
    move: [-1.2, -1.2, 0], // Bottom-left for move
  };
  const meshPartMapping = {
    "Main001": "chest",
    "Arms001": "arms",
    "Strips001": "back"
  };

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
      const textHeight = fontSize;
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
    currentTexture.repeat.set(textureScale, textureScale);
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
        // Determine which part this mesh belongs to
        const partName = meshPartMapping[child.name];
        // Get the color for this specific part, or use a default color
        const partColor = partName && partColors[partName] ? partColors[partName] : "#FFFFFF";
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness,
          metalness: metalness,
          color: new THREE.Color(partColor),
          side: THREE.DoubleSide,
        });
        child.material = material;
        child.material.needsUpdate = true;

        if (child.name === "Main005") {
          meshMap.chest = child;
        } else if (child.name === "Arms002") {
          meshMap.arms = child;
        } else if (child.name === "Main001") {
          meshMap.back = child;
        }
      }
    });

    setAvailableMeshes(meshList.map((mesh) => mesh.name));
    setDecalMeshes([meshMap.chest, meshMap.arms, meshMap.back].filter(Boolean));
  }, [scene, selectedTexture,partColors, selectedColor, textureScale, roughness, metalness]);

  useEffect(() => {
    if (onDownloadImage) {
      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  useEffect(() => {
    if (onDownloadGLBTrigger && hoodieRef.current) {
      const exporter = new GLTFExporter();
      const sceneToExport = new THREE.Scene();
      sceneToExport.add(hoodieRef.current.clone());

      exporter.parse(
        sceneToExport,
        (gltf) => {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          onDownloadGLBTrigger(URL.createObjectURL(blob));
        },
        (error) => console.error("GLB Export Error:", error),
        { binary: true }
      );
    }
  }, [onDownloadGLBTrigger]);

  const handlePointerDown = (event, handle, location) => {
    event.stopPropagation();
    controlsRef.current.enabled = false;
    setActiveHandle(handle);
    setInitialMouse([event.clientX, event.clientY]);
    setInitialScale(decalUniformScales[location]);
    setInitialRotation(decalRotations[location][2]);
    setInitialPosition([...decalPositions[location]]);
    setIsDragging(true);

    // Handle delete immediately on pointer down
    if (handle === "delete") {
      setDecalVisibility((prev) => ({
        ...prev,
        [location]: false,
      }));
      setActiveHandle(null);
      setIsDragging(false);
      controlsRef.current.enabled = true;
    }
  };

  const handlePointerMove = (event) => {
    if (!activeHandle || !isDragging) return;

    const deltaX = (event.clientX - initialMouse[0]) * 0.005;
    const deltaY = (event.clientY - initialMouse[1]) * 0.005;

    if (activeHandle === "rotate") {
      const rotationChange = deltaX;
      const newRotZ = initialRotation + rotationChange;
      setDecalRotations((prev) => ({
        ...prev,
        [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], newRotZ],
      }));
    } else if (activeHandle === "move") {
      const newPosX = initialPosition[0] + deltaX;
      const newPosY = initialPosition[1] - deltaY;
      setDecalPositions((prev) => ({
        ...prev,
        [selectedTab]: [newPosX, newPosY, prev[selectedTab][2]],
      }));
    } else if (activeHandle === "resize") {
      const scaleDelta = deltaX;
      const newScale = Math.max(0.05, initialScale + scaleDelta);
      setDecalUniformScales((prev) => ({
        ...prev,
        [selectedTab]: newScale,
      }));
    }
  };

  const handlePointerUp = () => {
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
    setActiveHandle(null);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (event) => {
      if (isDragging) {
        handlePointerMove(event);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handlePointerUp();
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [isDragging, activeHandle, initialMouse, initialScale, initialRotation, initialPosition]);

  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1.5}>
      <group ref={hoodieRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <primitive object={scene} />
        {decalMeshes.map((mesh, index) => {
  if (!mesh) return null;

  let textureToApply = defaultLogoTexture;
  let position = [0, 0, 0];
  let rotation = [0, 0, 0];
  let scale = [0.15, 0.13, 1];
  let meshPosition = "";
  let sideProperty = THREE.FrontSide; // Default side property

  if (mesh.name === "Main005") {
    textureToApply = showText && textTexture ? textTexture : customLogos.chest || defaultLogoTexture;
    position = decalPositions.chest;
    rotation = decalRotations.chest;
    const uniformScale = decalUniformScales.chest;
    scale = [uniformScale * aspectRatios.chest, uniformScale, 1];
    meshPosition = "chest";
    sideProperty = THREE.FrontSide; // Only show on front side for chest
  } else if (mesh.name === "Arms002") {
    textureToApply = showText && textTexture ? textTexture : customLogos.arms || defaultLogoTexture;
    position = decalPositions.arms;
    rotation = decalRotations.arms;
    const uniformScale = decalUniformScales.arms;
    scale = [uniformScale * aspectRatios.arms, uniformScale, 1];
    meshPosition = "arms";
    // Arms might need special handling depending on your model
    sideProperty = THREE.FrontSide;
  } else if (mesh.name === "Main001") {
    textureToApply = showText && textTexture ? textTexture : customLogos.back || defaultLogoTexture;
    position = decalPositions.back;
    rotation = decalRotations.back;
    const uniformScale = decalUniformScales.back;
    scale = [uniformScale * aspectRatios.back, uniformScale, 1];
    meshPosition = "back";
    sideProperty = THREE.BackSide; // Only show on back side for back
  }

  const isSelected = meshPosition === selectedTab;
  const isVisible = decalVisibility[meshPosition];

  if (!isVisible) return null;

  return (
    <group key={`${mesh.name}-${index}`}>
      <mesh geometry={mesh.geometry}>
        <Decal
          position={position}
          rotation={new THREE.Euler(...rotation)}
          scale={scale}
          map={textureToApply}
          debug={debug}
          polygonOffset={true}
          polygonOffsetFactor={-10}
          depthTest={true}
          depthWrite={true}
          renderOrder={2}
          material={new THREE.MeshStandardMaterial({
            map: textureToApply,
            transparent: true,
            opacity: 1.0,
            side: sideProperty,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -10
          })}
        />
      </mesh>

              {isSelected && (
                <group position={position} rotation={new THREE.Euler(...rotation)}>
                  <line>
                    <bufferGeometry attach="geometry">
                      <float32BufferAttribute
                        attach="attributes-position"
                        array={new Float32Array([
                          -scale[0], -scale[1], 0.006,
                          scale[0], -scale[1], 0.006,
                          scale[0], scale[1], 0.006,
                          -scale[0], scale[1], 0.006,
                          -scale[0], -scale[1], 0.006,
                        ])}
                        count={5}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#000000" dashSize={0.05} gapSize={0.05} />
                  </line>

                  {Object.entries(handlePositions).map(([handle, pos]) => {
                    const scaledPos = [pos[0] * scale[0], pos[1] * scale[1], pos[2] + 0.01];

                    return (
                      <group key={handle}>
                        <mesh
                          position={scaledPos}
                          onPointerDown={(e) => handlePointerDown(e, handle, meshPosition)}
                        >
                          <planeGeometry args={[0.05, 0.05]} />
                          <meshBasicMaterial
                            map={
                              handle === "rotate"
                                ? rotateIconTexture
                                : handle === "delete"
                                ? deleteIconTexture
                                : handle === "resize"
                                ? resizeIconTexture
                                : moveIconTexture
                            }
                            transparent
                            opacity={1}
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                      </group>
                    );
                  })}
                </group>
              )}
            </group>
          );
        })}
      </group>
    </Float>
  );
}

export default HoodieModel;