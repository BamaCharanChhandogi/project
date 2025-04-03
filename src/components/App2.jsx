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
      return <div style={{ color: 'red', padding: '20px' }}>
        Something went wrong with the 3D renderer. Please refresh the page.
      </div>;
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
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      right: '10px', 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      padding: '15px',
      borderRadius: '5px',
      color: 'white',
      width: '250px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Material Settings</h3>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Emissive Intensity: {settings.emissiveIntensity.toFixed(1)}</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={settings.emissiveIntensity}
          onChange={(e) => handleChange('emissiveIntensity', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Metalness: {settings.metalness.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={settings.metalness}
          onChange={(e) => handleChange('metalness', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Roughness: {settings.roughness.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={settings.roughness}
          onChange={(e) => handleChange('roughness', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Env Map Intensity: {settings.envMapIntensity.toFixed(1)}</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={settings.envMapIntensity}
          onChange={(e) => handleChange('envMapIntensity', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Light Map Intensity: {settings.lightMapIntensity.toFixed(1)}</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={settings.lightMapIntensity}
          onChange={(e) => handleChange('lightMapIntensity', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

// Scene component with HDR environment
const Scene = () => {
  const envMap = useEnvironment({ files: '/golden_gate_hills_4k.hdr' }); // Load HDR file

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Bounds fit clip observe>
        <Model position={[0, -2, 0]} envMap={envMap} /> {/* Pass envMap to Model */}
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
};

function App() {
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <ErrorBoundary>
          <Canvas>
            <Scene />
          </Canvas>
          <MaterialControls onMaterialChange={handleMaterialChange} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;