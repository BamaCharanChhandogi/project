import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

function HDREnvironment({ path }) {
  const { scene, gl } = useThree();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();

    loader.load(
      path,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        scene.background = envMap;

        console.log('JPG loaded and applied as environment');
      },
      undefined,
      (error) => {
        console.error('Error loading JPG file:', error.message);
      }
    );

    return () => {
      pmremGenerator.dispose();
    };
  }, [scene, gl, path]);

  return null;
}

export default HDREnvironment;
