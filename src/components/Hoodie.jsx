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
    patternOpacity: 1.0,
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
    uniform float patternOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vec2 scaledBaseUv = vUv * textureScale + textureOffset;
      vec4 baseTexel = texture2D(baseTexture, scaledBaseUv);
      vec4 baseColor4 = vec4(baseColor, 1.0);
      vec4 base = baseTexel * baseColor4;
      vec2 scaledPatternUv = vUv * patternScale;
      vec4 patternTexel = texture2D(patternTexture, scaledPatternUv);
      vec4 pattern = vec4(patternTexel.rgb * patternColor, patternTexel.a);
      if (pattern.a > 0.1) {
       float alpha = pattern.a * patternOpacity;
        vec4 result = mix(base, vec4(pattern.rgb, 1.0), alpha);
       gl_FragColor = vec4(result.rgb, 1.0);
      } else {
        gl_FragColor = base;
      }
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
  position,
  patternOpacity
}) {
  const { scene } = useGLTF("/patterns/TShirt.glb");
  const { raycaster, camera, gl: renderer, scene: fullScene } = useThree();

  const baseTextures = useTexture({
    cotton: "/8_flannelette tartan fabric texture-seamless.jpg",
    fleece: "/14_acrylic fabric tartan wallpapers texture-seamless.jpg",
    knit: "/15_wool flannel fabric texture-seamless.jpg",
    denim: "/29_wool silk tartan fabric texture-seamless.jpg",
    polyester: "/74_navy blue fabric striped wallpaper texture-seamless.jpg",
  });

  const patternTextures = useTexture({
    ...patternSets.checker.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
    ...patternSets.stripes.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
    ...patternSets.circles.reduce((acc, path) => ({ ...acc, [path]: path }), {}),
  });

  const meshPartOrder = ["chest", "leftSleeve", "rightSleeve", "back", "front"];
  const rotateIconTexture = useTexture("/Rotate1.jpg");
  const deleteIconTexture = useTexture("/Delete.jpeg");
  const resizeIconTexture = useTexture("/Zoom.png");
  const moveIconTexture = useTexture("/Move.webp");

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
  const [decalRotations, setDecalRotations] = useState({
    chest: [0.00, 0.13, 0.00],
    leftSleeve: [-1.62, Math.PI / 2, 0],
    rightSleeve: [-1.62, Math.PI / 2, 0],
    back: [0, Math.PI, 0],
    front: [0.00, 0.13, 0.00],
  });
  
  const [decalPositions, setDecalPositions] = useState({
    chest: [0.01, 0.20, 0.12],
    leftSleeve: [-0.75, 0.10, -0.03],
    rightSleeve: [0.73, 0.10, -0.02],
    back: [0, 0.2, -0.08],
    front: [0.01, 0.20, 0.12],
  });
  
  const [decalUniformScales, setDecalUniformScales] = useState({
    chest: 0.14,
    leftSleeve: 0.155,
    rightSleeve: 0.155,
    back: 0.14,
    front: 0.14,
  });

  const [aspectRatios, setAspectRatios] = useState({
    chest: 1,
    leftSleeve: 1,
    rightSleeve: 1,
    back: 1,
    front: 1,
  });

  const [decalDimensions, setDecalDimensions] = useState({
    chest: { width: 0.15, height: 0.13 },
    leftSleeve: { width: 0.16, height: 0.15 },
    rightSleeve: { width: 0.16, height: 0.15 },
    back: { width: 0.15, height: 0.13 },
    front: { width: 0.15, height: 0.13 },
  });

  const [activeHandle, setActiveHandle] = useState(null);
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialPosition, setInitialPosition] = useState([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, z: 0 });
  const [cursorStyle, setCursorStyle] = useState("auto");

  const meshPartMapping = {
    Front: "front",
    Left_Sleeve: "leftSleeve",
    Right_Sleeve: "rightSleeve",
    Back: "back",
  };

  // Compute bounding boxes for meshes
  const meshBounds = useRef({
    chest: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
    front: null,
  });

  useEffect(() => {
    if (!scene) return;

    // Calculate bounding boxes for each mesh part
    scene.traverse((child) => {
      if (child.isMesh) {
        const partName = meshPartMapping[child.name];
        if (partName) {
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone();
          // Transform bounding box to local space of the mesh
          meshBounds.current[partName] = box;
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    const newTextTextures = { chest: null, leftSleeve: null, rightSleeve: null, back: null, front: null };
    const newAspectRatios = { ...aspectRatios };
    const newDimensions = { ...decalDimensions };
    const positionsToResetScale = new Set();
    Object.keys(customTexts).forEach((position) => {
      const { text, show, color, background, fontSize, style, shape } = customTexts[position];

      if (text && show) {
        const canvas = document.createElement("canvas");
        positionsToResetScale.add(position);
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

        const lines = text.split('\n');
        let maxWidth = 0;
        const lineHeight = fontSize * 1.2;

        lines.forEach(line => {
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

        newDimensions[position] = {
          width: effectiveWidth / 1000,
          height: effectiveHeight / 1000,
        };
        newAspectRatios[position] = effectiveWidth / effectiveHeight;

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

        const safeAreaPadding = (shape === "circle" || shape === "oval") ? fontSize * 0.3 : padding;
        const safeWidth = effectiveWidth - safeAreaPadding * 2;

        lines.forEach((line, i) => {
          const y = effectiveHeight / 2 - ((lines.length - 1) * lineHeight / 2) + (i * lineHeight);
          if (shape === "circle" || shape === "oval") {
            const metrics = ctx.measureText(line);
            if (metrics.width > safeWidth) {
              const scaleFactor = safeWidth / metrics.width;
              const newFontSize = Math.floor(fontSize * scaleFactor);
              const adjustedFont = selectedStyle.font.replace(/\d+px/, `${newFontSize}px`);
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

    Object.keys(customLogos).forEach((position) => {
      if (customLogos[position]) {
        positionsToResetScale.add(position);
        const texture = customLogos[position];
        if (texture.image) {
          const { width, height } = texture.image;
          newDimensions[position] = {
            width: width / 1000,
            height: height / 1000,
          };
          newAspectRatios[position] = width / height;
        }
      }
    });

    if (positionsToResetScale.size > 0) {
      setDecalUniformScales((prev) => {
        const updated = { ...prev };
        positionsToResetScale.forEach((position) => {
          if (customTexts[position].show && customTexts[position].text) {
            updated[position] = 0.14;
          } else if (customLogos[position]) {
            updated[position] = 0.14;
          }
        });
        return updated;
      });
    }

    setTextTextures(newTextTextures);
    setAspectRatios(newAspectRatios);
    setDecalDimensions(newDimensions);
  }, [customTexts, customLogos, renderer]);

  useEffect(() => {
    if (!scene) return;

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
          const partColor = partColors[partName] || "#FFFFFF";
    
          let baseTexture = selectedTexture ? baseTextures[selectedTexture] : null;
          if (baseTexture) {
            baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping;
            baseTexture.repeat.set(textureScale, textureScale);
            baseTexture.needsUpdate = true;
          } else {
            const emptyCanvas = document.createElement("canvas");
            emptyCanvas.width = emptyCanvas.height = 1;
            const emptyCtx = emptyCanvas.getContext("2d");
            emptyCtx.fillStyle = "#FFFFFF";
            emptyCtx.fillRect(0, 0, 1, 1);
            baseTexture = new THREE.Texture(emptyCanvas);
            baseTexture.needsUpdate = true;
          }
    
          let patternTexture;
          if (selectedPattern && patternSets[selectedPattern]) {
            const patternTexturePath = patternSets[selectedPattern][0];
            patternTexture = patternTextures[patternTexturePath];
            patternTexture.wrapS = patternTexture.wrapT = THREE.RepeatWrapping;
            patternTexture.repeat.set(patternScale, patternScale);
            patternTexture.needsUpdate = true;
          } else {
            const transparentCanvas = document.createElement("canvas");
            transparentCanvas.width = transparentCanvas.height = 1;
            const transparentCtx = transparentCanvas.getContext("2d");
            transparentCtx.clearRect(0, 0, 1, 1);
            patternTexture = new THREE.Texture(transparentCanvas);
            patternTexture.needsUpdate = true;
          }
    
          const material = new PatternMaterial({
            baseTexture: baseTexture,
            patternTexture: patternTexture,
            baseColor: new THREE.Color(partColor),
            patternColor: new THREE.Color(patternColor),
            textureScale: textureScale,
            patternScale: patternScale,
            textureOffset: new THREE.Vector2(0, 0),
            roughness: roughness,
            metalness: 0.1,
            patternOpacity: patternOpacity,
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
    selectedTexture,
    partColors,
    selectedColor,
    textureScale,
    roughness,
    selectedPattern,
    patternColor,
    patternScale,
    patternOpacity,
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

      const meshesWithDecals = new Set();

      Object.entries(decalRefs.current).forEach(([position, ref]) => {
        if (ref && decalVisibility[position]) {
          clonedHoodie.traverse((child) => {
            if (child.isMesh) {
              const partName = meshPartMapping[child.name];
              if (partName === position) {
                meshesWithDecals.add(child.uuid);
              }
            }
          });
        }
      });

      clonedHoodie.traverse((child) => {
        if (child.isMesh && child.material) {
          const canvas = document.createElement('canvas');
          canvas.width = 4096;
          canvas.height = 4096;
          const ctx = canvas.getContext('2d');

          const baseColor = child.material.color || child.material.uniforms?.baseColor?.value || new THREE.Color(1, 1, 1);
          const baseColorCSS = `rgb(${Math.round(baseColor.r * 255)}, ${Math.round(baseColor.g * 255)}, ${Math.round(baseColor.b * 255)})`;

          ctx.fillStyle = baseColorCSS;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (child.material instanceof PatternMaterial && selectedTexture && selectedPattern) {
            const patternColor = child.material.uniforms.patternColor.value;
            const baseTexture = child.material.uniforms.baseTexture.value;
            const patternTexture = child.material.uniforms.patternTexture.value;
            const textureScale = child.material.uniforms.textureScale.value;
            const patternScale = child.material.uniforms.patternScale.value;

            const patternColorCSS = `rgb(${Math.round(patternColor.r * 255)}, ${Math.round(patternColor.g * 255)}, ${Math.round(patternColor.b * 255)})`;

            if (baseTexture && baseTexture.image) {
              const baseCanvas = document.createElement('canvas');
              baseCanvas.width = baseTexture.image.width;
              baseCanvas.height = baseTexture.image.height;
              const baseCtx = baseCanvas.getContext('2d');
              baseCtx.drawImage(baseTexture.image, 0, 0);

              ctx.globalCompositeOperation = 'multiply';
              const basePattern = ctx.createPattern(baseCanvas, 'repeat');
              ctx.save();
              ctx.scale(textureScale, textureScale);
              ctx.fillStyle = basePattern;
              ctx.fillRect(0, 0, canvas.width / textureScale, canvas.height / textureScale);
              ctx.restore();
            }

            ctx.globalCompositeOperation = 'source-over';

            if (selectedPattern && patternTexture && patternTexture.image) {
              const patternCanvas = document.createElement('canvas');
              patternCanvas.width = patternTexture.image.width;
              patternCanvas.height = patternTexture.image.height;
              const patternCtx = patternCanvas.getContext('2d');

              patternCtx.drawImage(patternTexture.image, 0, 0);

              const patternImageData = patternCtx.getImageData(0, 0, patternCanvas.width, patternCanvas.height);
              const data = patternImageData.data;

              for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) {
                  data[i] = patternColor.r * 255;
                  data[i + 1] = patternColor.g * 255;
                  data[i + 2] = patternColor.b * 255;
                  data[i + 3] = 255;
                }
              }

              patternCtx.putImageData(patternImageData, 0, 0);

              ctx.globalCompositeOperation = 'source-over';
              const pattern = ctx.createPattern(patternCanvas, 'repeat');
              ctx.save();

              const normalizedScale = 2 / patternScale;
              ctx.scale(normalizedScale, normalizedScale);
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, canvas.width * patternScale, canvas.height * patternScale);
              ctx.restore();
            }
          }

          const combinedTexture = new THREE.Texture(canvas);
          combinedTexture.needsUpdate = true;
          combinedTexture.wrapS = THREE.RepeatWrapping;
          combinedTexture.wrapT = THREE.RepeatWrapping;

          const exportMaterial = new THREE.MeshStandardMaterial({
            map: selectedTexture && selectedPattern ? combinedTexture : null,
            color: baseColor,
            roughness: child.material.roughness || child.material.uniforms?.roughness?.value || 0.7,
            metalness: child.material.metalness || child.material.uniforms?.metalness?.value || 0.1,
            transparent: meshesWithDecals.has(child.uuid) ? true : false,
            opacity: 1.0,
          });

          child.material = exportMaterial;
        }
      });

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

      sceneToExport.add(clonedHoodie);

      exporter.parse(
        sceneToExport,
        (gltf) => {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          onDownloadGLB(url);
        },
        (error) => console.error("GLB Export Error:", error),
        {
          binary: true,
          embedImages: true,
          forceIndices: true,
          maxTextureSize: 4096
        }
      );
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
    const isTouch = event.type.includes('touch');
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

    for (const intersect of intersects) {
      const object = intersect.object;
      if (object === decalRefs.current.chest || object === decalRefs.current.leftSleeve ||
        object === decalRefs.current.rightSleeve || object === decalRefs.current.back ||
        object === decalRefs.current.front) {
        hitDecal = true;
        hitPosition = Object.keys(decalRefs.current).find(
          (key) => decalRefs.current[key] === object
        );
        break;
      }
    }

    if (hitDecal && hitPosition && decalVisibility[hitPosition]) {
      setSelectedTab(hitPosition);
    } else {
      setSelectedTab(null);
    }
  };

  const handleDecalClick = (e, position) => {
    e.stopPropagation();
    if (decalVisibility[position]) {
      setSelectedTab(position);
    }
  };

  const handlePointerDown = (event, handle, location) => {
    event.stopPropagation();
    controlsRef.current.enabled = false;
    setActiveHandle(handle);
    const coords = getEventCoordinates(event);
    setInitialMouse(coords);
    setInitialScale(decalUniformScales[location]);
    setInitialRotation(decalRotations[location][2]);
    setInitialPosition([...decalPositions[location]]);
    setIsDragging(true);
    setCursorStyle("grabbing");

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((coords.x - rect.left) / rect.width) * 2 - 1,
      -((coords.y - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);

    const decal = decalRefs.current[location];
    if (decal && handle === "move") {
      const normal = new THREE.Vector3(0, 0, 1);
      decal.getWorldDirection(normal);
      const position = new THREE.Vector3().fromArray(decalPositions[location]);
      decal.localToWorld(position);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, position);

      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        const offset = intersectPoint.clone().sub(position);
        setDragOffset({ x: offset.x, y: offset.y, z: offset.z });
      }
    }

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
      setSelectedTab(null);
      setActiveHandle(null);
      setIsDragging(false);
      setCursorStyle("auto");
      controlsRef.current.enabled = true;
    }
  };

  const handlePointerMove = (event) => {
    if (!activeHandle || !isDragging) return;

    const coords = getEventCoordinates(event);
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((coords.x - rect.left) / rect.width) * 2 - 1,
      -((coords.y - rect.top) / rect.height) * 2 + 1
    );

    if (activeHandle === "rotate") {
      const deltaX = (coords.x - initialMouse.x) * 0.005;
      const rotationChange = deltaX;
      const newRotZ = initialRotation + rotationChange;
      setDecalRotations((prev) => ({
        ...prev,
        [selectedTab]: [prev[selectedTab][0], prev[selectedTab][1], newRotZ],
      }));
    } else if (activeHandle === "move") {
      raycaster.setFromCamera(mouse, camera);

      const decal = decalRefs.current[selectedTab];
      if (decal) {
        const normal = new THREE.Vector3(0, 0, 1);
        decal.getWorldDirection(normal);
        const position = new THREE.Vector3().fromArray(decalPositions[selectedTab]);
        decal.localToWorld(position);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, position);

        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
          const newPosition = intersectPoint.clone().sub(
            new THREE.Vector3(dragOffset.x, dragOffset.y, dragOffset.z)
          );
          const localPosition = decal.worldToLocal(newPosition.clone());

          // Get mesh bounds
          const bounds = meshBounds.current[selectedTab];
          if (bounds) {
            // Account for decal size to keep it within bounds
            const uniformScale = decalUniformScales[selectedTab];
            const dimensions = decalDimensions[selectedTab];
            const fontSizeAdjustment = customTexts[selectedTab]?.show ? customTexts[selectedTab].fontSize / 60 : 1;
            const decalWidth = dimensions.width * uniformScale * fontSizeAdjustment;
            const decalHeight = dimensions.height * uniformScale * fontSizeAdjustment;

            // Calculate limits considering decal size
            const xMin = bounds.min.x + decalWidth / 2;
            const xMax = bounds.max.x - decalWidth / 2;
            const yMin = bounds.min.y + decalHeight / 2;
            const yMax = bounds.max.y - decalHeight / 2;

            // Apply x and y constraints
            let newX = Math.max(xMin, Math.min(xMax, localPosition.x));
            let newY = Math.max(yMin, Math.min(yMax, localPosition.y));

            // Preserve existing x-axis limits for sleeves
            if (selectedTab === "leftSleeve") {
              newX = Math.max(-0.73, Math.min(-0.73, newX));
            } else if (selectedTab === "rightSleeve") {
              newX = Math.max(0.75, Math.min(0.75, newX));
            }

            setDecalPositions((prev) => ({
              ...prev,
              [selectedTab]: [newX, newY, prev[selectedTab][2]],
            }));
          }
        }
      }
    } else if (activeHandle === "resize") {
      const deltaX = (coords.x - initialMouse.x) * 0.005;
      let newScale = Math.max(0.05, initialScale + deltaX);

      // Apply scale limits for sleeves
      if (selectedTab === "leftSleeve" || selectedTab === "rightSleeve") {
        newScale = Math.max(0.05, Math.min(0.3, newScale));
      }

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

  return (
    <group ref={hoodieRef} position={position} rotation={[0, 0, 0]} scale={[2, 2, 2]}>
      <primitive object={scene} />
      {decalMeshes.map((mesh, index) => {
        if (!mesh) return null;
  
        const decalConfigs = [
          { position: "front", meshName: "Front", side: THREE.FrontSide },
          { position: "leftSleeve", meshName: "Left_Sleeve", side: THREE.FrontSide },
          { position: "rightSleeve", meshName: "Right_Sleeve", side: THREE.FrontSide },
          { position: "back", meshName: "Back", side: THREE.BackSide },
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
          const dimensions = decalDimensions[meshPosition];
          const scale = [
            dimensions.width * uniformScale * fontSizeAdjustment,
            dimensions.height * uniformScale * fontSizeAdjustment,
            1,
          ];
  
          // Define control icon positions dynamically
          const getIconPositions = () => {
            const halfWidth = scale[0] / 2;
            const halfHeight = scale[1] / 2;
            const zOffset = 0.01; // Small offset to avoid z-fighting
  
            // Define corner positions in the decal's local space
            const corners = {
              rotate: [-halfWidth, halfHeight, zOffset], // Top-left
              delete: [halfWidth, halfHeight, zOffset], // Top-right
              move: [-halfWidth, -halfHeight, zOffset], // Bottom-left
              resize: [halfWidth, -halfHeight, zOffset], // Bottom-right
            };
  
            // For sleeves, adjust positions based on the decal's rotation
            const isSleeve = meshPosition === "leftSleeve" || meshPosition === "rightSleeve";
            if (isSleeve) {
              const euler = new THREE.Euler(...rotation);
              const quaternion = new THREE.Quaternion().setFromEuler(euler);
              Object.keys(corners).forEach((key) => {
                const pos = new THREE.Vector3(...corners[key]);
                pos.applyQuaternion(quaternion); // Rotate to match decal orientation
                corners[key] = [pos.x, pos.y, pos.z + zOffset];
              });
            }
  
            // Transform positions to world space relative to decal position
            const iconPositions = {};
            Object.keys(corners).forEach((key) => {
              const localPos = new THREE.Vector3(...corners[key]);
              // Add the decal's position to place icons relative to it
              iconPositions[key] = [
                position[0] + localPos.x,
                position[1] + localPos.y,
                position[2] + localPos.z,
              ];
            });
  
            return iconPositions;
          };
  
          const iconPositions = getIconPositions();
  
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
                  polygonOffsetFactor={-50}
                  depthTest={false}
                  depthWrite={false}
                  renderOrder={isSelected ? 10 : 5}
                  onClick={(e) => handleDecalClick(e, meshPosition)}
                  onPointerDown={(e) => handlePointerDown(e, "move", meshPosition)}
                  onTouchStart={(e) => handlePointerDown(e, "move", meshPosition)}
                  material={
                    new THREE.MeshBasicMaterial({
                      map: textureToApply,
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
                        key={handle}
                        position={pos}
                        rotation={new THREE.Euler(...rotation)} // Align with decal rotation
                        scale={[0.05, 0.05, 1]}
                        map={iconTexture}
                        transparent={true}
                        opacity={1.0}
                        depthTest={false}
                        depthWrite={false}
                        polygonOffset={true}
                        polygonOffsetFactor={-30}
                        renderOrder={15}
                        onPointerDown={(e) => handlePointerDown(e, handle, meshPosition)}
                        onTouchStart={(e) => handlePointerDown(e, handle, meshPosition)}
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
        });
      })}
    </group>
  );
}

export default HoodieModel;
