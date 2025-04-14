import React, { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Decal, useTexture, useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter";

function HoodieModel({
  customLogos,
  customTexts,
  onDownloadImage,
  onDownloadGLB,
  controlsRef,
  partColors,
  selectedTab,
  setSelectedTab,
  selectedTexture,
  textureScale,
  roughness,
  selectedColor,
  showAreasOnGarment,
}) {
  const { scene } = useGLTF("/Hoodie/newUI/bama44444.glb");
  const { raycaster, camera, mouse, gl: renderer, scene: fullScene } = useThree();

  const textures = useTexture({
    cotton: "/Equinox.jpg",
    fleece: "/Elementary.jpg",
    knit: "/Legend.jpg",
    denim: "/Legacy.jpg",
    leather: "/York Plaid.jpg",
  });

  // Load actual icon textures for toolbar controls (replace placeholders with real assets)
  const rotateIconTexture = useTexture("/Color.png"); // Replace with actual rotate icon
  const deleteIconTexture = useTexture("/Color.png"); // Replace with actual delete icon
  const resizeIconTexture = useTexture("/Color.png"); // Replace with actual resize icon
  const moveIconTexture = useTexture("/Color.png"); // Replace with actual move icon

  const hoodieRef = useRef();
  const [availableMeshes, setAvailableMeshes] = useState([]);
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [textTextures, setTextTextures] = useState({
    chest: null,
    arms: null,
    back: null,
    front: null,
  });
  const [decalVisibility, setDecalVisibility] = useState({
    chest: true,
    arms: true,
    back: true,
    front: true,
  });

  // Store refs to decal groups for raycasting
  const decalRefs = useRef({
    chest: null,
    arms: null,
    back: null,
    front: null,
  });

  const [decalPositions, setDecalPositions] = useState({
    chest: [0.01, 0.20, 0.10],
    arms: [0.26, 0.10, -0.03],
    back: [0, 0.2, -0.1],
    front: [0.01, 0.20, 0.10],
  });

  const [decalRotations, setDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    arms: [-1.62, Math.PI / 2, 0],
    back: [0, Math.PI, 0],
    front: [0.00, 0.13, 0.00],
  });

  const [decalUniformScales, setDecalUniformScales] = useState({
    chest: 0.14,
    arms: 0.155,
    back: 0.14,
    front: 0.14,
  });

  const [aspectRatios, setAspectRatios] = useState({
    chest: 0.15 / 0.13,
    arms: 0.16 / 0.15,
    back: 0.15 / 0.13,
    front: 0.15 / 0.13,
  });

  const [activeHandle, setActiveHandle] = useState(null);
  const [initialMouse, setInitialMouse] = useState([0, 0]);
  const [initialScale, setInitialScale] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialPosition, setInitialPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);

  // Define toolbar handle positions
  const handlePositions = {
    rotate: [-1.2, 1.2, 0], // Top-left
    delete: [1.2, 1.2, 0], // Top-right
    resize: [1.2, -1.2, 0], // Bottom-right
    move: [-1.2, -1.2, 0], // Bottom-left
  };

  const meshPartMapping = {
    Main001: "front",
    Arms001: "arms",
    Strips001: "back",
    Main005: "chest",
    Arms002: "arms",
  };

  // Handle clicking on a decal to show toolbar
  const handleDecalClick = (e, position) => {
    e.stopPropagation();
    setSelectedTab(position); // Select the clicked decal to show its toolbar
  };

  // Generate text textures for each position
  useEffect(() => {
    const newTextTextures = { chest: null, arms: null, back: null, front: null };

    Object.keys(customTexts).forEach((position) => {
      const { text, show, color, background, fontSize, style, shape } = customTexts[position];

      if (text && show) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const styles = {
          classic: {
            font: `${fontSize}px Arial`,
            color,
            shadow: { blur: 4, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.3)" },
          },
          bold: {
            font: `bold ${fontSize}px Helvetica`,
            color,
            shadow: { blur: 6, offsetX: 3, offsetY: 3, color: "rgba(0, 0, 0, 0.5)" },
          },
          fancy: {
            font: `italic ${fontSize}px "Times New Roman"`,
            color,
            shadow: { blur: 3, offsetX: 1, offsetY: 1, color: "rgba(255, 0, 0, 0.3)" },
          },
          modern: {
            font: `bold ${fontSize}px sans-serif`,
            color,
            shadow: { blur: 5, offsetX: 2, offsetY: 2, color: "rgba(0, 0, 0, 0.4)" },
          },
        };
        const selectedStyle = styles[style] || styles.classic;

        ctx.font = selectedStyle.font;
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2;
        const padding = Math.max(textWidth, textHeight) * 0.2;
        const totalWidth = textWidth + 2 * padding;
        const totalHeight = textHeight + 2 * padding;

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = background;
        if (shape === "circle") {
          ctx.beginPath();
          ctx.arc(totalWidth / 2, totalHeight / 2, Math.min(totalWidth, totalHeight) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "oval") {
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
        ctx.fillText(text, totalWidth / 2, totalHeight / 2);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        renderer.initTexture(texture);
        newTextTextures[position] = texture;
      }
    });

    setTextTextures(newTextTextures);
  }, [customTexts, renderer]);

  // Update meshes and materials
  useEffect(() => {
    if (!scene) return;

    const currentTexture = textures[selectedTexture];
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;
    currentTexture.repeat.set(textureScale, textureScale);
    currentTexture.needsUpdate = true;

    const meshList = [];
    const meshMap = {
      chest: null,
      arms: null,
      back: null,
      front: null,
    };

    scene.traverse((child) => {
      if (child.isMesh) {
        meshList.push(child);
        const partName = meshPartMapping[child.name];
        const partColor = partName && partColors[partName] ? partColors[partName] : "#FFFFFF";
        const material = new THREE.MeshStandardMaterial({
          map: currentTexture,
          roughness: roughness,
          metalness: 0.1,
          color: new THREE.Color(partColor),
          side: THREE.DoubleSide,
        });
        child.material = material;
        child.material.needsUpdate = true;

        if (child.name === "Main005") {
          meshMap.chest = child;
          meshMap.front = child; // Main005 handles both chest and front
        } else if (child.name === "Arms002") {
          meshMap.arms = child;
        } else if (child.name === "Main001") {
          meshMap.back = child;
        }
      }
    });

    setAvailableMeshes(meshList.map((mesh) => mesh.name));
    setDecalMeshes([meshMap.chest, meshMap.arms, meshMap.back, meshMap.front].filter(Boolean));
  }, [scene, selectedTexture, partColors, selectedColor, textureScale, roughness]);

  // Handle image download
  useEffect(() => {
    if (onDownloadImage) {
      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  // Handle GLB download
  useEffect(() => {
    if (onDownloadGLB) {
      const exporter = new GLTFExporter();
      const sceneToExport = new THREE.Scene();
      sceneToExport.add(hoodieRef.current.clone());

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

  // Toolbar interaction handlers
  const handlePointerDown = (event, handle, location) => {
    event.stopPropagation();
    controlsRef.current.enabled = false;
    setActiveHandle(handle);
    setInitialMouse([event.clientX, event.clientY]);
    setInitialScale(decalUniformScales[location]);
    setInitialRotation(decalRotations[location][2]);
    setInitialPosition([...decalPositions[location]]);
    setIsDragging(true);

    if (handle === "delete") {
      setDecalVisibility((prev) => ({
        ...prev,
        [location]: false,
      }));
      // Also clear text for this position to prevent re-rendering
      if (customTexts[location].show) {
        setCustomTexts((prev) => ({
          ...prev,
          [location]: { ...prev[location], text: "", show: false },
        }));
      }
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

          const decalConfigs = [
            { position: "chest", meshName: "Main005", side: THREE.FrontSide },
            { position: "front", meshName: "Main005", side: THREE.FrontSide },
            { position: "arms", meshName: "Arms002", side: THREE.FrontSide },
            { position: "back", meshName: "Main001", side: THREE.BackSide },
          ];

          return decalConfigs.map((config) => {
            if (mesh.name !== config.meshName) return null;

            const { position: meshPosition, side: sideProperty } = config;
            const isTextDecal = customTexts[meshPosition].show && textTextures[meshPosition];
            const textureToApply = isTextDecal ? textTextures[meshPosition] : customLogos[meshPosition];
            const isVisible = decalVisibility[meshPosition];
            const isSelected = meshPosition === selectedTab;

            if (!textureToApply || !isVisible) return null;

            const position = decalPositions[meshPosition];
            const rotation = decalRotations[meshPosition];
            const uniformScale = decalUniformScales[meshPosition];
            const fontSizeAdjustment = isTextDecal ? customTexts[meshPosition].fontSize / 60 : 1;
            const scale = [
              uniformScale * aspectRatios[meshPosition] * fontSizeAdjustment,
              uniformScale * fontSizeAdjustment,
              1,
            ];

            return (
              <group key={`${mesh.name}-${meshPosition}`}>
                <mesh geometry={mesh.geometry}>
                  <Decal
                    ref={(ref) => (decalRefs.current[meshPosition] = ref)}
                    position={position}
                    rotation={new THREE.Euler(...rotation)}
                    scale={scale}
                    map={textureToApply}
                    debug={false}
                    polygonOffset={true}
                    polygonOffsetFactor={-10}
                    depthTest={true}
                    depthWrite={true}
                    renderOrder={2}
                    onClick={(e) => handleDecalClick(e, meshPosition)}
                    material={
                      new THREE.MeshStandardMaterial({
                        map: textureToApply,
                        transparent: true,
                        opacity: 1.0,
                        side: sideProperty,
                        depthWrite: true,
                        polygonOffset: true,
                        polygonOffsetFactor: -10,
                      })
                    }
                  />
                </mesh>

                {/* Toolbar: Show controls when decal is selected */}
                {isSelected && (
                  <group position={position} rotation={new THREE.Euler(...rotation)}>
                    {/* Outline to highlight selected decal */}
                    <line>
                      <bufferGeometry attach="geometry">
                        <float32BufferAttribute
                          attach="attributes-position"
                          array={new Float32Array([
                            -scale[0],
                            -scale[1],
                            0.006,
                            scale[0],
                            -scale[1],
                            0.006,
                            scale[0],
                            scale[1],
                            0.006,
                            -scale[0],
                            scale[1],
                            0.006,
                            -scale[0],
                            -scale[1],
                            0.006,
                          ])}
                          count={5}
                          itemSize={3}
                        />
                      </bufferGeometry>
                      <lineBasicMaterial attach="material" color="#000000" dashSize={0.05} gapSize={0.05} />
                    </line>

                    {/* Toolbar controls: Rotate, Delete, Resize, Move */}
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
          });
        })}
      </group>
    </Float>
  );
}

export default HoodieModel;