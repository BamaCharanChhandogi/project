import React, { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Decal, useTexture, useGLTF, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter";

const PatternMaterial = shaderMaterial(
  {
    baseTexture: null,
    patternTexture: null,
    baseColor: new THREE.Color(0xffffff),
    patternColor: new THREE.Color(0xffffff),
    textureScale: 1.0,
    patternScale: 1.0,
    textureOffset: new THREE.Vector2(0, 0),
    roughness: 0.7,
    metalness: 0.1,
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform sampler2D baseTexture;
    uniform sampler2D patternTexture;
    uniform vec3 baseColor;
    uniform vec3 patternColor;
    uniform float textureScale;
    uniform float patternScale;
    uniform vec2 textureOffset;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vec2 scaledBaseUv = vUv * textureScale + textureOffset;
      vec2 scaledPatternUv = vUv * patternScale;
      vec4 base = texture2D(baseTexture, scaledBaseUv) * vec4(baseColor, 1.0);
      vec4 pattern = texture2D(patternTexture, scaledPatternUv);
      float normalFactor = pow(abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.5);
      float blendStrength = pattern.a * normalFactor;
      vec3 blended = mix(base.rgb, base.rgb * 0.8 + pattern.rgb * patternColor * 0.8, blendStrength);
      if (blendStrength <= 0.0) {
        blended = base.rgb;
      }
      gl_FragColor = vec4(blended, 1.0);
    }
  `
);

THREE.MeshStandardMaterial.prototype.customProgramCacheKey = function () {
  return this.uuid;
};

const patternSets = {
  checker: ["/patterns/Checker.png"],
  stripes: ["/patterns/Stripes.png"],
  circles: ["/patterns/Circles.png"],
};

function HoodieModel({
  customLogos,
  customTexts,
  setCustomTexts,
  onDeleteDecal,
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
  selectedPattern,
  patternColor,
  patternScale,
}) {
  const { scene } = useGLTF("/patterns/TShirt.glb");
  const { raycaster, camera, mouse, gl: renderer, scene: fullScene } = useThree();

  const baseTextures = useTexture({
    cotton: "/Equinox.jpg",
    fleece: "/Elementary.jpg",
    knit: "/Legend.jpg",
    denim: "/Legacy.jpg",
  });

  const patternTextures = useTexture({
    ...patternSets.checker.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
    ...patternSets.stripes.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
    ...patternSets.circles.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
  });

  const meshPartOrder = ["chest", "leftSleeve", "rightSleeve", "back", "front"];
  const rotateIconTexture = useTexture("/Color.png");
  const deleteIconTexture = useTexture("/Color.png");
  const resizeIconTexture = useTexture("/Color.png");
  const moveIconTexture = useTexture("/Color.png");

  const hoodieRef = useRef();
  const [decalMeshes, setDecalMeshes] = useState([]);
  const [textTextures, setTextTextures] = useState({
    chest: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
    front: null,
  });
  const [decalVisibility, setDecalVisibility] = useState({
    chest: true,
    leftSleeve: true,
    rightSleeve: true,
    back: true,
    front: true,
  });

  const decalRefs = useRef({
    chest: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
    front: null,
  });

  const [decalPositions, setDecalPositions] = useState({
    chest: [0.01, 0.20, 0.12],
    leftSleeve: [-0.26, 0.10, -0.01], // Negative X instead of positive
    rightSleeve: [0.26, 0.10, -0.01],
    back: [0, 0.2, -0.08],
    front: [0.01, 0.20, 0.12],
  });
  const [decalRotations, setDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    leftSleeve: [-1.62, -Math.PI / 2, 0],
    rightSleeve: [-1.62, -Math.PI / 2, 0],
    back: [0, Math.PI, 0],
    front: [0.00, 0.13, 0.00],
  });

  const [decalUniformScales, setDecalUniformScales] = useState({
    chest: 0.14,
    leftSleeve: 0.155,
    rightSleeve: 0.155,
    back: 0.14,
    front: 0.14,
  });

  const [aspectRatios, setAspectRatios] = useState({
    chest: 0.15 / 0.13,
    leftSleeve: 0.16 / 0.15,
    rightSleeve: 0.16 / 0.15,
    back: 0.15 / 0.13,
    front: 0.15 / 0.13,
  });

  const [activeHandle, setActiveHandle] = useState(null);
  const [initialMouse, setInitialMouse] = useState([0, 0]);
  const [initialScale, setInitialScale] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialPosition, setInitialPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);

  const handlePositions = {
    rotate: [-1.2, 1.2, 0],
    delete: [1.2, 1.2, 0],
    resize: [1.2, -1.2, 0],
    move: [-1.2, -1.2, 0],
  };

  const meshPartMapping = {
    Front: "front",
    Left_Sleeve: "leftSleeve",
    Right_Sleeve: "rightSleeve",
    Back: "back",
  };

  const handleDecalClick = (e, position) => {
    e.stopPropagation();
    setSelectedTab(position);
  };

  useEffect(() => {
    const newTextTextures = { chest: null, leftSleeve: null, rightSleeve: null, back: null, front: null };

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
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        renderer.initTexture(texture);
        newTextTextures[position] = texture;
      }
    });

    setTextTextures(newTextTextures);
  }, [customTexts, renderer]);

  useEffect(() => {
    if (!scene) return;

    const currentTexture = baseTextures[selectedTexture];
    currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;
    currentTexture.repeat.set(textureScale, textureScale);
    currentTexture.needsUpdate = true;

    const meshMap = {
      chest: null,
      leftSleeve: null,
      rightSleeve: null,
      back: null,
      front: null,
    };

    scene.traverse((child) => {
      if (child.isMesh) {
        const partName = meshPartMapping[child.name];
        if (partName) {
          meshMap[partName] = child;
          let patternTexture = new THREE.Texture();

          if (selectedPattern) {
            const patternTexturePath = patternSets[selectedPattern][0];
            patternTexture = patternTextures[patternTexturePath] || new THREE.Texture();
            patternTexture.wrapS = patternTexture.wrapT = THREE.RepeatWrapping;
            patternTexture.repeat.set(patternScale, patternScale);
            patternTexture.needsUpdate = true;
          }

          const partColor = partColors[partName] || "#FFFFFF";
          const material = new PatternMaterial({
            baseTexture: currentTexture,
            patternTexture: patternTexture,
            baseColor: new THREE.Color(partColor),
            patternColor: new THREE.Color(patternColor),
            textureScale: textureScale,
            patternScale: patternScale,
            roughness: roughness,
            metalness: 0.1,
          });

          material.depthTest = true;
          material.depthWrite = true;
          material.polygonOffset = true;
          material.polygonOffsetFactor = -5;
          material.polygonOffsetUnits = -5;
          material.needsUpdate = true;

          child.material = material;
        }
      }
    });

    setDecalMeshes([meshMap.chest, meshMap.leftSleeve, meshMap.rightSleeve, meshMap.back, meshMap.front].filter(Boolean));
  }, [
    scene,
    baseTextures,
    selectedTexture,
    partColors,
    selectedColor,
    textureScale,
    roughness,
    selectedPattern,
    patternColor,
    patternScale,
  ]);

  useEffect(() => {
    const newVisibility = { ...decalVisibility };
    Object.keys(customLogos).forEach((position) => {
      if (customLogos[position] && !decalVisibility[position]) {
        newVisibility[position] = true;
      }
    });
    if (Object.values(newVisibility).some((v, i) => v !== Object.values(decalVisibility)[i])) {
      setDecalVisibility(newVisibility);
    }
  }, [customLogos, decalVisibility]);

  useEffect(() => {
    const newVisibility = { ...decalVisibility };
    Object.keys(customTexts).forEach((position) => {
      if (customTexts[position].show && !decalVisibility[position]) {
        newVisibility[position] = true;
      }
    });
    if (Object.values(newVisibility).some((v, i) => v !== Object.values(decalVisibility)[i])) {
      setDecalVisibility(newVisibility);
    }
  }, [customTexts, decalVisibility]);

  useEffect(() => {
    if (onDownloadGLB) {
      const exporter = new GLTFExporter();
      const sceneToExport = new THREE.Scene();
  
      const clonedHoodie = hoodieRef.current.clone(true);
  
      clonedHoodie.traverse((child) => {
        if (child.isMesh && child.material instanceof PatternMaterial) {
          const originalMaterial = new THREE.MeshPhysicalMaterial({
            map: child.material.map,
            roughness: child.material.uniforms.roughness.value,
            metalness: child.material.uniforms.metalness.value,
          });
          const canvas = document.createElement('canvas');
          canvas.width = 2048;
          canvas.height = 2048;
          const ctx = canvas.getContext('2d');
  
          const baseColorR = child.material.uniforms.baseColor.value.r * 255;
          const baseColorG = child.material.uniforms.baseColor.value.g * 255;
          const baseColorB = child.material.uniforms.baseColor.value.b * 255;
          ctx.fillStyle = `rgb(${baseColorR}, ${baseColorG}, ${baseColorB})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
  
          const baseTexture = child.material.uniforms.baseTexture.value;
          if (baseTexture.image) {
            const textureScale = child.material.uniforms.textureScale.value;
            const textureOffset = child.material.uniforms.textureOffset
              ? child.material.uniforms.textureOffset.value
              : new THREE.Vector2(0, 0);
  
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'multiply';
  
            const basePattern = ctx.createPattern(baseTexture.image, 'repeat');
            ctx.save();
            ctx.scale(textureScale, textureScale);
            ctx.translate(textureOffset.x, textureOffset.y);
            ctx.fillStyle = basePattern;
            ctx.fillRect(-textureOffset.x, -textureOffset.y,
              canvas.width / textureScale, canvas.height / textureScale);
            ctx.restore();
  
            ctx.globalCompositeOperation = 'source-over';
          }
  
          if (selectedPattern) {
            const patternTexture = child.material.uniforms.patternTexture.value;
            if (patternTexture.image) {
              const patternScale = child.material.uniforms.patternScale.value;
  
              const patternCanvas = document.createElement('canvas');
              patternCanvas.width = patternTexture.image.width;
              patternCanvas.height = patternTexture.image.height;
              const patternCtx = patternCanvas.getContext('2d');
  
              patternCtx.drawImage(patternTexture.image, 0, 0);
  
              const patternColorR = child.material.uniforms.patternColor.value.r * 255;
              const patternColorG = child.material.uniforms.patternColor.value.g * 255;
              const patternColorB = child.material.uniforms.patternColor.value.b * 255;
  
              patternCtx.globalCompositeOperation = 'source-in';
              patternCtx.fillStyle = `rgb(${patternColorR}, ${patternColorG}, ${patternColorB})`;
              patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  
              ctx.globalCompositeOperation = 'overlay';
              ctx.globalAlpha = 0.8;
  
              const pattern = ctx.createPattern(patternCanvas, 'repeat');
              ctx.save();
  
              ctx.scale(patternScale, patternScale);
              ctx.transform(1, 0, 0, -1, 0, canvas.height / patternScale);
  
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, canvas.width / patternScale, canvas.height / patternScale);
              ctx.restore();
  
              ctx.globalCompositeOperation = 'source-over'; // Corrected line
              ctx.globalAlpha = 1.0;
            }
          }
  
          const combinedTexture = new THREE.Texture(canvas);
          combinedTexture.wrapS = THREE.RepeatWrapping;
          combinedTexture.wrapT = THREE.RepeatWrapping;
          combinedTexture.needsUpdate = true;
  
          const exportMaterial = new THREE.MeshStandardMaterial({
            map: combinedTexture,
            color: 0xffffff,
            roughness: child.material.uniforms.roughness.value,
            metalness: child.material.uniforms.metalness.value,
          });
  
          child.material = exportMaterial;
        }
      });
  
      // Rest of the export logic remains unchanged
      clonedHoodie.traverse((obj) => {
        if (obj.isGroup && obj.children) {
          obj.children = obj.children.filter(child => {
            const isControl =
              (child.geometry && child.geometry.type === 'PlaneGeometry' && child.geometry.parameters.width === 0.05) ||
              (child.type === 'Line' && child.material && child.material.color && child.material.color.getHex() === 0x000000);
            return !isControl;
          });
        }
      });
  
      Object.entries(decalRefs.current).forEach(([position, ref]) => {
        if (ref && decalVisibility[position]) {
          const decalClone = ref.clone();
          if (decalClone.material && decalClone.material.map) {
            decalClone.material.map.needsUpdate = true;
            decalClone.material.depthTest = true;
            decalClone.material.transparent = true;
            decalClone.material.polygonOffset = true;
            decalClone.material.polygonOffsetFactor = -10;
          }
          clonedHoodie.add(decalClone);
        }
      });
  
      sceneToExport.add(clonedHoodie);
  
      exporter.parse(
        sceneToExport,
        (gltf) => {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          onDownloadGLB(url);
        },
        (error) => console.error("GLB Export Error:", error),
        { binary: true, embedImages: true, forceIndices: true }
      );
    }
  }, [onDownloadGLB, decalVisibility]);

  useEffect(() => {
    if (onDownloadImage) {
      const controlElements = [];
      fullScene.traverse((obj) => {
        if ((obj.isLine || (obj.isMesh && obj.geometry &&
          obj.geometry.type === 'PlaneGeometry' &&
          obj.geometry.parameters.width === 0.05))) {
          controlElements.push(obj);
          obj.visible = false;
        }
      });

      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));

      controlElements.forEach(obj => {
        obj.visible = true;
      });
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

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
      if (customTexts[location].show) {
        setCustomTexts((prev) => ({
          ...prev,
          [location]: { ...prev[location], text: "", show: false },
        }));
      }
      if (onDeleteDecal) {
        onDeleteDecal(location);
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
    <group ref={hoodieRef} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={[2, 2, 2]}>
      <primitive object={scene} />
      {decalMeshes.map((mesh, index) => {
        if (!mesh) return null;

        const decalConfigs = [
          { position: "front", meshName: "Front", side: THREE.FrontSide },
          { position: "leftSleeve", meshName: "Left_Sleeve", side: THREE.DoubleSide },
          { position: "rightSleeve", meshName: "Right_Sleeve", side: THREE.FrontSide },
          { position: "back", meshName: "Back", side: THREE.BasicDepthPacking },
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
                  polygonOffsetFactor={
                    meshPosition === "chest" ? -20 :
                    meshPosition === "leftSleeve" ? -22 :
                    meshPosition === "rightSleeve" ? -22 :
                    meshPosition === "back" ? -24 :
                    meshPosition === "front" ? -26 : -20
                  }
                  depthTest={true}
                  depthWrite={true}
                  renderOrder={isSelected ? 10 : 5}
                  onClick={(e) => handleDecalClick(e, meshPosition)}
                  material={
                    new THREE.MeshStandardMaterial({
                      map: textureToApply,
                      transparent: true,
                      opacity: 1.0,
                      side: sideProperty,
                      depthWrite: true,
                      depthTest: true,
                      depthFunc: THREE.LessEqualDepth,
                      polygonOffset: true,
                      polygonOffsetFactor: (
                        meshPosition === "chest" ? -20 :
                        meshPosition === "leftSleeve" ? -22 :
                        meshPosition === "rightSleeve" ? -22 :
                        meshPosition === "back" ? -24 :
                        meshPosition === "front" ? -26 : -20
                      ),
                    })
                  }
                />
              </mesh>

              {isSelected && (
                <group position={position} rotation={new THREE.Euler(...rotation)}>
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
  );
}

export default HoodieModel;