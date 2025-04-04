import React, { useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export function Model(props) {
  const { nodes, materials } = useGLTF("/chairModel/Chair.glb");
  const scence = useGLTF("/chairModel/Chair.glb");
//   console.log(scence);
  

  // Load textures
  const fabricTextures = useTexture({
    map: "/chairModel/Fabric.jpg",
    normalMap: "/chairModel/Fabric Normal.jpg",
  });

  const floralTextures = useTexture({
    map: "/chairModel/Floral.jpg",
    normalMap: "/chairModel/Floral Normal.jpg",
  });
  console.log(floralTextures);
  

  const woodTextures = useTexture({
    map: "/chairModel/Wood.jpg",
  });

  const leatherTextures = useTexture({
    map: "/chairModel/Leather.jpg",
  });

  const aoTexture = useTexture({
    aoMap: "/chairModel/ambientOcclusion.jpg",
  });

  // Set UV channel and color space for textures
  useEffect(() => { 
    floralTextures.map.encoding = THREE.sRGBEncoding;
    floralTextures.normalMap.encoding = THREE.LinearEncoding;
    // aoTexture.aoMap.encoding = THREE.LinearEncoding;
    fabricTextures.map.encoding = THREE.sRGBEncoding;
    fabricTextures.normalMap.encoding = THREE.LinearEncoding;
    [fabricTextures.map, fabricTextures.normalMap, floralTextures.map, floralTextures.normalMap, aoTexture.aoMap].forEach(texture => {
      if (texture) {
        texture.channel = 1; // Use the second UV channel (UVMap001)
        texture.needsUpdate = true;
      }
    });
  }, [fabricTextures, floralTextures, aoTexture]);

  // Store textures in window for texture switching
  useEffect(() => {
    window.textures = {
      fabric: fabricTextures,
      fabricNormal: fabricTextures,
      floral: floralTextures,
      floralNormal: floralTextures,
      wood: woodTextures,
      leather: leatherTextures,
    };
  }, [fabricTextures, floralTextures, woodTextures, leatherTextures]);

  // Create a standard material for the fabric
  const fabricMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: floralTextures.map,
      aoMap: aoTexture.aoMap,
      aoMapIntensity: 0.3,
      normalMap: floralTextures.normalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 1.0,
      metalness: 0.0,
      envMap: props.envMap,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    });
    mat.name = 'FABRIC'; // Set material name for identification
    return mat;
  }, [floralTextures, aoTexture, props.envMap]);

  // Expose materials to window and configure WOOD.001
  useEffect(() => {
    window.chairMaterials = {
      FABRIC: fabricMaterial,
      'WOOD.001': materials['WOOD.001'],
    };

    if (materials['WOOD.001']) {
      materials['WOOD.001'].map = woodTextures.map;
      materials['WOOD.001'].roughness = 0.82;
      materials['WOOD.001'].metalness = 0.5;
      materials['WOOD.001'].envMap = props.envMap;
      materials['WOOD.001'].envMapIntensity = 1;
      materials['WOOD.001'].side = THREE.DoubleSide;
      materials['WOOD.001'].needsUpdate = true;
    }
  }, [materials, fabricMaterial, woodTextures, props.envMap]);

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Mesh001.geometry}
          material={fabricMaterial}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Mesh001_1.geometry}
          material={materials['WOOD.001']}
        />
      </group>
    </group>
  );
}

useGLTF.preload('/chairModel/Chair.glb');