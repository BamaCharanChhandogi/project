
import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import VideoLoader from './Vedio'
import HoodieModel from "./Hoodie";
import CustomEnvironment from "./CustomEnvironment";

function HoodieCustomizer() {
  const controlsRef = useRef();
  const fileInputRefs = useRef({
    rightChest: null,
    leftChest: null,
    leftSleeve: null,
    rightSleeve: null,
  });
  const [clearPatternTrigger, setClearPatternTrigger] = useState(null);
  const [customLogos, setCustomLogos] = useState({
    front: null,
    leftSleeve: null,
    rightSleeve: null,
    back: null,
  });
  const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const [customTexts, setCustomTexts] = useState({
    front: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 140, style: "classic", shape: "rectangle" },
    leftSleeve: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 140, style: "classic", shape: "rectangle" },
    rightSleeve: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 140, style: "classic", shape: "rectangle" },
    back: { text: "", show: false, color: "#000000", background: "transparent", fontSize: 140, style: "classic", shape: "rectangle" },
  });
 
  const [downloadImageTrigger, setDownloadImageTrigger] = useState(null);
  const [downloadGLBTrigger, setDownloadGLBTrigger] = useState(null);
  const [activeTab, setActiveTab] = useState("colors");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [selectedTexture, setSelectedTexture] = useState("null"); // Changed to null
  const [selectedEnvironment, setSelectedEnvironment] = useState("studio");
  const [selectedTab, setSelectedTab] = useState("front");
  const [patternTab, setPatternTab] = useState("Front");
  const [textureScale, setTextureScale] = useState(1);

  const [roughness, setRoughness] = useState(0.7);
  const [showAreasOnGarment, setShowAreasOnGarment] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null); // Changed to null
  const [patternColor, setPatternColor] = useState("#FFFFFF");
  const [patternScale, setPatternScale] = useState(2);
  const [patternOpacity, setPatternOpacity] = useState(1.0);
  const [selectedTextArea, setSelectedTextArea] = useState(null);
  const [cameraFov, setCameraFov] = useState(40);
  const [modelPosition, setModelPosition] = useState([0, 0, 0]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [partColors, setPartColors] = useState({
    front: "#FFFFFF",
    leftSleeve: "#FFFFFF",
    rightSleeve: "#FFFFFF",
    back: "#FFFFFF",
  });

  const handleKeyDown = (e, position) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior
      setCustomTexts((prevTexts) => {
        const updated = {
          ...prevTexts,
          [position]: {
            ...prevTexts[position],
            text: prevTexts[position].text + "\n",
          },
        };
        console.log(`Updated text for ${position}:`, updated[position].text); // Debug log
        return updated;
      });
    }
  };
  const calculateProgress = (value) => {
    const min = 2.0; // Match your min value
    const max = 8.0; // Match your max value
    return ((value - min) / (max - min)) * 100;
  };
  // useEffect(() => {
  //   if (clearPatternTrigger) {
  //     setClearPatternTrigger(null); // Reset after processing
  //   }
  // }, [clearPatternTrigger]);
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      setCameraFov(aspect > 1 ? 40 : 50);

      if (width < 768) {
        setModelPosition([0, -0.2, 0]);
      } else if (width < 1024) {
        setModelPosition([0.5, 0, 0]);
      } else if (width < 1280) {
        setModelPosition([0.5, 0, 0]);
      } else if (width >= 1280 && width < 1536) {
        setModelPosition([1, 1, 0]);
      } else {
        setModelPosition([2, 0, 0]);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const CustomDropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative w-[99%] ml-1" ref={dropdownRef}>
        <div
          className="w-full p-2 bg-white/30 backdrop-blur-xl rounded-lg text-gray-500 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white/30 backdrop-blur-xl  rounded-lg z-10">
            {options.map((option) => (
              <div
                key={option}
                className="p-2 hover:bg-white/50 cursor-pointer text-gray-500"
                onClick={() => {
                  onChange({ target: { value: option } });
                  setIsOpen(false);
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    const styleElements = [];

    scrollableElements.forEach((el) => {
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
      styleElements.push(styleEl);
    });

    return () => {
      styleElements.forEach((styleEl) => {
        if (document.head.contains(styleEl)) {
          document.head.removeChild(styleEl);
        }
      });
    };
  }, [activeTab, selectedTextArea]);

  useEffect(() => {
    if (activeTab !== "text") {
      setSelectedTextArea(null);
    }
  }, [activeTab]);
  // useEffect(() => {
  //   const range = document.querySelector('.custom-range-slider');
  //   if (range) {
  //     const min = parseFloat(range.min) || 0.8;
  //     const max = parseFloat(range.max) || 2;
  //     const value = parseFloat(range.value);
  //     const percentage = ((value - min) / (max - min)) * 100;
  //     range.style.setProperty('--range-progress', `${percentage}%`);
  //   }
  // }, [textureScale]);
  useEffect(() => {
    const updateRangeProgress = () => {
      const range = document.querySelector('.custom-range-slider');
      if (range) {
        const min = 1; // Match your actual min value
        const max = 2; // Match your actual max value
        const value = parseFloat(range.value);
        const percentage = ((value - min) / (max - min)) * 100;
        range.style.setProperty('--range-progress', `${percentage}%`);
      }
    };

    // Run immediately on mount
    updateRangeProgress();

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRangeProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [textureScale]); // Keep textureScale in dependencies
  // Calculate the percentage for the slider based on current value
  const calculateProgress2 = (value) => {
    const min = 1; // Match your min value
    const max = 2; // Match your max value
    return ((value - min) / (max - min)) * 100;
  };
  // useEffect(() => {
  //   const range = document.querySelector('.custom-range-slider');
  //   if (range) {
  //     const min = parseFloat(range.min) || 0.8;
  //     const max = parseFloat(range.max) || 2;
  //     const value = parseFloat(range.value);
  //     const percentage = ((value - min) / (max - min)) * 100;
  //     range.style.setProperty('--range-progress', `${percentage}%`);
  //   }
  // }, [patternScale]);
  // Make sure the useEffect runs on component mount
  useEffect(() => {
    const updateRangeProgress = () => {
      const range = document.querySelector('.custom-range-slider');
      if (range) {
        const min = parseFloat(range.min) || 2.0; // Match your actual min value
        const max = parseFloat(range.max) || 8.0; // Match your actual max value
        const value = parseFloat(range.value);
        const percentage = ((value - min) / (max - min)) * 100;
        range.style.setProperty('--range-progress', `${percentage}%`);
      }
    };

    // Run immediately on mount
    updateRangeProgress();

    // Optional: Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(updateRangeProgress);
    const range = document.querySelector('.custom-range-slider');
    if (range) {
      observer.observe(range, { attributes: true });
    }

    // Clean up
    return () => {
      if (observer) observer.disconnect();
    };
  }, [patternScale]); // Keep patternScale in dependencies
  useEffect(() => {
    const range = document.querySelector('.custom-range-slider');
    if (range) {
      const min = parseFloat(range.min) || 0.8;
      const max = parseFloat(range.max) || 2;
      const value = parseFloat(range.value);
      const percentage = ((value - min) / (max - min)) * 100;
      range.style.setProperty('--range-progress', `${percentage}%`);
    }
  }, [patternOpacity]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const range = document.querySelector('.custom-range-slider');
        if (range) {
          range.style.setProperty('--range-progress', `${calculateProgress(patternScale)}%`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [patternScale]);

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
    if (selectedTab === "all") {
      // Update all parts with the selected color
      setPartColors({
        front: color,
        leftSleeve: color,
        rightSleeve: color,
        back: color,
      });
    } else {
      // Update only the selected part
      setPartColors((prev) => ({
        ...prev,
        [selectedTab]: color,
      }));
    }
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
  const tabToPositionMap = {
    'front': 'front',
    'back': 'back',
    'left sleeve': 'leftSleeve',
    'right sleeve': 'rightSleeve'
  };
  const handleClearPattern = () => {
    // Make sure patternTab is defined and has correct case
    if (!patternTab) return;

    const position = tabToPositionMap[patternTab.toLowerCase()];
    console.log("Clearing pattern at position:", position);

    // Verify the position is valid
    if (!position) {
      console.error("Invalid position mapping for tab:", patternTab);
      return;
    }

    setSelectedPattern(null);
    setClearPatternTrigger(position);
  };
  const handlePatternCleared = () => {
    console.log("Pattern cleared callback received");
    setClearPatternTrigger(null);
  };
  const handlePatternSelect = (patternType) => {
    setSelectedPattern(patternType);
  };

  const patternTabs = ["Front", "Back", "left Sleeve", "Right Sleeve"];
  const placementAreas = [
    { id: "rightChest", label: "Front", mapping: "front" },
    { id: "leftChest", label: "Back", mapping: "back" },
    { id: "leftSleeve", label: "Left Sleeve", mapping: "leftSleeve" },
    { id: "rightSleeve", label: "Right Sleeve", mapping: "rightSleeve" },
    { id: "all", label: "All", mapping: "all" },
  ];
  const placementAreas2 = [
    { id: "rightChest", label: "Front", mapping: "front" },
    { id: "leftChest", label: "Back", mapping: "back" },
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
    { value: "cotton", label: "Cotton", imageUrl:"/8_flannelette tartan fabric texture-seamless.jpg" },
    { value: "fleece", label: "Fleece", imageUrl:"/14_acrylic fabric tartan wallpapers texture-seamless.jpg" },
    { value: "knit", label: "Knit", imageUrl:"/15_wool flannel fabric texture-seamless.jpg" },
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
  ]
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  return (
    <div className="overflow-hidden w-screen h-screen bg-gradient-to-l from-[#2e4650] to-[#456674]">
       {!isModelLoaded && <VideoLoader />}
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{
          width:
            window.innerWidth >= 1536 ? "130vw" :
              window.innerWidth >= 1280 ? "160vw" :
                "100vw",
          height: "100vh",
          transition: "transform 0.7s ease-in-out",
          transform:
            window.innerWidth < 1280 && panelVisible
              ? "translateY(-15vh)"
              : "translateY(0)"
        }}

        className="fixed top-0 left-0"
      >
        <PerspectiveCamera
          makeDefault
          position={[1, 0.25, 3.5]}
          fov={cameraFov}
        />
        <Suspense
          fallback={
            null
          }
        >
          
          <ambientLight intensity={0.1} />
          <directionalLight position={[5, 5, 5]} intensity={0.3} castShadow />
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
            patternOpacity={patternOpacity}
            position={modelPosition}
            activeTab={patternTab}
            onClearPattern={clearPatternTrigger}
            onPatternCleared={handlePatternCleared}
            onLoaded={() => setIsModelLoaded(true)}
          />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.5} blur={2.5} scale={10} />
          {/* <Environment preset="sunset" background blur={4} /> */}

          <CustomEnvironment
            path="/customizer-bg.jpg"
            intensity={7} // Adjust this value between 0.1-0.5 to control brightness
            blur={0.5} // Optional slight blur 
          />
          <OrbitControls
            ref={controlsRef}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.8}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={modelPosition}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay - Modified to use mobile layout for both small and medium screens */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className=" flex flex-col xl:flex-row xl:space-x-3 w-full xl:w-[90%] xl:max-w-[500px] h-full xl:h-[80vh] xl:ml-[15%] xl:mt-[5%] rounded-md pointer-events-none xl:items-center">
          {/* Side Navigation - Mobile/Medium: at top, Desktop: at left */}
          <div className="w-[80%] rounded-full mt-[7%] md:mt-[5%] sm:w-[50%] mx-auto xl:w-[18%] 2xl:max-h-[90%] lg:h-[13%] 2xl:w-[21%] 3xl:w-[23%] h-[70px] xl:h-fit xl:max-h-fit 3xl:max-h-fit bg-white/30 backdrop-blur-md backdrop-saturate-150 p-1 xl:p-4 flex flex-row justify-center xl:flex-col space-y-0 xl:space-y-4 md:space-x-6 space-x-2 xl:space-x-0 items-center xl:pt-4 2xl:pt-9 3xl:pt-4 xl:rounded-full xl:py-10 xl:px-6 xl:mt-[5%] 2xl:mt-[10%] 3xl:mt-[5%] 2xl:space-y-6 3xl:space-y-10">
            <button
              onClick={() => {
                setActiveTab("colors");
                // For mobile and medium - toggle panel visibility
                if (window.innerWidth < 1280) {
                  setPanelVisible(prev => activeTab === "colors" ? !prev : true);
                }
              }}
              className={`min-h-[45px] aspect-square 2xl:min-h-[80px] 3xl:min-h-[90px] xl:min-h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto ${activeTab === "colors" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Colors"
            >
              <span className="text-lg xl:text-2xl w-[70%] xl:w-[60%] 2xl:w-[70%]">
                <img src="/patterns/Paint Palette.svg" alt="Paint" className="w-full h-full object-contain"
                  style={{ filter: "invert(50%) sepia(0%) saturate(0%) hue-rotate(153deg) brightness(91%) contrast(93%)" }} />
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("pattern");
                // For mobile and medium - toggle panel visibility
                if (window.innerWidth < 1280) {
                  setPanelVisible(prev => activeTab === "pattern" ? !prev : true);
                }
              }}
              className={`min-h-[45px] aspect-square 2xl:min-h-[80px] 3xl:min-h-[90px] xl:min-h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto ${activeTab === "pattern" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Pattern"
            >
              <span className="text-lg xl:text-2xl w-[70%] xl:w-[60%] 2xl:w-[70%]">

                <img
                  src="/patterns/Fill Color.svg"
                  alt="Color"
                  className="w-full h-full object-contain"
                  style={{ filter: "invert(50%) sepia(0%) saturate(0%) hue-rotate(153deg) brightness(91%) contrast(93%)" }}
                />


              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("logo");
                // For mobile and medium - toggle panel visibility
                if (window.innerWidth < 1280) {
                  setPanelVisible(prev => activeTab === "logo" ? !prev : true);
                }
              }}
              className={`min-h-[45px] aspect-square 2xl:min-h-[80px] 3xl:min-h-[90px] xl:min-h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto ${activeTab === "logo" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Logo"
            >
              <span className="text-lg xl:text-2xl w-[70%] xl:w-[60%] 2xl:w-[70%]">
                <img src="/patterns/Add Image.svg" alt="image" className="w-full h-full object-contain"
                  style={{ filter: "invert(50%) sepia(0%) saturate(0%) hue-rotate(153deg) brightness(91%) contrast(93%)" }} />
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("texture");
                // For mobile and medium - toggle panel visibility
                if (window.innerWidth < 1280) {
                  setPanelVisible(prev => activeTab === "texture" ? !prev : true);
                }
              }}

              className={`min-h-[45px]  aspect-square 2xl:min-h-[80px] 3xl:min-h-[90px] xl:min-h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto ${activeTab === "texture" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Texture"
            >
              <span className="text-lg xl:text-2xl w-[60%] xl:w-[60%] 2xl:w-[60%]">
                <img
                  src="/patterns/Diagonal Lines (1).svg"
                  alt="Diagonal"
                  className="w-full h-full object-contain"
                  style={{ filter: "invert(50%) sepia(0%) saturate(0%) hue-rotate(153deg) brightness(91%) contrast(93%)" }}
                />
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("text");
                // For mobile and medium - toggle panel visibility
                if (window.innerWidth < 1280) {
                  setPanelVisible(prev => activeTab === "text" ? !prev : true);
                }
              }}
              className={`min-h-[45px] aspect-square 2xl:min-h-[80px] 3xl:min-h-[90px] xl:min-h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto ${activeTab === "text" ? "bg-white text-gray-600" : "bg-[#D9D9D9] text-gray-700 hover:bg-gray-300"}`}
              title="Text"
            >
              <span className="text-lg xl:text-2xl w-[60%] xl:w-[60%] 2xl:w-[60%]">
                <img src="/patterns/Text.svg" alt="Text" className="w-full h-full object-contain"
                  style={{ filter: "invert(50%) sepia(0%) saturate(0%) hue-rotate(153deg) brightness(91%) contrast(93%)" }} />
              </span>
            </button>
          </div>

          {/* Main Content Panel - Mobile/Medium: slide up from bottom when active, Desktop: always visible */}
          <div className="flex-1 mt-2 xl:mt-0 pointer-events-none">
            {/* Panel is conditionally rendered for mobile and medium, always shown for large screens */}
            <div
              className={`${window.innerWidth < 1280 && !panelVisible ? 'translate-y-full' : 'translate-y-0'}  transition-transform duration-700 ease-in-out 
              w-full h-[45vh] xl:w-[100%] 2xl:w-[105%] 3xl:w-[120%] xl:h-[25rem] 2xl:h-[31rem] 3xl:h-[40rem] backdrop-blur-md backdrop-saturate-150 
              p-4 xl:p-6 flex flex-col text-white  bg-white/30 xl:rounded-xl
               mt-0 xl:mt-[30%] fixed bottom-0 left-0 xl:relative xl:transform-none pointer-events-auto`}
            >
              {/* Close button for mobile and medium view */}
              {window.innerWidth < 1280 && (
                <button
                  onClick={() => setPanelVisible(false)}
                  className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              <div className="flex-1 xl:max-w-[full] xl:max-h-full overflow-y-auto">
                <h2 className="text-xl xl:text-2xl font-semibold mb-4 xl:mb-6 capitalize ml-1">{activeTab}</h2>

                {/* Tab content remains the same */}
                {activeTab === "pattern" && (
                  <div className="h-[520px]">
                    <div className="flex mb-4 xl:mb-6">
                      {patternTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPatternTab(tab.toLowerCase())}
                          className={`px-0 xl:px-0 py-1 mr-6 xl:py-2 text-xs xl:text-sm whitespace-nowrap text-left ml-1 ${patternTab === tab.toLowerCase() ? "text-white" : "text-[#D9D9D9]"
                            }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* Rest of pattern content */}
                    <h3 className="text-lg xl:text-xl font-medium mb-2 xl:mb-3 ml-1">Patterns</h3>
                    <div className="grid grid-cols-3 xl:grid-cols-5 gap-2 mr-2 xl:mr-3 mb-3">
                      {patternTypes.map((patternType) => (
                        <button
                          key={patternType}
                          className={`w-[80%] xl:w-full ml-1 aspect-square bg-gray-300 rounded-md hover:ring-2 hover:ring-white ${selectedPattern === patternType ? "ring-2 ring-white" : ""
                            }`}
                          onClick={() => handlePatternSelect(patternType)}
                          title={patternType}
                        >
                          <img
                            src={`/patterns/${patternType}_logo.png`}
                            alt={patternType}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </button>
                      ))}
                    </div>
                    <h3 className="text-lg xl:text-xl font-medium mb-2 xl:mb-3 ml-1">Pattern Color</h3>
                    <div className="grid grid-cols-5 gap-2 ml-1 mb-3 mr-2 xl:mr-3">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className={`w-[80%] xl:w-full aspect-square rounded-md hover:ring-2 hover:ring-white ${patternColor === color.value ? "ring-2 ring-white" : ""
                            }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setPatternColor(color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs xl:text-sm mt-3">Pattern Scale</span>

                        <span className="text-xs xl:text-sm">{patternScale.toFixed(2)}x</span>
                      </div>
                      {/* <input
                        type="range"
                        min="2.0"
                        max="8"
                        step="0.1"
                        value={patternScale}
                        onChange={(e) => setPatternScale(parseFloat(e.target.value))}
                        className="w-full accent-[#D9D9D9] custom-range-slider"
                      /> */}
                      <input
                        type="range"
                        min="2.0"
                        max="8"
                        step="0.1"
                        value={patternScale}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setPatternScale(newValue);
                          // Set the CSS variable directly when value changes
                          e.target.style.setProperty('--range-progress', `${calculateProgress(newValue)}%`);
                        }}
                        className="w-full accent-[#D9D9D9] custom-range-slider"
                        // Set the initial CSS variable inline
                        style={{ '--range-progress': `${calculateProgress(patternScale)}%` }}
                        // Add this ref to handle visibility changes
                        ref={(el) => {
                          if (el) {
                            el.style.setProperty('--range-progress', `${calculateProgress(patternScale)}%`);
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleClearPattern}
                      className="glass-button mt-4 h-[10%] px-3 xl:px-4 py-1 xl:py-2 bg-white/30 backdrop-blur-xl text-white rounded-md text-md xl:text-base"

                    >
                      Clear Pattern
                    </button>
                  </div>
                )}

                {/* Colors tab */}
                {activeTab === "colors" && (
                  <div className="h-full">
                    <h3 className="text-xl font-medium mb-4">Apply Colors to</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {placementAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => setSelectedTab(area.mapping)}
                          className={`glass-button px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedTab === area.mapping
                            ? "bg-gray-500 text-white"
                            : "bg-white/30 backdrop-blur-xl text-white hover:bg-gray-500"
                            }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xl font-medium mb-4">Custom Color</h3>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={partColors[selectedTab]}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="h-10 w-10 rounded-full  cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={partColors[selectedTab]}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="flex-1  bg-white/30 backdrop-blur-lg rounded-lg px-3 py-2 text-gray-600"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Logo tab */}
                {activeTab === "logo" && (
                  <div className="h-full">
                    <h3 className="text-xl font-medium mb-4">Add Image</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {placementAreas2.map((area) => (
                        <div key={area.id} className="flex flex-col items-center ">
                          <div className="bg-slate-300 w-[60%] xl:w-[80%] aspect-square rounded-md  flex items-center justify-center mb-1 relative">
                            {customLogos[area.mapping] ? (
                              <div className="relative w-full h-full ">
                                <img
                                  src={customLogos[area.mapping].image.src}
                                  alt="Uploaded logo"
                                  className="w-full h-full object-cover rounded-md"
                                />
                                <button
                                  onClick={() => handleDeleteDecal(area.mapping)}
                                  className="absolute top-1 right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
                          <p className="text-center text-md">{area.label}</p>
                          <p className="text-center text-xs">Max Area</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Texture tab */}
                {activeTab === "texture" && (
                  <div className="h-full">
                    <h3 className="text-xl font-medium mb-4 ml-1">Material Type</h3>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {textures.map((texture) => (
                        <button
                          key={texture.value}
                          onClick={() => setSelectedTexture(texture.value)}
                          className={`xl:w-[90%]  w-[60%] aspect-square rounded-lg ml-1 overflow-hidden transition-all ${selectedTexture === texture.value
                            ? "ring-2 ring-white"
                            : "ring-1 ring-gray-400 hover:ring-white"
                            }`}
                        >
                          <img
            src={texture.imageUrl}
            alt={texture.label}
            className="w-full h-full object-cover"
          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-4">
                      <h3 className="text-xl font-medium mb-2 ml-1">Texture Settings</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300 ml-1">Scale</span>
                          <span className="text-sm text-gray-300">{textureScale.toFixed(2)}x</span>
                        </div>
                        {/* <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={textureScale}
                          onChange={(e) => setTextureScale(parseFloat(e.target.value))}
                          className="w-full accent-[#D9D9D9] ml-1 texture-scale-slider custom-range-slider"
                        /> */}
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={textureScale}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value);
                            setTextureScale(newValue);
                            // Set the CSS variable directly when value changes
                            e.target.style.setProperty('--range-progress', `${calculateProgress(newValue)}%`);
                          }}
                          className="w-full accent-[#D9D9D9] ml-1 texture-scale-slider custom-range-slider"
                          // Set the initial CSS variable inline
                          style={{ '--range-progress': `${calculateProgress(textureScale)}%` }}
                          // Add this ref to handle visibility changes
                          ref={(el) => {
                            if (el) {
                              el.style.setProperty('--range-progress', `${calculateProgress(textureScale)}%`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Text tab */}
                {activeTab === "text" && (
                  <div className="h-full">
                    <h3 className="text-xl font-medium mb-4 ml-1">Add Text</h3>
                    <div className="flex flex-wrap gap-2 mb-6 ml-1">
                      {placementAreas2.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setSelectedTab(area.mapping);
                            setSelectedTextArea(area.mapping);
                          }}
                          className={`glass-button px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedTab === area.mapping
                            ? "bg-gray-500 text-white"
                            : "bg-white/30 backdrop-blur-xl text-white hover:bg-gray-500"
                            }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {selectedTextArea ? (
                        <div> {/* Removed overflow-y-auto */}
                          <label className="block">
                            <span className="text-white font-medium mb-2 block ml-1">
                              Custom Text for{" "}
                              {selectedTextArea.charAt(0).toUpperCase() + selectedTextArea.slice(1)}
                            </span>
                            <textarea
                              placeholder="Enter your text"
                              value={customTexts[selectedTextArea].text}
                              onChange={(e) =>
                                handleTextChange(selectedTextArea, "text", e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(e, selectedTextArea)}
                              className="w-[97%] ml-1 p-2 bg-white/10 backdrop-blur-xl  rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white"
                              rows={4}
                            />
                          </label>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white mt-3 ml-1">Text Color</span>
                            <input
                              type="color"
                              value={customTexts[selectedTextArea].color}
                              onChange={(e) =>
                                handleTextChange(selectedTextArea, "color", e.target.value)
                              }
                              className="h-8 w-8 rounded cursor-pointer mt-3"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white mt-3 ml-1">Background</span>
                            <input
                              type="color"
                              value={
                                customTexts[selectedTextArea].background.startsWith("#")
                                  ? customTexts[selectedTextArea].background
                                  : "#FFFFFF"
                              }
                              onChange={(e) =>
                                handleTextChange(selectedTextArea, "background", e.target.value)
                              }
                              className="h-8 w-8 rounded cursor-pointer mt-3"
                            />
                          </div>
                          <div className="space-y-3 mt-5">
                            <span className="text-sm text-white mt-3 ml-1">Text Style</span>
                            <select
                              value={customTexts[selectedTextArea].style}
                              onChange={(e) =>
                                handleTextChange(selectedTextArea, "style", e.target.value)
                              }
                              className="w-[99%] p-2 bg-white/30 backdrop-blur-xl border border-slate-400 rounded-lg text-gray-500 ml-1"
                            >
                              <div>
                                <option value="classic">Classic</option>
                                <option value="bold">Bold</option>
                                <option value="fancy">Fancy</option>
                                <option value="modern">Modern</option>
                              </div>
                            </select>
                          </div>
                          <div className="space-y-1 mt-5">
                            <span className="text-sm text-white mt-4 ml-1">Text Shape</span>
                            <select
                              value={customTexts[selectedTextArea].shape}
                              onChange={(e) =>
                                handleTextChange(selectedTextArea, "shape", e.target.value)
                              }
                              className="w-[99%] ml-1 p-2 bg-white/10 backdrop-blur-xl rounded-lg text-gray-500"
                            >
                              <option value="rectangle">Rectangle</option>
                              <option value="circle">Circle</option>
                              <option value="oval">Oval</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-300">
                          Please select a placement area to add text.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {(window.innerWidth < 1280) && (
                <div className="flex xl:justify-end justify-center space-x-4 py-2 pb-2 xl:mr-[-76px] xl:ml-0 ml-0 mt-2">
                  <button
                    onClick={handleGLBDownload}
                    className="glass-button px-6 xl:px-8 py-2 xl:py-3 rounded-md text-sm xl:text-base"
                  >
                    Save
                  </button>
                  <button
                    
                    className="glass-button px-6 xl:px-8 py-2 xl:py-3 rounded-md text-sm xl:text-base"
                  >
                    Add To Cart
                  </button>
                </div>
              )}
            </div>

            {/* Only show buttons when panel is visible on mobile and medium */}
            {(window.innerWidth >= 1280) && (
              <div className="flex xl:justify-end justify-center space-x-4 py-2 pb-2 2xl:mr-[-18px] 3xl:mr-[-76px] xl:mr-[43px] ml-0 mt-2">
                <button
                  onClick={handleGLBDownload}
                  className="px-6 xl:px-8 py-2 xl:py-3 bg-opacity-10 bg-white backdrop-blur-md backdrop-saturate-150 text-white rounded-md hover:bg-white/20 shadow-md  text-sm xl:text-base pointer-events-auto"

                >
                  Save
                </button>
                <button

                  className="px-6 xl:px-8 py-2 xl:py-3 bg-opacity-10 bg-white backdrop-blur-md backdrop-saturate-150 text-white rounded-md hover:bg-white/20 shadow-md  text-sm xl:text-base pointer-events-auto"
                >
                  Add To Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoodieCustomizer; 