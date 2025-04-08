import React, { useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export function Model(props) {
  const { nodes, materials } = useGLTF("/chairModel/Chair.glb");
  console.log(nodes);

  // Load textures
  const fabricTextures = useTexture({
    map: "/chairModel/Fabric.jpg",
    normalMap: "/chairModel/Fabric Normal.jpg",
  });

  const floralTextures = useTexture({
    map: "/chairModel/Floral.jpg",
    normalMap: "/chairModel/Floral Normal.jpg",
  });

  const woodTextures = useTexture({
    map: "/chairModel/Wood.jpg",
  });

  const leatherTextures = useTexture({
    map: "/chairModel/Leather.jpg",
  });

  // Load AO texture directly
  const aoTexture = useTexture("/chairModel/ambientOcclusion.jpg");

  // Set properties for textures
  useEffect(() => {
    // Process regular textures
    [fabricTextures.map, fabricTextures.normalMap, floralTextures.map, floralTextures.normalMap].forEach(texture => {
      if (texture) {
        texture.encoding = THREE.sRGBEncoding;
        if (texture === fabricTextures.normalMap || texture === floralTextures.normalMap) {
          texture.encoding = THREE.LinearEncoding;
        }
        texture.channel = 1;
        texture.needsUpdate = true;
      }
    });
    
    // Process AO texture with correct flipping
    if (aoTexture) {
      aoTexture.encoding = THREE.LinearEncoding;
      aoTexture.channel = 1;
      
      // These two properties together should properly flip the texture
      aoTexture.flipY = true;
      aoTexture.wrapT = THREE.MirroredRepeatWrapping;
      
      // Alternative approach: transform the UV coordinates directly
      aoTexture.matrix = new THREE.Matrix3().scale(1, -1).translate(0, 1);
      aoTexture.matrixAutoUpdate = false;
      
      aoTexture.needsUpdate = true;
    }
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
      map: fabricTextures.map,
      aoMap: aoTexture,
      aoMapIntensity: 1.0,
      normalMap: fabricTextures.normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 1.0,
      metalness: 0.0,
      envMap: props.envMap,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    });
    mat.name = "FABRIC";
    return mat;
  }, [fabricTextures, aoTexture, props.envMap]);

  // Configure materials
  useEffect(() => {
    window.chairMaterials = {
      FABRIC: fabricMaterial,
      "WOOD.001": materials["WOOD.001"],
    };

    if (materials["WOOD.001"]) {
      materials["WOOD.001"].map = woodTextures.map;
      materials["WOOD.001"].roughness = 0.82;
      materials["WOOD.001"].metalness = 0.5;
      materials["WOOD.001"].envMap = props.envMap;
      materials["WOOD.001"].envMapIntensity = 1;
      materials["WOOD.001"].side = THREE.DoubleSide;
      materials["WOOD.001"].needsUpdate = true;
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
          material={materials["WOOD.001"]}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/chairModel/Chair.glb");