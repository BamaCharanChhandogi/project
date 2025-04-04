import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useEnvironment } from '@react-three/drei';
import { Model } from './Model2';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in Canvas:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-red-800 font-medium">Rendering Error</h3>
                <p className="text-red-700 mt-2">Something went wrong with the 3D renderer. Please refresh the page.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Material control component for chair (fabric and wood properties)
const MaterialControls = ({ onMaterialChange, onTextureChange }) => {
  const [settings, setSettings] = useState({
    fabricRoughness: 1.0,
    fabricMetalness: 0,
    woodRoughness: 0.82,
    woodMetalness: 0.5,
    envMapIntensity: 1,
    fabricTexture: 'floral',
    woodTexture: 'wood',
  });

  const handleChange = (property, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [property]: parseFloat(value) };
      onMaterialChange(property, parseFloat(value));
      return newSettings;
    });
  };

  const handleTextureChange = (type, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [type]: value };
      onTextureChange(type, value);
      return newSettings;
    });
  };

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-70 p-4 rounded-lg text-white w-64 md:w-72 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">Chair Material Settings</h3>
      
      {/* Fabric Section */}
      <div className="mb-4">
        <h4 className="text-blue-300 text-sm uppercase font-medium mb-2">Fabric Settings</h4>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Fabric Texture:</label>
          <select
            value={settings.fabricTexture}
            onChange={(e) => handleTextureChange('fabricTexture', e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
          >
            <option value="plain">Plain Fabric</option>
            <option value="floral">Floral Fabric</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Roughness: {settings.fabricRoughness.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={settings.fabricRoughness}
            onChange={(e) => handleChange('fabricRoughness', e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
          />
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Metalness: {settings.fabricMetalness.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={settings.fabricMetalness}
            onChange={(e) => handleChange('fabricMetalness', e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
          />
        </div>
      </div>
      
      {/* Wood Section */}
      <div className="mb-4">
        <h4 className="text-amber-300 text-sm uppercase font-medium mb-2">Frame Settings</h4>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Frame Material:</label>
          <select
            value={settings.woodTexture}
            onChange={(e) => handleTextureChange('woodTexture', e.target.value)}
            className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
          >
            <option value="wood">Wood</option>
            <option value="leather">Leather</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Roughness: {settings.woodRoughness.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={settings.woodRoughness}
            onChange={(e) => handleChange('woodRoughness', e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
          />
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm">Metalness: {settings.woodMetalness.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={settings.woodMetalness}
            onChange={(e) => handleChange('woodMetalness', e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
          />
        </div>
      </div>
      
      {/* Environment Settings */}
      <div>
        <h4 className="text-green-300 text-sm uppercase font-medium mb-2">Environment</h4>
        <div className="mb-3">
          <label className="block mb-1 text-sm">Light Intensity: {settings.envMapIntensity.toFixed(1)}</label>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="0.1" 
            value={settings.envMapIntensity}
            onChange={(e) => handleChange('envMapIntensity', e.target.value)}
            className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

// Scene component with HDR environment
const Scene = () => {
  const envMap = useEnvironment({ files: '/golden_gate_hills_4k.hdr' });

  return (
    <>
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} intensity={2.0} />
      <Bounds fit clip observe>
        <Model position={[0, -1, 0]} envMap={envMap} />
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
};

function ChairModel() {
  const handleMaterialChange = (property, value) => {
    if (window.chairMaterials) {
      Object.values(window.chairMaterials).forEach(material => {
        if (material) {
          if (property === 'fabricRoughness' && material.name === 'FABRIC') {
            material.roughness = value;
          } else if (property === 'fabricMetalness' && material.name === 'FABRIC') {
            material.metalness = value;
          } else if (property === 'woodRoughness' && material.name === 'WOOD.001') {
            material.roughness = value;
          } else if (property === 'woodMetalness' && material.name === 'WOOD.001') {
            material.metalness = value;
          } else if (property === 'envMapIntensity') {
            material.envMapIntensity = value;
          }
          material.needsUpdate = true;
        }
      });
    }
  };

  const handleTextureChange = (type, value) => {
    if (window.chairMaterials) {
      if (type === 'fabricTexture') {
        const fabricMaterial = window.chairMaterials.FABRIC;
        if (fabricMaterial) {
          fabricMaterial.map = window.textures[value === 'plain' ? 'fabric' : 'floral'].map;
          fabricMaterial.normalMap = window.textures[value === 'plain' ? 'fabricNormal' : 'floralNormal'].normalMap;
          fabricMaterial.needsUpdate = true;
        }
      } else if (type === 'woodTexture') {
        const woodMaterial = window.chairMaterials['WOOD.001'];
        if (woodMaterial) {
          woodMaterial.map = window.textures[value === 'wood' ? 'wood' : 'leather'].map;
          woodMaterial.needsUpdate = true;
        }
      }
    }
  };

  return (
    <div className="flex flex-col">
      
      <div className="relative w-full h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <ErrorBoundary>
          <Canvas>
            <Scene />
          </Canvas>
          <MaterialControls 
            onMaterialChange={handleMaterialChange} 
            onTextureChange={handleTextureChange} 
          />
          
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded backdrop-blur-sm text-sm">
            <p>👆 Click and drag to rotate</p>
            <p>👌 Pinch to zoom</p>
            <p>✌️ Two fingers to pan</p>
          </div>
          
          {/* AR button */}
          <button 
            className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center shadow-lg"
            onClick={() => window.location.href = '/ar'}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            View in AR
          </button>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default ChairModel;