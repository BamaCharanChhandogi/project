// Model.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Decal, useGLTF, useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';

function HoodieModel() {
  const { scene, nodes } = useGLTF('/Hoodie/tggrg.glb');
  const texture = useTexture('/Hoodie/logoPrint1.png');
  const hoodieRef = useRef();
  
  // Controls for the logo decal positioning - adjusted for hoodie front
  const { posX, posY, posZ, rotX, rotY, rotZ, scaleX, scaleY, debug } = useControls({
    posX: { value: 0, min: -1, max: 1, step: 0.01 },
    posY: { value: 0.1, min: -1, max: 1, step: 0.01 },  // Positioned higher for chest
    posZ: { value: 0.51, min: 0, max: 1, step: 0.01 },  // Forward on the front face
    rotX: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    rotY: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    rotZ: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
    scaleX: { value: 0.2, min: 0.1, max: 1, step: 0.01 },
    scaleY: { value: 0.2, min: 0.1, max: 1, step: 0.01 },
    debug: { value: true }
  });

  // Find the hoodie body mesh to apply the decal
  const [targetMesh, setTargetMesh] = React.useState(null);
  
  React.useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        console.log('Found mesh:', child.name);
        // Look for the main body mesh of the hoodie
        if (child.name.toLowerCase().includes('body') || 
            child.name.toLowerCase().includes('hoodie') || 
            child.name.toLowerCase().includes('torso')) {
          setTargetMesh(child);
        }
      }
    });
  }, [scene]);

  return (
    <group ref={hoodieRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <primitive object={scene} />
      {targetMesh && (
        <Decal
          debug={debug}
          position={[posX, posY, posZ]}
          rotation={[rotX, rotY, rotZ]}
          scale={[scaleX, scaleY, 1]}
          map={texture}
          polygonOffset
          polygonOffsetFactor={-1}
          transparent
          object={targetMesh}
        />
      )}
    </group>
  );
}

export default HoodieModel;