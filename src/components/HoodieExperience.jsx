import React, { useRef, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
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
  ChevronLeft,
} from "lucide-react";

// HoodieModel Component
import HoodieModel from "./Hoodie";

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
    <div className="flex items-center justify-center h-6 w-6">{icon}</div>
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
      selected
        ? "ring-4 ring-indigo-500 scale-105 shadow-md"
        : "ring-1 ring-gray-200 hover:scale-105"
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
      selected
        ? "ring-4 ring-indigo-500 scale-105 shadow-md"
        : "ring-1 ring-gray-200 hover:scale-105"
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
      selected
        ? "ring-4 ring-indigo-500 scale-105 shadow-md"
        : "ring-1 ring-gray-200 hover:scale-105"
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
      selected
        ? "ring-4 ring-indigo-500 scale-105 shadow-md"
        : "ring-1 ring-gray-200 hover:scale-105"
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
  const [customLogos, setCustomLogos] = useState({
    chest: null,
    arms: null,
    back: null,
  });
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
  const [selectedTextShape, setSelectedTextShape] = useState("rectangle");
  const [textColor, setTextColor] = useState("#000000"); // New: Text color
  const [backgroundColor, setBackgroundColor] = useState("rgba(255, 255, 255, 0.8)"); // New: Background color
  const [fontSize, setFontSize] = useState(60); // New: Font size
  const [textureScale, setTextureScale] = useState(1); // New: Texture scale
  const [roughness, setRoughness] = useState(0.7); // New: Roughness

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
          setCustomLogos((prev) => ({
            ...prev,
            [selectedTab]: texture,
          }));
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
    {
      value: "fleece",
      label: "Fleece",
      image: "/Hoodie/Fabric Upholstery Pyramids_diffuse.png",
    },
    { value: "knit", label: "Knit", image: "/Hoodie/Fabric_Normal.jpg" },
    {
      value: "denim",
      label: "Denim",
      image: "/Hoodie/FabricUpholsteryBrightAnglePattern001_COL_VAR1_1K.jpg",
    },
    { value: "leather", label: "Leather", image: "/Hoodie/Floral.jpg" },
  ];

  const environments = [
    "sunset",
    "dawn",
    "night",
    "warehouse",
    "forest",
    "apartment",
    "studio",
    "city",
    "park",
    "lobby",
  ];

  const tabs = [
    { id: "chest", label: "Chest" },
    { id: "arms", label: "Arms" },
    { id: "back", label: "Back" },
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

        <div
          className={`flex h-full transition-all duration-300 absolute md:relative z-10 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
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
              <h2 className="text-xl font-semibold text-gray-800 mb-6 capitalize">
                {activeTab}
              </h2>

              {activeTab === "pattern" && (
                <div className="space-y-6 ml-2">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Placement</h3>
                    <div className="flex flex-wrap gap-2">
                      {tabs.map((tab) => (
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Pattern Style
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        "Stripes",
                        "Dots",
                        "Zigzag",
                        "Waves",
                        "Checks",
                        "Floral",
                      ].map((pattern) => (
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Base Colors
                    </h3>
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Accent Colors
                    </h3>
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Custom Color
                    </h3>
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
                      <span className="text-gray-700 font-medium mb-2 block">
                        Upload Custom Logo for {selectedTab}
                      </span>
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Material Type
                    </h3>
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Texture Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Scale</span>
                          <span className="text-xs text-gray-500">{textureScale.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={textureScale}
                          onChange={(e) => setTextureScale(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Roughness</span>
                          <span className="text-xs text-gray-500">{roughness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={roughness}
                          onChange={(e) => setRoughness(parseFloat(e.target.value))}
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
                      <span className="text-gray-700 font-medium mb-2 block">
                        Add Custom Text
                      </span>
                      <input
                        type="text"
                        placeholder="Enter your text here"
                        value={customText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">Text Color</h3>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">Background Color</h3>
                      <input
                        type="color"
                        value={backgroundColor.startsWith("#") ? backgroundColor : "#FFFFFF"}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">Font Size</h3>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{fontSize}px</span>
                    </div>
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Lighting & Background
                    </h3>
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
            <PerspectiveCamera makeDefault position={[0, 0.25, 3.5]} fov={40} />
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshBasicMaterial color="blue" wireframe />
                </mesh>
              }
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
              <HoodieModel
                customLogos={customLogos}
                customText={customText}
                showText={showText}
                textStyle={selectedTextStyle}
                textShape={selectedTextShape}
                textColor={textColor} // Pass new text properties
                backgroundColor={backgroundColor}
                fontSize={fontSize}
                onDownloadImage={
                  downloadImageTrigger ? handleImageDownloadComplete : null
                }
                onDownloadGLB={
                  downloadGLBTrigger ? handleGLBDownloadComplete : null
                }
                controlsRef={controlsRef}
                selectedColor={selectedColor}
                selectedTexture={selectedTexture}
                selectedTab={selectedTab}
                textureScale={textureScale} // Pass texture scale
                roughness={roughness} // Pass roughness
              />
              <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.5}
                blur={2.5}
                scale={10}
              />
              <Environment preset={selectedEnvironment} />
              <OrbitControls
                ref={controlsRef}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.8}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                target={[0, 0, 0]}
                minDistance={2}
                maxDistance={10}
              />
            </Suspense>
          </Canvas>

          <div className="absolute top-4 left-4 flex items-center">
            <img
              src="/Hoodie/newUI/Paint Palette.png"
              alt="Ikarus Logo"
              className="w-[137px] h-[46px] bg-slate-950 rounded-lg p-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoodieCustomizer;