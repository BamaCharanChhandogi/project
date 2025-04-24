import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

function HDREnvironment({ path, intensity = 0.3, useAsBackground = true }) {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    
    loader.load(
      path,
      (texture) => {
        // Set correct color space for proper tone mapping
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Apply mapping for reflection
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        // Create environment map
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        
        // Apply intensity to the texture
        envMap.intensity = intensity;
        
        // Set environment for reflections
        scene.background = texture;
        scene.environment = null;
        
        // Optionally use as background
        if (useAsBackground) {
          // Create a separate texture for background with lower intensity
          scene.background = texture.clone();
          scene.background.mapping = THREE.EquirectangularReflectionMapping;
          // This controls background brightness
          scene.background.intensity = intensity * 0.7; // Make background slightly darker than reflections
        }
        
        console.log('JPG loaded and applied as environment with intensity:', intensity);
      },
      undefined,
      (error) => {
        console.error('Error loading JPG file:', error.message);
      }
    );
    
    return () => {
      pmremGenerator.dispose();
    };
  }, [scene, gl, path, intensity, useAsBackground]);
  
  return null;
}

export default HDREnvironment;