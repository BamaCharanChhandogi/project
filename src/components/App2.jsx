import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useEnvironment } from '@react-three/drei';
import { Model } from './Model.jsx';
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

// Material control component
const MaterialControls = ({ onMaterialChange }) => {
  const [settings, setSettings] = useState({
    emissiveIntensity: 1,
    metalness: 0,
    roughness: 1,
    envMapIntensity: 1,
    lightMapIntensity: 1,
  });

  const handleChange = (property, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [property]: parseFloat(value) };
      onMaterialChange(property, parseFloat(value));
      return newSettings;
    });
  };

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-70 p-4 rounded-lg text-white w-64 md:w-72 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">Material Settings</h3>
      
      <div className="mb-3">
        <label className="block mb-1 text-sm">Emissive Intensity: {settings.emissiveIntensity.toFixed(1)}</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={settings.emissiveIntensity}
          onChange={(e) => handleChange('emissiveIntensity', e.target.value)}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
        />
      </div>
      
      <div className="mb-3">
        <label className="block mb-1 text-sm">Metalness: {settings.metalness.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={settings.metalness}
          onChange={(e) => handleChange('metalness', e.target.value)}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
        />
      </div>
      
      <div className="mb-3">
        <label className="block mb-1 text-sm">Roughness: {settings.roughness.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={settings.roughness}
          onChange={(e) => handleChange('roughness', e.target.value)}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
        />
      </div>
      
      <div className="mb-3">
        <label className="block mb-1 text-sm">Env Map Intensity: {settings.envMapIntensity.toFixed(1)}</label>
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
      
      <div className="mb-3">
        <label className="block mb-1 text-sm">Light Map Intensity: {settings.lightMapIntensity.toFixed(1)}</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={settings.lightMapIntensity}
          onChange={(e) => handleChange('lightMapIntensity', e.target.value)}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 outline-none"
        />
      </div>
    </div>
  );
};

// Scene component with HDR environment
const Scene = () => {
  const envMap = useEnvironment({ files: '/golden_gate_hills_4k.hdr' });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Bounds fit clip observe>
        <Model position={[0, -2, 0]} envMap={envMap} />
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
};

function App2() {
  const handleMaterialChange = (property, value) => {
    if (window.gloveMaterials) {
      Object.values(window.gloveMaterials).forEach(material => {
        if (material && material[property] !== undefined) {
          material[property] = value;
          material.needsUpdate = true;
        }
      });
    }
  };

  return (
    <div className="flex flex-col">
      
      <div className="relative w-full h-[90vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <ErrorBoundary>
          <Canvas>
            <Scene />
          </Canvas>
          <MaterialControls onMaterialChange={handleMaterialChange} />
          
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded backdrop-blur-sm text-sm">
            <p>👆 Click and drag to rotate</p>
            <p>👌 Pinch to zoom</p>
            <p>✌️ Two fingers to pan</p>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App2;