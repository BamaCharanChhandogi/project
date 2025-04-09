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

// HoodieModel Component
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

// Redesigned UI Components
const ToolbarButton = ({ icon, active, onClick, label, className = "" }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-4 transition-all duration-200 rounded-xl ${
      active 
        ? "bg-indigo-600 text-white shadow-lg" 
        : "bg-white text-gray-700 hover:bg-gray-100"
    } ${className}`}
    title={label}
  >
    <div className="flex items-center justify-center h-6 w-6">
      {icon}
    </div>
    <span className="text-xs font-medium mt-2">{label}</span>
    {active && (
      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-indigo-600 rounded-l-md"></div>
    )}
  </button>
);

const SwatchButton = ({ color, selected, onClick, label }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-full transition-all duration-200 shadow-sm ${
      selected 
        ? "ring-4 ring-indigo-500 scale-110 shadow-md" 
        : "ring-2 ring-gray-200 hover:scale-105"
    }`}
    style={{ backgroundColor: color }}
    title={label}
  />
);

const TextureButton = ({ texture, selected, onClick, image }) => (
  <button
    onClick={onClick}
    className={`w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
      selected ? "ring-4 ring-indigo-500 scale-105 shadow-md" : "ring-1 ring-gray-200 hover:scale-105"
    }`}
    title={texture}
  >
    <div className="w-full h-full relative">
      <div 
        className="absolute inset-0" 
        style={{ backgroundImage: `url(${image})`, backgroundSize: "cover" }}
      ></div>
      <div className="absolute bottom-0 w-full bg-black bg-opacity-60 py-1 px-2">
        <span className="text-xs font-medium text-white">{texture}</span>
      </div>
    </div>
  </button>
);

const EnvironmentButton = ({ env, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
      selected ? "ring-4 ring-indigo-500 scale-105 shadow-md" : "ring-1 ring-gray-200 hover:scale-105"
    }`}
    title={env}
  >
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
      <span className="text-sm font-medium text-gray-800 capitalize">{env}</span>
    </div>
  </button>
);

const StyleButton = ({ style, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
      selected ? "ring-4 ring-indigo-500 scale-105 shadow-md" : "ring-1 ring-gray-200 hover:scale-105"
    }`}
    title={style}
  >
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <span className="text-sm font-medium text-gray-800 capitalize">{style}</span>
    </div>
  </button>
);

const ShapeButton = ({ shape, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
      selected ? "ring-4 ring-indigo-500 scale-105 shadow-md" : "ring-1 ring-gray-200 hover:scale-105"
    }`}
    title={shape}
  >
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <span className="text-sm font-medium text-gray-800 capitalize">{shape}</span>
    </div>
  </button>
);

// Main HoodieCustomizer Component
function HoodieCustomizer() {
  const controlsRef = useRef();
  const [customLogo, setCustomLogo] = useState(null);
  const [customText, setCustomText] = useState("");
  const [showText, setShowText] = useState(false);
  const [downloadImageTrigger, setDownloadImageTrigger] = useState(null);
  const [downloadGLBTrigger, setDownloadGLBTrigger] = useState(null);
  const [activeTab, setActiveTab] = useState("color");
  const [selectedColor, setSelectedColor] = useState("#f8f8f8");
  const [selectedTexture, setSelectedTexture] = useState("cotton");
  const [selectedEnvironment, setSelectedEnvironment] = useState("studio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState("chest");
  const [selectedTextStyle, setSelectedTextStyle] = useState("classic");
  const [selectedTextShape, setSelectedTextShape] = useState("rectangle"); // Default shape

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          setCustomLogo(texture);
          setShowText(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (text) => {
    setCustomText(text);
    if (text.trim()) {
      setShowText(true);
    } else {
      setShowText(false);
    }
  };

  const handleImageDownload = () => setDownloadImageTrigger(Date.now());
  const handleGLBDownload = () => setDownloadGLBTrigger(Date.now());

  const handleImageDownloadComplete = (dataURL) => {
    if (dataURL) {
      const link = document.createElement("a");
      link.download = "custom_hoodie_design.png";
      link.href = dataURL;
      link.click();
      setDownloadImageTrigger(null);
    }
  };

  const handleGLBDownloadComplete = (url) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = "custom_hoodie.glb";
      link.click();
      URL.revokeObjectURL(url);
      setDownloadGLBTrigger(null);
    }
  };

  const colors = [
    { value: "#ffffff", label: "White" },
    { value: "#f3f4f6", label: "Light Gray" },
    { value: "#9ca3af", label: "Gray" },
    { value: "#4b5563", label: "Dark Gray" },
    { value: "#111827", label: "Black" },
    { value: "#ef4444", label: "Red" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Yellow" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#0891b2", label: "Cyan" },
  ];

  const textures = [
    { value: "cotton", label: "Cotton", image: "/Hoodie/Alpaca_BaseColor.png" },
    { value: "fleece", label: "Fleece", image: "/Hoodie/Fabric Upholstery Pyramids_diffuse.png" },
    { value: "knit", label: "Knit", image: "/Hoodie/Fabric_Normal.jpg" },
    { value: "denim", label: "Denim", image: "/Hoodie/FabricUpholsteryBrightAnglePattern001_COL_VAR1_1K.jpg" },
    { value: "leather", label: "Leather", image: "/Hoodie/Floral.jpg" },
  ];

  const environments = [
    "sunset", "dawn", "night", "warehouse", "forest",
    "apartment", "studio", "city", "park", "lobby"
  ];

  const tabs = [
    { id: "collar", label: "Collar" },
    { id: "placket", label: "Placket" },
    { id: "chest", label: "Chest" },
    { id: "pocket", label: "Pocket" },
    { id: "cuff", label: "Cuff" },
  ];

  const textStyles = ["classic", "bold", "fancy", "modern"];
  const textShapes = ["rectangle", "circle", "oval"];

  return (
    <div className="flex h-screen bg-slate-600">
      <div className="flex flex-1 overflow-hidden">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed z-20 left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-r-lg shadow-lg"
        >
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        
        <div className={`flex h-full transition-all duration-300 absolute md:relative z-10 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="w-20 bg-gray-100 shadow-inner p-2 flex flex-col space-y-2">
            <ToolbarButton
              icon={<Palette className="h-6 w-6" />}
              active={activeTab === "pattern"}
              onClick={() => setActiveTab("pattern")}
              label="Pattern"
              className="mb-2"
            />
            <ToolbarButton
              icon={<Droplet className="h-6 w-6" />}
              active={activeTab === "color"}
              onClick={() => setActiveTab("color")}
              label="Color"
            />
            <ToolbarButton
              icon={<ImageIcon className="h-6 w-6" />}
              active={activeTab === "logo"}
              onClick={() => setActiveTab("logo")}
              label="Logo"
            />
            <ToolbarButton
              icon={<BadgeHelp className="h-6 w-6" />}
              active={activeTab === "texture"}
              onClick={() => setActiveTab("texture")}
              label="Texture"
            />
            <ToolbarButton
              icon={<Text className="h-6 w-6" />}
              active={activeTab === "text"}
              onClick={() => setActiveTab("text")}
              label="Text"
            />
            <ToolbarButton
              icon={<Sun className="h-6 w-6" />}
              active={activeTab === "environment"}
              onClick={() => setActiveTab("environment")}
              label="Environment"
            />
          </div>

          <div className="w-72 bg-gray-100 p-6 shadow-lg flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 capitalize">{activeTab}</h2>

              {activeTab === "pattern" && (
                <div className="space-y-6 ml-2">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Placement</h3>
                    <div className="flex flex-wrap gap-2">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedTab(tab.id)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            selectedTab === tab.id
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Pattern Style</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {["Stripes", "Dots", "Zigzag", "Waves", "Checks", "Floral"].map(pattern => (
                        <div 
                          key={pattern}
                          className="aspect-square bg-gray-100 rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-500 flex items-center justify-center text-xs font-medium text-gray-600"
                        >
                          {pattern}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "color" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Base Colors</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {colors.slice(0, 5).map((color) => (
                        <SwatchButton
                          key={color.value}
                          color={color.value}
                          label={color.label}
                          selected={selectedColor === color.value}
                          onClick={() => setSelectedColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Accent Colors</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {colors.slice(5).map((color) => (
                        <SwatchButton
                          key={color.value}
                          color={color.value}
                          label={color.label}
                          selected={selectedColor === color.value}
                          onClick={() => setSelectedColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Custom Color</h3>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="color" 
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "logo" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <label className="block mb-4">
                      <span className="text-gray-700 font-medium mb-2 block">Upload Custom Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "texture" && (
                <div className="space-y-6 ml-2">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Material Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {textures.map((texture) => (
                        <TextureButton
                          key={texture.value}
                          texture={texture.label}
                          image={texture.image}
                          selected={selectedTexture === texture.value}
                          onClick={() => setSelectedTexture(texture.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Texture Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Scale</span>
                          <span className="text-xs text-gray-500">1.0x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          defaultValue="1"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Roughness</span>
                          <span className="text-xs text-gray-500">0.7</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue="0.7"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "text" && (
                <div className="space-y-6 ml-2">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <label className="block mb-4">
                      <span className="text-gray-700 font-medium mb-2 block">Add Custom Text</span>
                      <input
                        type="text"
                        placeholder="Enter your text here"
                        value={customText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Text Style</h3>
                    <div className="flex flex-wrap gap-2">
                      {textStyles.map((style) => (
                        <StyleButton
                          key={style}
                          style={style}
                          selected={selectedTextStyle === style}
                          onClick={() => setSelectedTextStyle(style)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Text Shape</h3>
                    <div className="flex flex-wrap gap-2">
                      {textShapes.map((shape) => (
                        <ShapeButton
                          key={shape}
                          shape={shape}
                          selected={selectedTextShape === shape}
                          onClick={() => setSelectedTextShape(shape)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "environment" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Lighting & Background</h3>
                    <div className="flex flex-wrap gap-2">
                      {environments.map((env) => (
                        <EnvironmentButton
                          key={env}
                          env={env}
                          selected={selectedEnvironment === env}
                          onClick={() => setSelectedEnvironment(env)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 mb-14 pt-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <button 
                  onClick={handleGLBDownload}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                </button>
                <button 
                  onClick={handleImageDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg shadow-md flex items-center justify-center"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={45} />
            <Suspense fallback={<mesh><boxGeometry args={[0.5, 0.5, 0.5]} /><meshBasicMaterial color="blue" wireframe /></mesh>}>
              <ambientLight intensity={0.5} />
              <HoodieModel
                customLogo={customLogo}
                customText={customText}
                showText={showText}
                textStyle={selectedTextStyle}
                textShape={selectedTextShape}
                onDownloadImage={downloadImageTrigger ? handleImageDownloadComplete : null}
                onDownloadGLB={downloadGLBTrigger ? handleGLBDownloadComplete : null}
                controlsRef={controlsRef}
                selectedColor={selectedColor}
                selectedTexture={selectedTexture}
              />
              <ContactShadows position={[0, -0.5, 0]} opacity={0.4} blur={2} scale={10} />
              <Environment preset={selectedEnvironment} />
              <OrbitControls
                ref={controlsRef}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.5}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
              />
            </Suspense>
          </Canvas>

          <div className="absolute top-4 left-4 flex items-center">
            <img src="/Hoodie/newUI/Paint Palette.png" alt="Ikarus Logo" className="w-[137px] h-[46px] bg-slate-950 rounded-lg p-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoodieCustomizer;