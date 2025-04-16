// Fix Canvas and UI Layouts for Responsiveness

import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import HoodieModel from "./Hoodie";

function HoodieCustomizer() {
  const controlsRef = useRef();
  const fileInputRefs = useRef({
    rightChest: null,
    leftChest: null,
    leftSleeve: null,
    rightSleeve: null,
  });
  const [customLogos, setCustomLogos] = useState({
    front: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
  });
  const [customTexts, setCustomTexts] = useState({
    front: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 60, style: "classic", shape: "rectangle" },
    leftSleeve: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 60, style: "classic", shape: "rectangle" },
    rightSleeve: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 60, style: "classic", shape: "rectangle" },
    back: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 60, style: "classic", shape: "rectangle" },
  });
  const [downloadImageTrigger, setDownloadImageTrigger] = useState(null);
  const [downloadGLBTrigger, setDownloadGLBTrigger] = useState(null);
  const [activeTab, setActiveTab] = useState("pattern");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedTexture, setSelectedTexture] = useState("cotton");
  const [selectedEnvironment, setSelectedEnvironment] = useState("studio");
  const [selectedTab, setSelectedTab] = useState("front");
  const [patternTab, setPatternTab] = useState("collar");
  const [textureScale, setTextureScale] = useState(1);
  const [roughness, setRoughness] = useState(0.7);
  const [showAreasOnGarment, setShowAreasOnGarment] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState("checker");
  const [patternColor, setPatternColor] = useState("#FFFFFF");
  const [patternScale, setPatternScale] = useState(2);
  const [selectedTextArea, setSelectedTextArea] = useState(null);
  const [cameraFov, setCameraFov] = useState(40);
  // Add model position state that can be adjusted based on screen size
  const [modelPosition, setModelPosition] = useState([0, 0, 0]);

  const [partColors, setPartColors] = useState({
    front: "#3B82F6",
    leftSleeve: "#3B82F6",
    rightSleeve: "#3B82F6",
    back: "#3B82F6",
  });

  // Handle window resize for dynamic adjustments
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      
      // Adjust camera FOV based on aspect ratio
      setCameraFov(aspect > 1 ? 40 : 50);
      
      // Adjust model position based on screen size
      if (width < 768) { // Mobile
        setModelPosition([0, -0.2, 0]); // Move model down slightly on small screens
      } else if (width < 1024) { // Tablet
        setModelPosition([0.5, 0, 0]); // Position for medium screens
      } else  { // Desktop
        setModelPosition([0, 0.2, 0]); // Default position for large screens
      }
      
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scrollbar hiding logic (unchanged)
  useEffect(() => {
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(el => {
      el.style.msOverflowStyle = 'none';
      el.style.scrollbarWidth = 'none';
      if (!el.id) {
        el.id = `scrollable-${Math.random().toString(36).substring(2, 9)}`;
      }
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        #${el.id}::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      document.head.appendChild(styleEl);
      return () => document.head.removeChild(styleEl);
    });
  }, []);

  useEffect(() => {
    if (activeTab !== "text") {
      setSelectedTextArea(null);
    }
  }, [activeTab]);

  const handleLogoUpload = (event, position) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          const positionMapping = {
            rightChest: "front",
            leftChest: "back",
            leftSleeve: "leftSleeve",
            rightSleeve: "rightSleeve",
          };
          setCustomLogos((prev) => ({
            ...prev,
            [positionMapping[position]]: texture,
          }));
          setCustomTexts((prev) => ({
            ...prev,
            [positionMapping[position]]: { ...prev[positionMapping[position]], show: false },
          }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDecal = (position) => {
    const positionMapping = {
      back: "leftChest",
      leftSleeve: "leftSleeve",
      rightSleeve: "rightSleeve",
      front: "rightChest",
    };
    const inputId = positionMapping[position];
    setCustomLogos((prev) => ({
      ...prev,
      [position]: null,
    }));
    if (fileInputRefs.current[inputId]) {
      fileInputRefs.current[inputId].value = "";
    }
    if (customTexts[position].show) {
      setCustomTexts((prev) => ({
        ...prev,
        [position]: { ...prev[position], text: "", show: false },
      }));
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setPartColors((prev) => ({
      ...prev,
      [selectedTab]: color,
    }));
  };

  const handleTextChange = (position, field, value) => {
    setCustomTexts((prev) => {
      const updated = {
        ...prev,
        [position]: {
          ...prev[position],
          [field]: value,
        },
      };
      if (field === "text") {
        updated[position].show = value.trim() !== "";
      }
      return updated;
    });
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

  const handlePatternSelect = (patternType) => {
    setSelectedPattern(patternType);
  };

  const patternTabs = ["Collar", "Placket", "Chest Pocket", "Cuff"];
  const placementAreas = [
    { id: "rightChest", label: "Right Chest", mapping: "front" },
    { id: "leftChest", label: "Left Chest", mapping: "back" },
    { id: "leftSleeve", label: "Left Sleeve", mapping: "leftSleeve" },
    { id: "rightSleeve", label: "Right Sleeve", mapping: "rightSleeve" },
  ];
  const patternTypes = ["checker", "stripes", "circles"];
  const colors = [
    { value: "#D3D3D3", label: "Light Gray" },
    { value: "#A6B7A5", label: "Sage" },
    { value: "#9BFFA0", label: "Mint" },
    { value: "#67EDEE", label: "Turquoise" },
    { value: "#EDD067", label: "Gold" },
    { value: "#67A4ED", label: "Sky Blue" },
    { value: "#3498DB", label: "Blue" },
    { value: "#E74C3C", label: "Red" },
    { value: "#2ECC71", label: "Green" },
    { value: "#9B59B6", label: "Purple" },
  ];
  const textures = [
    { value: "cotton", label: "Cotton", imageUrl: "/Equinox.jpg" },
    { value: "fleece", label: "Fleece", imageUrl: "/Elementary.jpg" },
    { value: "knit", label: "Knit", imageUrl: "/Legend.jpg" },
    { value: "denim", label: "Denim", imageUrl: "/Legacy.jpg" },
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

  return (
    <div className="relative w-screen h-screen bg-gradient-to-l from-[#263D44] to-[#577A8B]">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: "100vw", height: "100vh" }} // Changed from 150vw to 100vw
        className="fixed top-0 left-0"
      >
        <PerspectiveCamera
          makeDefault
          position={[1, 0.25, 3.5]}
          fov={cameraFov}
        />
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
            customTexts={customTexts}
            setCustomTexts={setCustomTexts}
            onDeleteDecal={handleDeleteDecal}
            onDownloadImage={downloadImageTrigger ? handleImageDownloadComplete : null}
            onDownloadGLB={downloadGLBTrigger ? handleGLBDownloadComplete : null}
            controlsRef={controlsRef}
            partColors={partColors}
            selectedColor={selectedColor}
            selectedTexture={selectedTexture}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            textureScale={textureScale}
            roughness={roughness}
            showAreasOnGarment={showAreasOnGarment}
            selectedPattern={selectedPattern}
            patternColor={patternColor}
            patternScale={patternScale}
            position={modelPosition} // Pass dynamic position to HoodieModel
          />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.5} blur={2.5} scale={10} />
          <Environment preset="sunset" background blur={4} />
          <OrbitControls
            ref={controlsRef}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.8}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={modelPosition} // Update orbit controls target to match model position
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay - Responsive adjustments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="flex flex-col md:flex-row md:space-x-3 w-full md:w-[90%] lg:max-w-[500px] h-full md:h-[80vh] lg:ml-[15%] md:mt-[5%] rounded-md pointer-events-auto lg:items-center">
          {/* Side Navigation */}
          <div className="w-full md:w-[15%] h-[60px] md:h-[70%] mt-0 md:mt-[2%] lg:w-[21%] lg:max-h-fit bg-white/30 backdrop-blur-md backdrop-saturate-150 p-1 md:p-4 flex flex-row md:flex-col space-y-5  items-center md:pt-4 rounded-lg md:rounded-full border border-white/20 lg:py-10 lg:px-5 md:mt-[-13%]">
            <button
              onClick={() => setActiveTab("colors")}
              className={`w-[45px] h-[45px] md:w-[80%] md:h-[15%] lg:h-[13%] lg:p-3 lg:w-[150%] rounded-full flex items-center justify-center transition-all ${activeTab === "colors" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Colors"
            >
              <span className="text-lg md:text-2xl">
                <img src="/Paint.png" alt="Paint" className="w-full h-full object-contain" />
              </span>
            </button>
            <button
              onClick={() => setActiveTab("pattern")}
              className={`w-[45px] h-[45px] md:w-[80%] md:h-[15%] lg:h-[13%] lg:p-3 lg:w-[150%] rounded-full flex items-center justify-center transition-all ${activeTab === "pattern" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Pattern"
            >
              <span className="text-lg md:text-2xl">
                <img src="/Color.png" alt="Color" className="w-full h-full object-contain" />
              </span>
            </button>
            <button
              onClick={() => setActiveTab("logo")}
              className={`w-[45px] h-[45px] md:w-[80%] md:h-[15%] lg:h-[13%] lg:p-3 lg:w-[150%] rounded-full flex items-center justify-center transition-all ${activeTab === "logo" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-200"}`}
              title="Logo"
            >
              <span className="text-lg md:text-2xl">
                <img src="/Image.png" alt="image" className="w-full h-full object-contain" />
              </span>
            </button>
            <button
              onClick={() => setActiveTab("texture")}
              className={`w-[45px] h-[45px] md:w-[80%] md:h-[15%] lg:h-[13%] lg:p-3 lg:w-[150%] rounded-full flex items-center justify-center transition-all ${activeTab === "texture" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Texture"
            >
              <span className="text-lg md:text-2xl">
                <img src="/Diagonal.png" alt="Diagonal" className="w-full h-full object-contain" />
              </span>
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`w-[45px] h-[45px] md:w-[80%] md:h-[15%] lg:h-[13%] lg:p-3 lg:w-[150%] rounded-full flex items-center justify-center transition-all ${activeTab === "text" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Text"
            >
              <span className="text-lg md:text-2xl">
                <img src="/Text.png" alt="Text" className="w-full h-full object-contain" />
              </span>
            </button>
          </div>

          {/* Main Content Panel */}
          <div className="flex-1 mt-2 md:mt-0 ">
            <div className="w-full h-[65vh] bg-white/30 backdrop-blur-md backdrop-saturate-150 p-4 md:p-6 flex flex-col text-white border border-white/20 rounded-xl mt-0 md:mt-[2%] lg:w-[120%] lg:h-[65%]">
              <div className="flex-1 lg:h-[549px] overflow-y-auto ">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 capitalize">{activeTab}</h2>

                {activeTab === "pattern" && (
                  <div className="h-[520px] ">
                    <div className="flex mb-4 md:mb-6 overflow-x-auto">
                      {patternTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPatternTab(tab.toLowerCase())}
                          className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm whitespace-nowrap ${patternTab === tab.toLowerCase() ? "text-white" : "text-gray-300"}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3">Patterns</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mr-2 md:mr-3 mb-3">
                      {patternTypes.map((patternType) => (
                        <button
                          key={patternType}
                          className={`w-full aspect-square bg-gray-300 rounded-md hover:ring-2 hover:ring-white ${selectedPattern === patternType ? "ring-2 ring-white" : ""}`}
                          onClick={() => handlePatternSelect(patternType)}
                          title={patternType}
                        >
                          <img
                            src={`/patterns/${patternType}_logo.png`}
                            alt={patternType}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3">Pattern Color</h3>
                    <div className="grid grid-cols-5 gap-2 mb-3 mr-2 md:mr-3">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className={`w-full aspect-square rounded-md hover:ring-2 hover:ring-white ${patternColor === color.value ? "ring-2 ring-white" : ""}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setPatternColor(color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs md:text-sm text-gray-300">Pattern Scale</span>
                        <span className="text-xs md:text-sm text-gray-300">{patternScale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="8"
                        step="0.1"
                        value={patternScale}
                        onChange={(e) => setPatternScale(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={() => setSelectedPattern(null)}
                      className="mt-4 px-3 md:px-4 py-1 md:py-2 bg-slate-500 text-white rounded-md text-sm md:text-base"
                    >
                      Clear Pattern
                    </button>
                  </div>
                )}
                {activeTab === "colors" && (
                  <div className="h-[520px] overflow-y-auto">
                    <h3 className="text-xl font-medium mb-4 ">Apply Color to</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {placementAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => setSelectedTab(area.mapping)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedTab === area.mapping
                            ? "bg-slate-500 text-white"
                            : "bg-slate-400 text-white hover:bg-slate-500"
                          }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                    <h3 className="text-xl font-medium mb-4">
                      {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Color
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className={`w-full aspect-square rounded-md hover:ring-2 hover:ring-white ${partColors[selectedTab] === color.value ? "ring-2 ring-white" : ""}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleColorChange(color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xl font-medium mb-4">Custom Color</h3>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={partColors[selectedTab]}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={partColors[selectedTab]}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="flex-1 border border-gray-600 bg-slate-500 rounded-lg px-3 py-2 text-white"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "logo" && (
                  <div className="h-[520px] overflow-y-auto">
                    <h3 className="text-xl font-medium mb-4">Add Image</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {placementAreas.map((area) => (
                        <div key={area.id} className="flex flex-col items-center">
                          <div className="bg-slate-300 w-[80%] aspect-square rounded-md flex items-center justify-center mb-1 relative">
                            {customLogos[area.mapping] ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={customLogos[area.mapping].image.src}
                                  alt="Uploaded logo"
                                  className="w-full h-full object-cover rounded-md"
                                />
                                <button
                                  onClick={() => handleDeleteDecal(area.mapping)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`logo-upload-${area.id}`}
                                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                              >
                                <div className="p-2 rounded-md">
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 5V19M5 12H19"
                                      stroke="#888888"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <input
                                  id={`logo-upload-${area.id}`}
                                  type="file"
                                  accept="image/*"
                                  ref={(el) => (fileInputRefs.current[area.id] = el)}
                                  onChange={(e) => handleLogoUpload(e, area.id)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-center text-sm">{area.label}</p>
                          <p className="text-center text-xs text-gray-300">Max Area</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "texture" && (
                  <div className="h-[520px] overflow-y-auto">
                    <h3 className="text-xl font-medium mb-4">Material Type</h3>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {textures.map((texture) => (
                        <button
                          key={texture.value}
                          onClick={() => setSelectedTexture(texture.value)}
                          className={`w-full aspect-square rounded-lg overflow-hidden transition-all ${selectedTexture === texture.value
                            ? "ring-2 ring-white"
                            : "ring-1 ring-gray-400 hover:ring-white"
                          }`}
                        >
                          <div
                            className="w-full h-full bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${texture.imageUrl})` }}
                          ></div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-4">
                      <h3 className="text-xl font-medium mb-2">Texture Settings</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Scale</span>
                          <span className="text-sm text-gray-300">{textureScale.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.1"
                          value={textureScale}
                          onChange={(e) => setTextureScale(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "text" && (
                  <div className="h-[520px] overflow-y-auto">
                    <h3 className="text-xl font-medium mb-4">Add Text</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {placementAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setSelectedTab(area.mapping);
                            setSelectedTextArea(area.mapping);
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedTab === area.mapping
                            ? "bg-slate-500 text-white"
                            : "bg-slate-400 text-white hover:bg-slate-500"
                          }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {selectedTextArea ? (
                        <>
                          <label className="block">
                            <span className="text-white font-medium mb-2 block">
                              Custom Text for{" "}
                              {selectedTextArea.charAt(0).toUpperCase() +
                                selectedTextArea.slice(1)}
                            </span>
                            <input
                              type="text"
                              placeholder="Enter your text"
                              value={customTexts[selectedTextArea].text}
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "text",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 bg-slate-500 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white"
                            />
                          </label>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white">Text Color</span>
                            <input
                              type="color"
                              value={customTexts[selectedTextArea].color}
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="h-8 w-8 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white">Background</span>
                            <input
                              type="color"
                              value={
                                customTexts[selectedTextArea].background.startsWith("#")
                                  ? customTexts[selectedTextArea].background
                                  : "#FFFFFF"
                              }
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "background",
                                  e.target.value
                                )
                              }
                              className="h-8 w-8 rounded cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-white">Font Size</span>
                              <span className="text-sm text-white">
                                {customTexts[selectedTextArea].fontSize}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="100"
                              step="1"
                              value={customTexts[selectedTextArea].fontSize}
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "fontSize",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-white">Text Style</span>
                            <select
                              value={customTexts[selectedTextArea].style}
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "style",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 bg-slate-500 border border-slate-400 rounded-lg text-white"
                            >
                              <option value="classic">Classic</option>
                              <option value="bold">Bold</option>
                              <option value="fancy">Fancy</option>
                              <option value="modern">Modern</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-white">Text Shape</span>
                            <select
                              value={customTexts[selectedTextArea].shape}
                              onChange={(e) =>
                                handleTextChange(
                                  selectedTextArea,
                                  "shape",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 bg-slate-500 border border-slate-400 rounded-lg text-white"
                            >
                              <option value="rectangle">Rectangle</option>
                              <option value="circle">Circle</option>
                              <option value="oval">Oval</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-300">
                          Please select a placement area to add text.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 py-2 pb-2 mr-[-76px]">
              <button
                onClick={handleGLBDownload}
                className="px-6 md:px-8 py-2 md:py-3 bg-white/10 backdrop-blur-md text-white rounded-md hover:bg-white/20 shadow-md border border-white/30 text-sm md:text-base"
              >
                Save
              </button>
              <button
                onClick={handleImageDownload}
                className="px-6 md:px-8 py-2 md:py-3 bg-white/10 backdrop-blur-md text-white rounded-md hover:bg-white/20 shadow-md border border-white/30 text-sm md:text-base"
              >
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoodieCustomizer;