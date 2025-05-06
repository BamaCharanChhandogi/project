
import React, { useRef, useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Decal, useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Custom hook for loading textures
function useHoodieTextures() {
  const fabric017Textures = useTexture(
    {
      base: "/patterns/Fabric017_4K_Color.jpg",
      normal: "/patterns/Fabric017_4K_NormalGL.jpg",
      roughness: "/patterns/Fabric017_4K_Roughness.jpg",
    },
    (textures) => {
      Object.entries(textures).forEach(([key, texture]) => {
        if (!texture) console.error(`Failed to load fabric017 texture: ${key}`);
      });
    }
  );

  const outdoorPolyesterTextures = useTexture(
    {
      base: "/patterns/outdoor-polyester-fabric_albedo.jpg",
      normal: "/patterns/outdoor-polyester-fabric_normal-ogl.jpg",
      roughness: "/patterns/outdoor-polyester-fabric_roughness.jpg",
    },
    (textures) => {
      Object.entries(textures).forEach(([key, texture]) => {
        if (!texture) console.error(`Failed to load outdoorPolyester texture: ${key}`);
      });
    }
  );

  const polyesterTextures = useTexture(
    {
      base: "/patterns/repeat.jpg",
      normal: "/patterns/outdoor-polyester-fabric_normal-ogl.jpg",
      roughness: "/patterns/outdoor-polyester-fabric_roughness.jpg",
    },
    (textures) => {
      Object.entries(textures).forEach(([key, texture]) => {
        if (!texture) console.error(`Failed to load polyester texture: ${key}`);
      });
    }
  );

  const patternTextures = useTexture(
    {
      ...patternSets.checker.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
      ...patternSets.stripes.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
      ...patternSets.circles.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
    },
    (textures) => {
      Object.entries(textures).forEach(([key, texture]) => {
        if (!texture) console.error(`Failed to load pattern texture: ${key}`);
      });
    }
  );

  return {
    fabric017Textures,
    outdoorPolyesterTextures,
    polyesterTextures,
    patternTextures,
  };
}

// Custom hook for creating pattern material
function usePatternMaterial({
  baseTexture,
  normalTexture,
  roughnessTexture,
  patternTexture,
  baseColor,
  patternColor,
  textureScale,
  patternScale,
  textureOffset,
  roughness,
  metalness,
  patternOpacity,
}) {
  const fallbackWhiteTexture = useMemo(() => {
    const data = new Uint8Array([255, 255, 255, 255]); // white pixel
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: baseTexture || fallbackWhiteTexture,
      normalMap: normalTexture || null,
      normalScale: new THREE.Vector2(1.0, 1.0),
      color: new THREE.Color(baseColor),
      roughness: roughness ?? 0.8,
      metalness: metalness ?? 0.0,
      envMapIntensity: 0.5,
      side:THREE.DoubleSide
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.baseColor = { value: new THREE.Color(baseColor) };
      shader.uniforms.patternTexture = { value: patternTexture || null };
      shader.uniforms.patternColor = { value: new THREE.Color(patternColor) };
      shader.uniforms.patternScale = { value: patternScale };
      shader.uniforms.patternOpacity = { value: patternOpacity };
      shader.uniforms.textureScale = { value: textureScale };
      shader.uniforms.textureOffset = { value: textureOffset };

      shader.vertexShader = `
        varying vec2 vUv;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        `#include <uv_vertex>`,
        `
        #include <uv_vertex>
        vUv = uv;
        `
      );

      shader.fragmentShader = `
        uniform vec3 baseColor;
        uniform sampler2D patternTexture;
        uniform vec3 patternColor;
        uniform float patternScale;
        uniform float patternOpacity;
        uniform float textureScale;
        uniform vec2 textureOffset;
        varying vec2 vUv;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <map_fragment>`,
        `
        #include <map_fragment>
        vec2 scaledBaseUv = vUv * textureScale + textureOffset;
        vec4 baseTexel = texture2D(map, scaledBaseUv);

        vec4 base;
        if (abs(baseColor.r - 1.0) < 0.01 && abs(baseColor.g - 1.0) < 0.01 && abs(baseColor.b - 1.0) < 0.01) {
          base = baseTexel;
        } else {
          float baseLuminance = (baseTexel.r + baseTexel.g + baseTexel.b) / 3.0;
          vec3 textureDetail = baseTexel.rgb * (0.5 + 0.5 * baseLuminance);
          vec3 tintedColor = mix(textureDetail, baseColor, 0.7);
          tintedColor = clamp(tintedColor, 0.0, 1.0);
          base = vec4(tintedColor, 1.0);
        }

        vec2 scaledPatternUv = vUv * patternScale;
        vec4 patternTexel = texture2D(patternTexture, scaledPatternUv);
        vec4 pattern = vec4(patternTexel.rgb * patternColor, patternTexel.a);

        if (pattern.a > 0.1) {
          float patternBaseLuminance = (baseTexel.r + baseTexel.g + baseTexel.b) / 3.0;
          vec3 detailedPattern = pattern.rgb * (0.6 + 0.6 * patternBaseLuminance);
          float alpha = pattern.a * patternOpacity;
          diffuseColor = mix(base, vec4(detailedPattern, 1.0), alpha);
        } else {
          diffuseColor = base;
        }
        `
      );

      mat.userData.shader = shader;
    };

    return mat;
  }, [
    baseTexture,
    fallbackWhiteTexture,
    normalTexture,
    roughnessTexture,
    patternTexture,
    baseColor,
    patternColor,
    textureScale,
    patternScale,
    textureOffset,
    roughness,
    metalness,
    patternOpacity,
  ]);

  useEffect(() => {
    if (material.userData.shader) {
      material.userData.shader.uniforms.baseColor.value.set(baseColor);
      material.userData.shader.uniforms.patternTexture.value = patternTexture || null;
      material.userData.shader.uniforms.patternColor.value.set(patternColor);
      material.userData.shader.uniforms.patternScale.value = patternScale;
      material.userData.shader.uniforms.patternOpacity.value = patternOpacity;
      material.userData.shader.uniforms.textureScale.value = textureScale;
      material.userData.shader.uniforms.textureOffset.value = textureOffset;
    }
  }, [
    material,
    baseColor,
    patternTexture,
    patternColor,
    patternScale,
    patternOpacity,
    textureScale,
    textureOffset,
  ]);

  return material;
}


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
  position,
  patternOpacity,
  activeTab,
  onClearPattern,
  onPatternCleared,
  onLoaded,
}) {
  const { scene } = useGLTF("/patterns/BamaFinal.glb");
  const { raycaster, camera, gl: renderer, scene: fullScene } = useThree();

  // Load textures
  const {
    fabric017Textures,
    outdoorPolyesterTextures,
    polyesterTextures,
    patternTextures,
  } = useHoodieTextures();

  // Configure textures
  useEffect(() => {
    const textures = [
      fabric017Textures.base,
      fabric017Textures.normal,
      fabric017Textures.roughness,
      outdoorPolyesterTextures.base,
      outdoorPolyesterTextures.normal,
      outdoorPolyesterTextures.roughness,
      polyesterTextures.base,
      polyesterTextures.normal,
      polyesterTextures.roughness,
    ];

    textures.forEach((texture) => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (
          texture === fabric017Textures.normal ||
          texture === outdoorPolyesterTextures.normal ||
          texture === polyesterTextures.normal
        ) {
          texture.colorSpace = THREE.LinearSRGBColorSpace;
        }
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(textureScale, textureScale);
        texture.needsUpdate = true;
      }
    });

    Object.values(patternTextures).forEach((texture) => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(patternScale, patternScale);
        texture.needsUpdate = true;
      }
    });
  }, [textureScale, patternScale]);

  const tabToPositionMap = {
    front: "front",
    back: "back",
    "left sleeve": "leftSleeve",
    "right sleeve": "rightSleeve",
    all:"all"
  };

  const meshPartOrder = ["chest", "leftSleeve", "rightSleeve", "back", "front"];
  const rotateIconTexture = useTexture("patterns/Wastes.png");
  const deleteIconTexture = useTexture("patterns/Wastes.png");
  const resizeIconTexture = useTexture("patterns/Zooms.png");
  const moveIconTexture = useTexture("patterns/Expands.png");

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
    chest: { text: true, image: true },
    leftSleeve: { text: true, image: true },
    rightSleeve: { text: true, image: true },
    back: { text: true, image: true },
    front: { text: true, image: true },
  });
  const [selectedDecalType, setSelectedDecalType] = useState(null); // 'text' or 'image'

  const decalRefs = useRef({
    "chest-text": null,
    "chest-image": null,
    "leftSleeve-text": null,
    "leftSleeve-image": null,
    "rightSleeve-text": null,
    "rightSleeve-image": null,
    "back-text": null,
    "back-image": null,
    "front-text": null,
    "front-image": null,
  });

  const [textDecalRotations, setTextDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    leftSleeve: [-1.62, Math.PI / 2, 0],
    rightSleeve: [-1.62, Math.PI / 2, 0],
    back: [0, Math.PI, 0],
    front: [0.00, 0.13, 0.00],
  });

  const [imageDecalRotations, setImageDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    leftSleeve: [-1.62, Math.PI / 2, 0],
    rightSleeve: [-1.62, Math.PI / 2, 0],
    back: [0, Math.PI, 0],
    front: [0.00, 0.13, 0.00],
  });

  const [textDecalPositions, setTextDecalPositions] = useState({
    chest: [0.01, 0.20, 0.12],
    leftSleeve: [-0.75, 0.10, -0.03],
    rightSleeve: [0.73, 0.10, -0.02],
    back: [0, 0.2, -0.08],
    front: [0.01, 0.20, 0.12],
  });

  const [imageDecalPositions, setImageDecalPositions] = useState({
    chest: [0.01, 0.20, 0.12],
    leftSleeve: [-0.75, 0.10, -0.03],
    rightSleeve: [0.73, 0.10, -0.02],
    back: [0, 0.2, -0.08],
    front: [0.01, 0.20, 0.12],
  });

  const [textDecalUniformScales, setTextDecalUniformScales] = useState({
    chest: 0.14,
    leftSleeve: 0.155,
    rightSleeve: 0.155,
    back: 0.14,
    front: 0.14,
  });

  const [imageDecalUniformScales, setImageDecalUniformScales] = useState({
    chest: 0.14,
    leftSleeve: 0.155,
    rightSleeve: 0.155,
    back: 0.14,
    front: 0.14,
  });

  const [textDimensions, setTextDimensions] = useState({
    chest: { width: 0.15, height: 0.13 },
    leftSleeve: { width: 0.16, height: 0.15 },
    rightSleeve: { width: 0.16, height: 0.15 },
    back: { width: 0.15, height: 0.13 },
    front: { width: 0.15, height: 0.13 },
  });

  const [imageDimensions, setImageDimensions] = useState({
    chest: { width: 0.15, height: 0.13 },
    leftSleeve: { width: 0.16, height: 0.15 },
    rightSleeve: { width: 0.16, height: 0.15 },
    back: { width: 0.15, height: 0.13 },
    front: { width: 0.15, height: 0.13 },
  });

  const [textAspectRatios, setTextAspectRatios] = useState({
    chest: 1,
    leftSleeve: 1,
    rightSleeve: 1,
    back: 1,
    front: 1,
  });

  const [imageAspectRatios, setImageAspectRatios] = useState({
    chest: 1,
    leftSleeve: 1,
    rightSleeve: 1,
    back: 1,
    front: 1,
  });

  const [activeHandle, setActiveHandle] = useState(null);
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialPosition, setInitialPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, z: 0 });
  const [cursorStyle, setCursorStyle] = useState("auto");
  const [partPatterns, setPartPatterns] = useState({
    front: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
    chest: null,
  });
  const meshPartMapping = {
    Front: "front",
    Left_Sleeve: "leftSleeve",
    Right_Sleeve: "rightSleeve",
    Back: "back",
  };

  const positionToMeshMapping = {
    front: "Front",
    leftSleeve: "Left_Sleeve",
    rightSleeve: "Right_Sleeve",
    back: "Back",
  };

  const meshBounds = useRef({
    chest: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
    front: null,
  });

  // Create materials for each part
  const activePosition = activeTab ? tabToPositionMap[activeTab.toLowerCase()] : null;
  const parts = ["front", "leftSleeve", "rightSleeve", "back", "chest"];
  const materials = {};

  parts.forEach((partName) => {
    const partColor = partColors[partName] || "#FFFFFF";
  
    let baseTexture, normalTexture, roughnessTexture;
    if (selectedTexture === "fabric017") {
      baseTexture = fabric017Textures.base;
      normalTexture = fabric017Textures.normal;
      roughnessTexture = fabric017Textures.roughness;
    } else if (selectedTexture === "outdoorPolyester") {
      baseTexture = outdoorPolyesterTextures.base;
      normalTexture = outdoorPolyesterTextures.normal;
      roughnessTexture = outdoorPolyesterTextures.roughness;
    } else if (selectedTexture === "polyester") {
      baseTexture = polyesterTextures.base;
      normalTexture = polyesterTextures.normal;
      roughnessTexture = polyesterTextures.roughness;
    }
  
    let patternTexture = null;
    let currPatternColor = "#FFFFFF";
    let currPatternScale = patternScale;
    let currPatternOpacity = patternOpacity;
  
    const partPattern = partPatterns[partName];
    if (partPattern) {
      const patternTexturePath = patternSets[partPattern.pattern][0];
      patternTexture = patternTextures[patternTexturePath];
      currPatternColor = partPattern.color;
      currPatternScale = partPattern.scale;
      currPatternOpacity = partPattern.opacity;
    } else if ((activePosition === partName || activePosition === "all") && selectedPattern) {
      // Apply pattern to this part if activePosition is "all" or matches the part
      const patternTexturePath = patternSets[selectedPattern][0];
      patternTexture = patternTextures[patternTexturePath];
      currPatternColor = patternColor;
      currPatternScale = patternScale;
      currPatternOpacity = patternOpacity;
    }
  
    if (!patternTexture) {
      const transparentCanvas = document.createElement("canvas");
      transparentCanvas.width = transparentCanvas.height = 1;
      const transparentCtx = transparentCanvas.getContext("2d");
      transparentCtx.clearRect(0, 0, 1, 1);
      patternTexture = new THREE.Texture(transparentCanvas);
      patternTexture.needsUpdate = true;
    }
  
    const material = usePatternMaterial({
      baseTexture,
      normalTexture,
      roughnessTexture,
      patternTexture,
      baseColor: partColor,
      patternColor: currPatternColor,
      textureScale,
      patternScale: currPatternScale,
      textureOffset: new THREE.Vector2(0, 0),
      roughness,
      metalness: 0.1,
      side: THREE.DoubleSide,
      patternOpacity: currPatternOpacity,
    });
  
    material.depthTest = true;
    material.depthWrite = true;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -5;
    material.polygonOffsetUnits = -5;
    material.needsUpdate = true;
  
    materials[partName] = material;
  });

  const updatePartPattern = (position) => {
    if (position === "all") {
      setPartPatterns({
        front: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        leftSleeve: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        rightSleeve: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        back: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        chest: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
      });
      console.log("Updated partPatterns for all:", {
        front: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        leftSleeve: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        rightSleeve: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        back: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
        chest: { pattern: selectedPattern, color: patternColor, scale: patternScale, opacity: patternOpacity },
      });
    } else {
      setPartPatterns((prev) => ({
        ...prev,
        [position]: {
          pattern: selectedPattern,
          color: patternColor,
          scale: patternScale,
          opacity: patternOpacity,
        },
      }));
      console.log(`Updated partPatterns for ${position}:`, {
        pattern: selectedPattern,
        color: patternColor,
        scale: patternScale,
        opacity: patternOpacity,
      });
    }
  };

  useEffect(() => {
    if (onClearPattern) {
      if (onClearPattern === "all") {
        // Clear patterns for all parts
        setPartPatterns({
          front: null,
          leftSleeve: null,
          rightSleeve: null,
          back: null,
          chest: null,
        });
      } else {
        // Clear pattern for specific part
        setPartPatterns((prev) => ({
          ...prev,
          [onClearPattern]: null,
        }));
      }
      if (onPatternCleared) {
        onPatternCleared();
      }
    }
  }, [onClearPattern, onPatternCleared]);

  useEffect(() => {
    if (onLoaded) {
      onLoaded();
    }
  }, [onLoaded]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.minDistance = 2;
      controlsRef.current.maxDistance = 10;
    }
  }, [controlsRef]);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child.isMesh) {
        const partName = meshPartMapping[child.name];
        if (partName) {
          if (!child.geometry.attributes.tangent) {
            child.geometry.computeTangents();
          }
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone();
          meshBounds.current[partName] = box;
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!scene) return;

    const meshMap = {
      chest: null,
      leftSleeve: null,
      rightSleeve: null,
      back: null,
      front: null,
    };

    if (activePosition && selectedPattern) {
      updatePartPattern(activePosition);
    }

    scene.traverse((child) => {
      if (child.isMesh) {
        const partName = meshPartMapping[child.name];
        if (partName) {
          console.log(`Applying material to ${child.name} (${partName})`);
          if (!child.geometry.attributes.tangent) {
            child.geometry.computeTangents();
          }
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone();
          meshBounds.current[partName] = box;

          const material = materials[partName];
          if (material) {
            child.material = material;
            meshMap[partName] = child;
          }
        }
      }
    });

    setDecalMeshes([meshMap.chest, meshMap.leftSleeve, meshMap.rightSleeve, meshMap.back, meshMap.front].filter(Boolean));
  }, [scene, materials]);

 // Add this at the top of the HoodieModel component to track previous states
const prevCustomLogosRef = useRef(customLogos);
const prevCustomTextsRef = useRef(customTexts);

useEffect(() => {
  const newTextTextures = { chest: null, leftSleeve: null, rightSleeve: null, back: null, front: null };
  const newTextDimensions = { ...textDimensions };
  const newTextAspectRatios = { ...textAspectRatios };
  const newImageDimensions = { ...imageDimensions };
  const newImageAspectRatios = { ...imageAspectRatios };
  const positionsToResetScale = new Set();

  // Process text decals
  Object.keys(customTexts).forEach((position) => {
    const { text, show, color, background, fontSize, style, shape } = customTexts[position];

    // Check if text is new or changed
    const prevText = prevCustomTextsRef.current[position];
    const isNewText = !prevText || prevText.text !== text || prevText.show !== show;

    if (text && show) {
      const canvas = document.createElement("canvas");
      if (isNewText) {
        positionsToResetScale.add(position); // Only reset scale for new/changed text
      }
      const ctx = canvas.getContext("2d", { alpha: true });
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

      const lines = text.split("\n");
      let maxWidth = 0;
      const lineHeight = fontSize * 1.2;

      lines.forEach((line) => {
        const metrics = ctx.measureText(line);
        const lineWidth = metrics.width;
        maxWidth = Math.max(maxWidth, lineWidth);
      });

      const totalTextHeight = lineHeight * lines.length;
      const padding = fontSize * 0.5;
      const totalWidth = maxWidth + padding * 2;
      const totalHeight = totalTextHeight + padding * 2;

      let effectiveWidth = totalWidth;
      let effectiveHeight = totalHeight;

      if (shape === "circle" || shape === "oval") {
        const shapeExtraPadding = fontSize * 0.3;
        effectiveWidth = totalWidth + shapeExtraPadding * 2;
        effectiveHeight = totalHeight + shapeExtraPadding * 2;

        if (shape === "circle") {
          const maxDimension = Math.max(effectiveWidth, effectiveHeight);
          effectiveWidth = maxDimension;
          effectiveHeight = maxDimension;
        } else if (shape === "oval") {
          effectiveWidth = Math.max(effectiveWidth, effectiveHeight * 1.2);
        }
      }

      canvas.width = effectiveWidth;
      canvas.height = effectiveHeight;
      ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);

      newTextDimensions[position] = {
        width: effectiveWidth / 1000,
        height: effectiveHeight / 1000,
      };
      newTextAspectRatios[position] = effectiveWidth / effectiveHeight;

      let bgColor = background;
      if (bgColor !== "rgba(0, 0, 0, 0)") {
        ctx.fillStyle = bgColor;
        if (shape === "circle") {
          const centerX = effectiveWidth / 2;
          const centerY = effectiveHeight / 2;
          const radius = Math.min(effectiveWidth, effectiveHeight) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
          ctx.clip();
        } else if (shape === "oval") {
          const centerX = effectiveWidth / 2;
          const centerY = effectiveHeight / 2;
          const radiusX = effectiveWidth / 2;
          const radiusY = effectiveHeight / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX * 0.9, radiusY * 0.9, 0, 0, Math.PI * 2);
          ctx.clip();
        } else {
          ctx.fillRect(0, 0, effectiveWidth, effectiveHeight);
        }
      }

      ctx.shadowColor = selectedStyle.shadow.color;
      ctx.shadowBlur = selectedStyle.shadow.blur * (fontSize / 30);
      ctx.shadowOffsetX = selectedStyle.shadow.offsetX * (fontSize / 30);
      ctx.shadowOffsetY = selectedStyle.shadow.offsetY * (fontSize / 30);
      ctx.fillStyle = selectedStyle.color;
      ctx.font = selectedStyle.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const safeAreaPadding = shape === "circle" || shape === "oval" ? fontSize * 0.3 : padding;
      const safeWidth = effectiveWidth - safeAreaPadding * 2;

      lines.forEach((line, i) => {
        const y =
          effectiveHeight / 2 -
          ((lines.length - 1) * lineHeight) / 2 +
          i * lineHeight;
        if (shape === "circle" || shape === "oval") {
          const metrics = ctx.measureText(line);
          if (metrics.width > safeWidth) {
            const scaleFactor = safeWidth / metrics.width;
            const newFontSize = Math.floor(fontSize * scaleFactor);
            const adjustedFont = selectedStyle.font.replace(
              /\d+px/,
              `${newFontSize}px`
            );
            ctx.font = adjustedFont;
          }
        }
        ctx.fillText(line, effectiveWidth / 2, y);
      });

      if (shape === "circle" || shape === "oval") {
        ctx.restore();
      }

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

  // Process image decals
  Object.keys(customLogos).forEach((position) => {
    // Check if image is new
    const prevLogo = prevCustomLogosRef.current[position];
    const isNewImage = !prevLogo && customLogos[position];

    if (customLogos[position]) {
      if (isNewImage) {
        positionsToResetScale.add(position); // Only reset scale for new images
      }
      const texture = customLogos[position];
      if (texture.image) {
        const { width, height } = texture.image;
        newImageDimensions[position] = {
          width: width / 1000,
          height: height / 1000,
        };
        newImageAspectRatios[position] = width / height;
      }
    }
  });

  // Update scales only for positions with new images or texts
  if (positionsToResetScale.size > 0) {
    setTextDecalUniformScales((prev) => {
      const updated = { ...prev };
      positionsToResetScale.forEach((position) => {
        if (customTexts[position].show && customTexts[position].text) {
          updated[position] = 0.14;
        }
      });
      return updated;
    });
    setImageDecalUniformScales((prev) => {
      const updated = { ...prev };
      positionsToResetScale.forEach((position) => {
        if (customLogos[position]) {
          updated[position] = 0.14;
        }
      });
      return updated;
    });
  }

  setTextTextures(newTextTextures);
  setTextDimensions(newTextDimensions);
  setTextAspectRatios(newTextAspectRatios);
  setImageDimensions(newImageDimensions);
  setImageAspectRatios(newImageAspectRatios);

  // Update previous state refs
  prevCustomLogosRef.current = customLogos;
  prevCustomTextsRef.current = customTexts;
}, [customTexts, customLogos, renderer, textDimensions, textAspectRatios, imageDimensions, imageAspectRatios]);

useEffect(() => {
  setDecalVisibility((prev) => {
    const newVisibility = { ...prev };
    Object.keys(customLogos).forEach((position) => {
      newVisibility[position] = {
        ...prev[position],
        image: !!customLogos[position], // Enable image visibility if logo exists
      };
    });
    return newVisibility;
  });
}, [customLogos]);

useEffect(() => {
  setDecalVisibility((prev) => {
    const newVisibility = { ...prev };
    Object.keys(customTexts).forEach((position) => {
      newVisibility[position] = {
        ...prev[position],
        text: customTexts[position].show, // Enable text visibility if text is shown
      };
    });
    return newVisibility;
  });
}, [customTexts]);



  useEffect(() => {
    if (onDownloadGLB) {
      console.log("Starting GLB export process", {
        hasSelectedPattern: !!selectedPattern,
        patternType: selectedPattern ? selectedPattern.constructor.name : "none",
        patternImage: selectedPattern?.image,
        patternImageComplete: selectedPattern?.image?.complete,
        patternImageSrc: selectedPattern?.image?.src,
      });

      const exporter = new GLTFExporter();
      const sceneToExport = new THREE.Scene();
      const clonedHoodie = hoodieRef.current.clone(true);

      const ensureTexturesLoaded = (material) => {
        return new Promise((resolve, reject) => {
          const texturePromises = [];

          if (material.map && material.map.image && !material.map.image.complete) {
            texturePromises.push(
              new Promise((res) => {
                material.map.image.onload = () => {
                  console.log("Base texture loaded:", material.map.image.src);
                  res();
                };
                material.map.image.onerror = () => {
                  console.error("Failed to load base texture:", material.map.image.src);
                  res();
                };
              })
            );
          }

          if (
            material.userData &&
            material.userData.shader &&
            material.userData.shader.uniforms.patternTexture &&
            material.userData.shader.uniforms.patternTexture.value &&
            material.userData.shader.uniforms.patternTexture.value.image &&
            !material.userData.shader.uniforms.patternTexture.value.image.complete
          ) {
            texturePromises.push(
              new Promise((res) => {
                const patternImage = material.userData.shader.uniforms.patternTexture.value.image;
                patternImage.onload = () => {
                  console.log("Pattern texture loaded:", patternImage.src);
                  res();
                };
                patternImage.onerror = () => {
                  console.error("Failed to load pattern texture:", patternImage.src);
                  res();
                };
              })
            );
          }

          if (texturePromises.length === 0) {
            resolve();
            return;
          }

          Promise.all(texturePromises)
            .then(() => resolve())
            .catch((error) => {
              console.error("Texture loading error:", error);
              reject(error);
            });
        });
      };

      const bakePatternToTexture = (baseMaterial, patternTexture, patternColor, patternScale, patternOpacity) => {
        console.log("Baking pattern to texture:", {
          hasBaseTexture: !!baseMaterial.map,
          hasPatternTexture: !!patternTexture,
          patternScale: patternScale || 1,
          patternOpacity: patternOpacity !== undefined ? patternOpacity : 0.5,
          patternColor: patternColor ? `#${new THREE.Color(patternColor).getHexString()}` : "none",
        });

        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 2048;
        const ctx = canvas.getContext("2d");

        if (baseMaterial.map && baseMaterial.map.image && baseMaterial.map.image.complete) {
          ctx.drawImage(baseMaterial.map.image, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = `#${new THREE.Color(baseMaterial.color || 0xffffff).getHexString()}`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (patternTexture && patternTexture.image && patternTexture.image.complete && patternTexture.image.naturalWidth !== 0) {
          const patternImg = patternTexture.image;
          const tileSize = canvas.width / (patternScale || 1);

          const patternCanvas = document.createElement("canvas");
          patternCanvas.width = patternImg.width;
          patternCanvas.height = patternImg.height;
          const patternCtx = patternCanvas.getContext("2d");

          patternCtx.drawImage(patternImg, 0, 0);
          patternCtx.globalCompositeOperation = "source-atop";
          patternCtx.fillStyle = `#${new THREE.Color(patternColor || 0xffffff).getHexString()}`;
          patternCtx.globalAlpha = 1.0;
          patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
          patternCtx.globalCompositeOperation = "source-over";

          const coloredPattern = ctx.createPattern(patternCanvas, "repeat");
          ctx.save();
          ctx.scale(tileSize / patternImg.width, tileSize / patternImg.height);
          ctx.globalAlpha = patternOpacity !== undefined ? patternOpacity : 0.5;
          ctx.fillStyle = coloredPattern;
          ctx.fillRect(0, 0, canvas.width * (patternImg.width / tileSize), canvas.height * (patternImg.height / tileSize));
          ctx.restore();
          ctx.globalAlpha = 1.0;
        } else if (patternTexture) {
          console.warn("Pattern texture is invalid or not loaded:", patternTexture);
        }

        const combinedTexture = new THREE.CanvasTexture(canvas);
        combinedTexture.flipY = true;
        combinedTexture.needsUpdate = true;
        combinedTexture.encoding = THREE.sRGBEncoding;
        combinedTexture.wrapS = THREE.RepeatWrapping;
        combinedTexture.wrapT = THREE.RepeatWrapping;

        return combinedTexture;
      };

      const texturePromises = [];
      clonedHoodie.traverse((obj) => {
        if (obj.isMesh && obj.material && !obj.isDecal) {
          texturePromises.push(ensureTexturesLoaded(obj.material));
        }
      });

      Promise.all(texturePromises)
        .then(() => {
          clonedHoodie.traverse((obj) => {
            if (obj.isMesh && obj.material && !obj.isDecal) {
              const originalMaterial = obj.material;

              if (originalMaterial.userData && originalMaterial.userData.shader) {
                const shader = originalMaterial.userData.shader;
                const uniforms = shader.uniforms;

                console.log("Shader uniforms:", {
                  patternTextureExists: !!uniforms.patternTexture?.value,
                  patternColor: uniforms.patternColor?.value
                    ? `#${new THREE.Color(uniforms.patternColor.value).getHexString()}`
                    : "none",
                  patternScale: uniforms.patternScale?.value || 1,
                  patternOpacity: uniforms.patternOpacity?.value || 0.5,
                });

                const baseTexture = originalMaterial.map;
                const patternTexture = uniforms.patternTexture?.value || selectedPattern;
                const patternColor = uniforms.patternColor?.value || patternColor || 0xffffff;
                const patternScale = uniforms.patternScale?.value || patternScale || 1;
                const patternOpacity = uniforms.patternOpacity?.value || 0.5;

                const bakedTexture = bakePatternToTexture(
                  originalMaterial,
                  patternTexture,
                  patternColor,
                  patternScale,
                  patternOpacity
                );

                const newMaterial = new THREE.MeshStandardMaterial({
                  map: bakedTexture,
                  normalMap: originalMaterial.normalMap,
                  roughness: originalMaterial.roughness || 0.5,
                  metalness: originalMaterial.metalness || 0,
                  envMapIntensity: originalMaterial.envMapIntensity || 1,
                  color: originalMaterial.color || 0xffffff,
                  transparent: originalMaterial.transparent || false,
                  opacity: originalMaterial.opacity !== undefined ? originalMaterial.opacity : 1,
                });

                obj.material = newMaterial;
              } else {
                console.warn("Material does not have shader data:", originalMaterial);
                const bakedTexture = bakePatternToTexture(
                  originalMaterial,
                  selectedPattern,
                  patternColor || 0xffffff,
                  patternScale || 1,
                  0.5
                );
                obj.material = new THREE.MeshStandardMaterial({
                  map: bakedTexture,
                  normalMap: originalMaterial.normalMap,
                  roughness: originalMaterial.roughness || 0.5,
                  metalness: originalMaterial.metalness || 0,
                  envMapIntensity: originalMaterial.envMapIntensity || 1,
                  color: originalMaterial.color || 0xffffff,
                  transparent: originalMaterial.transparent || false,
                  opacity: originalMaterial.opacity !== undefined ? originalMaterial.opacity : 1,
                });
              }
            }
          });

          Object.entries(decalRefs.current).forEach(([key, ref]) => {
            if (ref && decalVisibility[key.split("-")[0]][key.split("-")[1]]) {
              const decalClone = ref.clone();
              decalClone.isDecal = true;

              if (decalClone.material && decalClone.material.map) {
                const decalMaterial = new THREE.MeshStandardMaterial({
                  map: decalClone.material.map,
                  transparent: true,
                  opacity: 1.0,
                  alphaTest: 0.01,
                  depthTest: true,
                  depthWrite: false,
                  polygonOffset: true,
                  polygonOffsetFactor: -10,
                });
                decalClone.material = decalMaterial;
                clonedHoodie.add(decalClone);
              }
            }
          });

          clonedHoodie.traverse((obj) => {
            if (obj.isGroup && obj.children) {
              obj.children = obj.children.filter((child) => {
                const isControl =
                  (child.geometry && child.geometry.type === "PlaneGeometry" && child.geometry.parameters.width === 0.05) ||
                  (child.type === "Line" && child.material && child.material.color && child.material.color.getHex() === 0x000000);
                return !isControl;
              });
            }
          });

          sceneToExport.add(clonedHoodie);

          exporter.parse(
            sceneToExport,
            (gltf) => {
              const blob = new Blob([gltf], { type: "application/octet-stream" });
              const url = URL.createObjectURL(blob);
              onDownloadGLB(url);
              console.log("GLB export completed successfully");
            },
            (error) => console.error("GLB Export Error:", error),
            {
              binary: true,
              embedImages: true,
              forceIndices: true,
              maxTextureSize: 4096,
            }
          );
        })
        .catch((error) => {
          console.error("Texture loading error:", error);
        });
    }
  }, [onDownloadGLB, decalVisibility, selectedTexture, selectedPattern, patternColor, textureScale, roughness, patternScale, customLogos, customTexts]);

  useEffect(() => {
    if (onDownloadImage) {
      const controlElements = [];
      fullScene.traverse((obj) => {
        if (
          obj.isLine ||
          (obj.isMesh &&
            obj.geometry &&
            obj.geometry.type === "PlaneGeometry" &&
            obj.geometry.parameters.width === 0.05)
        ) {
          controlElements.push(obj);
          obj.visible = false;
        }
      });

      renderer.render(fullScene, camera);
      onDownloadImage(renderer.domElement.toDataURL("image/png"));

      controlElements.forEach((obj) => {
        obj.visible = true;
      });
    }
  }, [onDownloadImage, renderer, fullScene, camera]);

  const getEventCoordinates = (event) => {
    const isTouch = event.type.includes("touch");
    return isTouch
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : { x: event.clientX, y: event.clientY };
  };

  const handleCanvasClick = (event) => {
    event.stopPropagation();
    const coords = getEventCoordinates(event);
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((coords.x - rect.left) / rect.width) * 2 - 1,
      -((coords.y - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(fullScene.children, true);
    let hitDecal = false;
    let hitPosition = null;
    let hitType = null;

    for (const intersect of intersects) {
      const object = intersect.object;
      for (const [key, ref] of Object.entries(decalRefs.current)) {
        if (object === ref) {
          hitDecal = true;
          [hitPosition, hitType] = key.split("-");
          break;
        }
      }
      if (hitDecal) break;
    }

    if (hitDecal && hitPosition && decalVisibility[hitPosition][hitType]) {
      setSelectedTab(hitPosition);
      setSelectedDecalType(hitType);
    } else {
      setSelectedTab(null);
      setSelectedDecalType(null);
    }
  };

  const handleDecalClick = (e, position, type) => {
    e.stopPropagation();
    if (decalVisibility[position][type]) {
      setSelectedTab(position);
      setSelectedDecalType(type);
    }
  };

  const handlePointerDown = (event, handle, position, type) => {
    event.stopPropagation();
    controlsRef.current.enabled = false;
    setActiveHandle(handle);
    const coords = getEventCoordinates(event);
    setInitialMouse(coords);
    setInitialScale(type === "text" ? textDecalUniformScales[position] : imageDecalUniformScales[position]);
    setInitialRotation((type === "text" ? textDecalRotations[position] : imageDecalRotations[position])[2]);
    setInitialPosition([...(type === "text" ? textDecalPositions[position] : imageDecalPositions[position])]);
    setIsDragging(true);
    setCursorStyle("grabbing");

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((coords.x - rect.left) / rect.width) * 2 - 1,
      -((coords.y - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);

    const decal = decalRefs.current[`${position}-${type}`];
    if (decal && handle === "move") {
      const normal = new THREE.Vector3(0, 0, 1);
      decal.getWorldDirection(normal);
      const positionArray = type === "text" ? textDecalPositions[position] : imageDecalPositions[position];
      const position = new THREE.Vector3().fromArray(positionArray);
      decal.localToWorld(position);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, position);

      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        const offset = intersectPoint.clone().sub(position);
        setDragOffset({ x: offset.x, y: offset.y, z: offset.z });
      }
    }

    if (handle === "delete") {
  if (type === "text") {
    // Delete text decal only
    setDecalVisibility((prev) => ({
      ...prev,
      [position]: { ...prev[position], text: false },
    }));
    if (customTexts[position].show) {
      setCustomTexts((prev) => ({
        ...prev,
        [position]: { ...prev[position], text: "", show: false },
      }));
    }
  } else if (type === "image") {
    // Delete image decal only
    setDecalVisibility((prev) => ({
      ...prev,
      [position]: { ...prev[position], image: false },
    }));
    // Optionally clear customLogos[position] if required by your app logic
    // For example, if customLogos is managed in a similar way:
    // setCustomLogos((prev) => ({
    //   ...prev,
    //   [position]: null,
    // }));
  }

  // Call onDeleteDecal with the specific type
  if (onDeleteDecal) {
    onDeleteDecal(position, type);
  }

  // Reset selection
  setSelectedTab(null);
  setSelectedDecalType(null);
  setActiveHandle(null);
  setIsDragging(false);
  setCursorStyle("auto");
  controlsRef.current.enabled = true;
}
  };

 const handlePointerMove = (event) => {
  if (!activeHandle || !isDragging || !selectedTab || !selectedDecalType) return;

  const coords = getEventCoordinates(event);
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((coords.x - rect.left) / rect.width) * 2 - 1,
    -((coords.y - rect.top) / rect.height) * 2 + 1
  );

  if (activeHandle === "rotate") {
    const deltaX = (coords.x - initialMouse.x) * 0.005;
    // Adjust rotation direction: use deltaX for leftSleeve, -deltaX for others
    const rotationChange = selectedTab === "leftSleeve" ? deltaX : -deltaX;
    const newRotZ = initialRotation + rotationChange;
    if (selectedDecalType === "text") {
      setTextDecalRotations((prev) => ({
        ...prev,
        [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], newRotZ],
      }));
    } else {
      setImageDecalRotations((prev) => ({
        ...prev,
        [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], newRotZ],
      }));
    }
  } else if (activeHandle === "move") {
    raycaster.setFromCamera(mouse, camera);

    const decal = decalRefs.current[`${selectedTab}-${selectedDecalType}`];
    if (decal) {
      const normal = new THREE.Vector3(0, 0, 1);
      decal.getWorldDirection(normal);
      const positionArray = selectedDecalType === "text" ? textDecalPositions[selectedTab] : imageDecalPositions[selectedTab];
      const position = new THREE.Vector3().fromArray(positionArray);
      decal.localToWorld(position);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, position);

      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        const newPosition = intersectPoint.clone().sub(
          new THREE.Vector3(dragOffset.x, dragOffset.y, dragOffset.z)
        );
        const localPosition = decal.worldToLocal(newPosition.clone());

        const bounds = meshBounds.current[selectedTab];
        if (bounds) {
          const uniformScale = selectedDecalType === "text" ? textDecalUniformScales[selectedTab] : imageDecalUniformScales[selectedTab];
          const dimensions = selectedDecalType === "text" ? textDimensions[selectedTab] : imageDimensions[selectedTab];
          const fontSizeAdjustment = selectedDecalType === "text" ? customTexts[selectedTab]?.fontSize / 60 : 1;
          const decalWidth = dimensions.width * uniformScale * fontSizeAdjustment;
          const decalHeight = dimensions.height * uniformScale * fontSizeAdjustment;

          const xMin = bounds.min.x + decalWidth / 2;
          const xMax = bounds.max.x - decalWidth / 2;
          const yMin = bounds.min.y + decalHeight / 2;
          const yMax = bounds.max.y - decalHeight / 2;

          let newX = Math.max(xMin, Math.min(xMax, localPosition.x));
          let newY = Math.max(yMin, Math.min(yMax, localPosition.y));

          if (selectedTab === "leftSleeve") {
            newX = Math.max(-0.73, Math.min(-0.73, newX));
          } else if (selectedTab === "rightSleeve") {
            newX = Math.max(0.75, Math.min(0.75, newX));
          }

          if (selectedDecalType === "text") {
            setTextDecalPositions((prev) => ({
              ...prev,
              [selectedTab]: [newX, newY, prev[selectedTab][2]],
            }));
          } else {
            setImageDecalPositions((prev) => ({
              ...prev,
              [selectedTab]: [newX, newY, prev[selectedTab][2]],
            }));
          }
        }
      }
    }
  } else if (activeHandle === "resize") {
    const deltaX = (coords.x - initialMouse.x) * 0.005;
    const adjustedDeltaX = selectedTab === "rightSleeve" ? -deltaX : deltaX;
    let newScale = Math.max(0.05, initialScale + adjustedDeltaX);

    if (selectedTab === "leftSleeve" || selectedTab === "rightSleeve") {
      newScale = Math.max(0.05, Math.min(0.3, newScale));
    }

    if (selectedDecalType === "text") {
      setTextDecalUniformScales((prev) => ({
        ...prev,
        [selectedTab]: newScale,
      }));
    } else {
      setImageDecalUniformScales((prev) => ({
        ...prev,
        [selectedTab]: newScale,
      }));
    }
  }
};
  const handlePointerUp = () => {
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
    setActiveHandle(null);
    setIsDragging(false);
    setCursorStyle("auto");
    setDragOffset({ x: 0, y: 0, z: 0 });
  };

  useEffect(() => {
    renderer.domElement.style.cursor = cursorStyle;
    return () => {
      renderer.domElement.style.cursor = "auto";
    };
  }, [cursorStyle, renderer]);

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
    window.addEventListener("touchmove", handleGlobalPointerMove, { passive: false });
    window.addEventListener("touchend", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("touchmove", handleGlobalPointerMove);
      window.removeEventListener("touchend", handleGlobalPointerUp);
    };
  }, [isDragging, activeHandle, initialMouse, initialScale, initialRotation, initialPosition]);

  useEffect(() => {
    const canvas = renderer.domElement;
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("touchstart", handleCanvasClick, { passive: true });

    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("touchstart", handleCanvasClick);
    };
  }, [renderer, fullScene, decalVisibility]);

  const getIconPositions = (scale, position, rotation, meshPosition) => {
    const halfWidth = scale[0] / 2;
    const halfHeight = scale[1] / 2;
    const zOffset = 0.01;

    const corners = {
      rotate: [-halfWidth, halfHeight, zOffset],
      delete: [halfWidth, halfHeight, zOffset],
      move: [-halfWidth, -halfHeight, zOffset],
      resize: [halfWidth, -halfHeight, zOffset],
    };

    const isSleeve = meshPosition === "leftSleeve" || meshPosition === "rightSleeve";
    const isBack = meshPosition === "back";
    if (isSleeve || isBack) {
      const euler = new THREE.Euler(...rotation);
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      Object.keys(corners).forEach((key) => {
        const pos = new THREE.Vector3(...corners[key]);
        pos.applyQuaternion(quaternion);
        corners[key] = [pos.x, pos.y, pos.z + zOffset];
      });
    }

    const iconPositions = {};
    Object.keys(corners).forEach((key) => {
      const localPos = new THREE.Vector3(...corners[key]);
      iconPositions[key] = [
        position[0] + localPos.x,
        position[1] + localPos.y,
        position[2] + localPos.z,
      ];
    });

    return iconPositions;
  };

  return (
    <group ref={hoodieRef} position={position} rotation={[0, 0, 0]} scale={[2, 2, 2]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
      {/* <directionalLight position={[-5, 5, -5]} intensity={0.7} castShadow /> */}
      <primitive object={scene} />
      {decalMeshes.map((mesh, index) => {
        if (!mesh) return null;

        const decalConfigs = [
          { position: "front", meshName: "Front", side: THREE.FrontSide },
          { position: "leftSleeve", meshName: "Left_Sleeve", side: THREE.FrontSide },
          { position: "rightSleeve", meshName: "Right_Sleeve", side: THREE.FrontSide },
          { position: "back", meshName: "Back", side: THREE.FrontSide },
        ];

        return decalConfigs.map((config) => {
          if (mesh.name !== config.meshName) return null;

          const { position: meshPosition, side: sideProperty } = config;
          const decals = [];

          // Handle text decal
          if (customTexts[meshPosition].show && textTextures[meshPosition] && decalVisibility[meshPosition].text) {
            const position = textDecalPositions[meshPosition];
            const rotation = textDecalRotations[meshPosition];
            const uniformScale = textDecalUniformScales[meshPosition];
            const fontSizeAdjustment = customTexts[meshPosition].fontSize / 60;
            const dimensions = textDimensions[meshPosition];
            const scale = [
              dimensions.width * uniformScale * fontSizeAdjustment,
              dimensions.height * uniformScale * fontSizeAdjustment,
              1,
            ];
            const isSelected = selectedTab === meshPosition && selectedDecalType === "text";

            const iconPositions = getIconPositions(scale, position, rotation, meshPosition);

            decals.push(
              <group key={`${mesh.name}-${meshPosition}-text`}>
                <mesh geometry={mesh.geometry}>
                  <Decal
                    ref={(ref) => (decalRefs.current[`${meshPosition}-text`] = ref)}
                    position={position}
                    rotation={new THREE.Euler(...rotation)}
                    scale={scale}
                    map={textTextures[meshPosition]}
                    debug={false}
                    polygonOffset={true}
                    polygonOffsetFactor={-50}
                    depthTest={false}
                    depthWrite={false}
                    renderOrder={isSelected ? 10 : 5}
                    onClick={(e) => handleDecalClick(e, meshPosition, "text")}
                    onPointerDown={(e) => handlePointerDown(e, "move", meshPosition, "text")}
                    onTouchStart={(e) => handlePointerDown(e, "move", meshPosition, "text")}
                    material={
                      new THREE.MeshBasicMaterial({
                        map: textTextures[meshPosition],
                        transparent: true,
                        opacity: 1.0,
                        side: sideProperty,
                        blending: THREE.NormalBlending,
                        depthTest: false,
                        depthWrite: false,
                        polygonOffset: true,
                        polygonOffsetFactor: -50,
                        renderOrder: isSelected ? 10 : 6,
                      })
                    }
                  />
                  {isSelected &&
                    Object.entries(iconPositions).map(([handle, pos]) => {
                      const iconTexture =
                        handle === "rotate"
                          ? rotateIconTexture
                          : handle === "delete"
                          ? deleteIconTexture
                          : handle === "move"
                          ? moveIconTexture
                          : resizeIconTexture;

                      return (
                        <Decal
                          debug={false}
                          key={`${handle}-text`}
                          position={pos}
                          rotation={new THREE.Euler(...rotation)}
                          scale={[0.05, 0.05, 1]}
                          map={iconTexture}
                          transparent={true}
                          opacity={1.0}
                          depthTest={false}
                          depthWrite={false}
                          polygonOffset={true}
                          polygonOffsetFactor={-30}
                          renderOrder={15}
                          onPointerDown={(e) => handlePointerDown(e, handle, meshPosition, "text")}
                          onTouchStart={(e) => handlePointerDown(e, handle, meshPosition, "text")}
                          material={
                            new THREE.MeshBasicMaterial({
                              map: iconTexture,
                              transparent: true,
                              opacity: 1.0,
                              side: THREE.FrontSide,
                              depthTest: false,
                              depthWrite: false,
                              polygonOffset: true,
                              polygonOffsetFactor: -30,
                              renderOrder: isSelected ? 8 : 5,
                            })
                          }
                        />
                      );
                    })}
                </mesh>
                {isSelected && (
                  <line>
                    <bufferGeometry attach="geometry">
                      <float32BufferAttribute
                        attach="attributes-position"
                        array={new Float32Array([
                          -scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                          scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                          scale[0] / 2,
                          scale[1] / 2,
                          0.006,
                          -scale[0] / 2,
                          scale[1] / 2,
                          0.006,
                          -scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                        ])}
                        count={5}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      attach="material"
                      color="#FFFFFF"
                      dashSize={0.05}
                      gapSize={0.05}
                    />
                  </line>
                )}
              </group>
            );
          }

          // Handle image decal
          if (customLogos[meshPosition] && decalVisibility[meshPosition].image) {
            const position = imageDecalPositions[meshPosition];
            const rotation = imageDecalRotations[meshPosition];
            const uniformScale = imageDecalUniformScales[meshPosition];
            const dimensions = imageDimensions[meshPosition];
            const scale = [
              dimensions.width * uniformScale,
              dimensions.height * uniformScale,
              1,
            ];
            const isSelected = selectedTab === meshPosition && selectedDecalType === "image";

            const iconPositions = getIconPositions(scale, position, rotation, meshPosition);

            decals.push(
              <group key={`${mesh.name}-${meshPosition}-image`}>
                <mesh geometry={mesh.geometry}>
                  <Decal
                    ref={(ref) => (decalRefs.current[`${meshPosition}-image`] = ref)}
                    position={position}
                    rotation={new THREE.Euler(...rotation)}
                    scale={scale}
                    map={customLogos[meshPosition]}
                    debug={false}
                    polygonOffset={true}
                    polygonOffsetFactor={-50}
                    depthTest={false}
                    depthWrite={false}
                    renderOrder={isSelected ? 10 : 5}
                    onClick={(e) => handleDecalClick(e, meshPosition, "image")}
                    onPointerDown={(e) => handlePointerDown(e, "move", meshPosition, "image")}
                    onTouchStart={(e) => handlePointerDown(e, "move", meshPosition, "image")}
                    material={
                      new THREE.MeshBasicMaterial({
                        map: customLogos[meshPosition],
                        transparent: true,
                        opacity: 1.0,
                        side: sideProperty,
                        blending: THREE.NormalBlending,
                        depthTest: false,
                        depthWrite: false,
                        polygonOffset: true,
                        polygonOffsetFactor: -50,
                        renderOrder: isSelected ? 10 : 5,
                      })
                    }
                  />
                  {isSelected &&
                    Object.entries(iconPositions).map(([handle, pos]) => {
                      const iconTexture =
                        handle === "rotate"
                          ? rotateIconTexture
                          : handle === "delete"
                          ? deleteIconTexture
                          : handle === "move"
                          ? moveIconTexture
                          : resizeIconTexture;

                      return (
                        <Decal
                          debug={false}
                          key={`${handle}-image`}
                          position={pos}
                          rotation={new THREE.Euler(...rotation)}
                          scale={[0.05, 0.05, 1]}
                          map={iconTexture}
                          transparent={true}
                          opacity={1.0}
                          depthTest={false}
                          depthWrite={false}
                          polygonOffset={true}
                          polygonOffsetFactor={-30}
                          renderOrder={15}
                          onPointerDown={(e) => handlePointerDown(e, handle, meshPosition, "image")}
                          onTouchStart={(e) => handlePointerDown(e, handle, meshPosition, "image")}
                          material={
                            new THREE.MeshBasicMaterial({
                              map: iconTexture,
                              transparent: true,
                              opacity: 1.0,
                              side: THREE.FrontSide,
                              depthTest: false,
                              depthWrite: false,
                              polygonOffset: true,
                              polygonOffsetFactor: -30,
                              renderOrder: 20,
                            })
                          }
                        />
                      );
                    })}
                </mesh>
                {isSelected && (
                  <line>
                    <bufferGeometry attach="geometry">
                      <float32BufferAttribute
                        attach="attributes-position"
                        array={new Float32Array([
                          -scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                          scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                          scale[0] / 2,
                          scale[1] / 2,
                          0.006,
                          -scale[0] / 2,
                          scale[1] / 2,
                          0.006,
                          -scale[0] / 2,
                          -scale[1] / 2,
                          0.006,
                        ])}
                        count={5}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      attach="material"
                      color="#FFFFFF"
                      dashSize={0.05}
                      gapSize={0.05}
                    />
                  </line>
                )}
              </group>
            );
          }

          return decals.length > 0 ? decals : null;
        });
      })}
    </group>
  );
}

export default HoodieModel;
useGLTF.preload("/patterns/BamaFinal.glb");