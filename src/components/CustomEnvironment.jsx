// import { useThree } from '@react-three/fiber';
// import { useEffect } from 'react';
// import * as THREE from 'three';

// function HDREnvironment({ 
//   path, 
//   intensity = 0.3, 
//   backgroundIntensity = 0.1, 
//   useAsBackground = true 
// }) {
//   const { scene, gl } = useThree();
  
//   useEffect(() => {
//     // Set correct tone mapping for the renderer
//     const loader = new THREE.TextureLoader();
//   const pmremGenerator = new THREE.PMREMGenerator(gl);
//   pmremGenerator.compileEquirectangularShader();
    
//   loader.load(
//     path,
//     (texture) => {
//       texture.colorSpace = THREE.SRGBColorSpace;
//       texture.encoding = THREE.sRGBEncoding;
//       texture.mapping = THREE.EquirectangularReflectionMapping;
      
//       // Create environment map for reflections
//       const envMap = pmremGenerator.fromEquirectangular(texture).texture;
//       envMap.intensity = intensity;
//       scene.environment = envMap;
      
//       // Darken the texture for background
//       if (useAsBackground) {
//         // Create a canvas to manipulate the texture
//         const canvas = document.createElement('canvas');
//         canvas.width = texture.image.width;
//         canvas.height = texture.image.height;
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(texture.image, 0, 0);
        
//         // Adjust brightness (reduce by multiplying RGB values)
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const data = imageData.data;
//         const brightnessFactor = 0.7; // Reduce brightness by 30%
//         for (let i = 0; i < data.length; i += 4) {
//           data[i] *= brightnessFactor; // Red
//           data[i + 1] *= brightnessFactor; // Green
//           data[i + 2] *= brightnessFactor; // Blue
//           // Alpha (data[i + 3]) remains unchanged
//         }
//         ctx.putImageData(imageData, 0, 0);
        
//         // Create a new texture from the darkened canvas
//         const darkenedTexture = new THREE.CanvasTexture(canvas);
//         darkenedTexture.mapping = THREE.EquirectangularReflectionMapping;
//         darkenedTexture.colorSpace = THREE.SRGBColorSpace;
//         darkenedTexture.encoding = THREE.sRGBEncoding;
        
//         scene.background = darkenedTexture;
//       } else {
//         scene.background = null;
//       }
      
//       console.log('JPG loaded and applied as environment:', {
//         reflectionIntensity: intensity,
//         backgroundIntensity: backgroundIntensity
//       });
//     },
//     undefined,
//     (error) => {
//       console.error('Error loading JPG file:', error.message);
//     }
//   );
  
//   // Update cleanup to dispose of the new texture
//   return () => {
//     pmremGenerator.dispose();
//     if (scene.environment) {
//       scene.environment.dispose();
//       scene.environment = null;
//     }
//     if (scene.background && scene.background.isTexture) {
//       scene.background.dispose();
//       scene.background = null;
//     }
//   };
    
//     return () => {
//       pmremGenerator.dispose();
//       // Clean up textures
//       if (scene.environment) {
//         scene.environment.dispose();
//         scene.environment = null;
//       }
//       if (scene.background && scene.background.isTexture) {
//         scene.background.dispose();
//         scene.background = null;
//       }
//     };
//   }, [scene, gl, path, intensity, backgroundIntensity, useAsBackground]);
  
//   return null;
// }

// export default HDREnvironment;


import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

function HDREnvironment({ 
  path, 
  intensity = 0.3, 
  backgroundIntensity = 0.3, 
  useAsBackground = true 
}) {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.encoding = THREE.sRGBEncoding;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        // Create environment map for reflections
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        envMap.intensity = intensity;
        scene.environment = envMap;
        
        // Darken the texture for background
        if (useAsBackground) {
          const canvas = document.createElement('canvas');
          canvas.width = texture.image.width;
          canvas.height = texture.image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(texture.image, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const brightnessFactor = 0.56; // Adjust as needed (0.5 = 50% brightness)
          for (let i = 0; i < data.length; i += 4) {
            data[i] *= brightnessFactor; // Red
            data[i + 1] *= brightnessFactor; // Green
            data[i + 2] *= brightnessFactor; // Blue
          }
          ctx.putImageData(imageData, 0, 0);
          
          const darkenedTexture = new THREE.CanvasTexture(canvas);
          darkenedTexture.mapping = THREE.EquirectangularReflectionMapping;
          darkenedTexture.colorSpace = THREE.SRGBColorSpace;
          darkenedTexture.encoding = THREE.sRGBEncoding;
          
          scene.background = darkenedTexture;
        } else {
          scene.background = null;
        }
        
        console.log('JPG loaded and applied as environment:', {
          reflectionIntensity: intensity,
          backgroundIntensity: backgroundIntensity
        });
      },
      undefined,
      (error) => {
        console.error('Error loading JPG file:', error.message);
      }
    );
    
    return () => {
      pmremGenerator.dispose();
      if (scene.environment) {
        scene.environment.dispose();
        scene.environment = null;
      }
      if (scene.background && scene.background.isTexture) {
        scene.background.dispose();
        scene.background = null;
      }
    };
  }, [scene, gl, path, intensity, backgroundIntensity, useAsBackground]);
  
  return null;
}

export default HDREnvironment;