import React, { useEffect } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export function Model(props) {
  const { nodes, materials } = useGLTF("/Plain Glove.glb");

  // Load all textures
  const blueTextures = useTexture({
    map: "/Blue_Back_BaseColor.jpg",
    normalMap: "/Blue_Back_Normal.jpg",
  });

  const smallLeatherTextures = useTexture({
    map: "/Small_Leather_BaseColor.jpg",
    normalMap: "/Small-Leather_Normal.jpg",
  });

  const logoTextures = useTexture({
    map: "/Logo.png",
  });

  const leatherTextures = useTexture({
    map: "/Leather-medium_BaseColor.jpg",
    normalMap: "/Leather-medium_Normal.jpg",
    roughnessMap: "/Leather-medium_Roughness.png",
  });

  const innerFabricTextures = useTexture({
    normalMap: "/Inner_fabric_Normal.png",
    roughnessMap: "/Inner_fabric_Roughness.png",
  });

  const hemTextures = useTexture({
    map: "/Hem_Base_color.png",
    normalMap: "/Hem_Normal.png",
    roughnessMap: "/Hem_Metallic_png-Hem_Roughness_png.png",
    metalnessMap: "/Hem_Metallic_png-Hem_Roughness_png.png",
  });

  const stitchesTextures = useTexture({
    map: "/Stitches_Base2.jpg",
    normalMap: "/Stitches_Normal.png",
  });

  const fabricTextures = useTexture({
    map: "/Fabric.jpg",
    normalMap: "/Fabric_Normal.jpg",
    roughnessMap: "/Fabric_Roughness.png",
  });

  // Expose materials to window and apply envMap
  useEffect(() => {
    window.gloveMaterials = materials;
    Object.values(materials).forEach((material) => {
      material.envMap = props.envMap;
      material.envMapIntensity = 1;
      material.needsUpdate = true;
    });
  }, [materials, props.envMap]);

  // Apply textures to materials
  useEffect(() => {
    // Blue material
    if (materials.Blue) {
      materials.Blue.map = blueTextures.map;
      materials.Blue.normalMap = blueTextures.normalMap;
      materials.Blue.needsUpdate = true;
    }

    // Small leather material
    if (materials["Small leather"]) {
      materials["Small leather"].map = smallLeatherTextures.map;
      materials["Small leather"].normalMap = smallLeatherTextures.normalMap;
      materials["Small leather"].needsUpdate = true;
    }

    // Logo material - Use Logo.png for both base color and opacity, and rotate to correct orientation
    if (materials.Logo) {
      logoTextures.map.rotation = Math.PI; // 180 degrees in radians
      logoTextures.map.center.set(0.5, 0.5); // Center the rotation
      logoTextures.map.repeat.x = -1; // Flip horizontally
      logoTextures.map.updateMatrix(); // Update the texture matrix

      materials.Logo.map = logoTextures.map; // Base color
      materials.Logo.alphaMap = logoTextures.map; // Opacity map
      materials.Logo.transparent = true; // Enable transparency
      materials.Logo.needsUpdate = true;
    }

    // Leather material
    if (materials.Leather) {
      materials.Leather.map = leatherTextures.map;
      materials.Leather.normalMap = leatherTextures.normalMap;
      materials.Leather.roughnessMap = leatherTextures.roughnessMap;
      materials.Leather.needsUpdate = true;
    }

    // Inner Fabric material
    if (materials["Inner Fabric"]) {
      materials["Inner Fabric"].normalMap = innerFabricTextures.normalMap;
      materials["Inner Fabric"].roughnessMap = innerFabricTextures.roughnessMap;
      materials["Inner Fabric"].needsUpdate = true;
    }

    // Hem material
    if (materials.Hem) {
      materials.Hem.map = hemTextures.map;
      materials.Hem.normalMap = hemTextures.normalMap;
      materials.Hem.roughnessMap = hemTextures.roughnessMap;
      materials.Hem.metalnessMap = hemTextures.metalnessMap;
      materials.Hem.needsUpdate = true;
    }

    // Inner stitches material
    if (materials["Inner stitches"]) {
      materials["Inner stitches"].map = stitchesTextures.map;
      materials["Inner stitches"].normalMap = stitchesTextures.normalMap;

      // Enable texture wrapping and repeat for denser stitches
      stitchesTextures.map.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
      stitchesTextures.map.wrapT = THREE.RepeatWrapping; // Vertical wrapping
      stitchesTextures.map.repeat.set(2, 2); // Increase repeat to 2x2 for denser stitches (adjust as needed)

      // Update the texture matrix to apply the repeat
      stitchesTextures.map.needsUpdate = true;

      materials["Inner stitches"].needsUpdate = true;
    }

    // Fabric material
    if (materials.Fabric) {
      materials.Fabric.map = fabricTextures.map;
      materials.Fabric.normalMap = fabricTextures.normalMap;
      materials.Fabric.roughnessMap = fabricTextures.roughnessMap;
      materials.Fabric.roughness = 0.7;
      materials.Fabric.needsUpdate = true;

      materials.Fabric.map.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
      materials.Fabric.map.wrapT = THREE.RepeatWrapping; // Vertical wrapping
      materials.Fabric.map.repeat.set(2, 2); // Increase repeat to 2x2 for denser fabric (adjust as needed)
// normal map
      materials.Fabric.normalMap.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
      
      materials.Fabric.normalMap.wrapT = THREE.RepeatWrapping; // Vertical wrapping

      materials.Fabric.normalMap.repeat.set(2, 2); // Increase repeat to 2x2 for denser fabric (adjust as needed)

      // roughness map
      materials.Fabric.roughnessMap.wrapS = THREE.RepeatWrapping; // Horizontal wrapping

      materials.Fabric.roughnessMap.wrapT = THREE.RepeatWrapping; // Vertical wrapping

      materials.Fabric.roughnessMap.repeat.set(2, 2); // Increase repeat to 2x2 for denser fabric (adjust as needed)
      
      materials.Fabric.map.needsUpdate = true;

    }
  }, [
    materials,
    blueTextures,
    smallLeatherTextures,
    logoTextures,
    leatherTextures,
    innerFabricTextures,
    hemTextures,
    stitchesTextures,
    fabricTextures,
  ]);

  // Log nodes to debug
  console.log("Nodes:", nodes);

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Top_Back.geometry}
        material={materials.Blue}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Small_Leather.geometry}
        material={materials["Small leather"]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Logo.geometry}
        material={materials.Logo}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
        position={[0, 0.01, 0]} // Small offset to avoid z-fighting
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Medium_Leather.geometry}
        material={materials.Leather}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Medium_Leather001.geometry}
        material={materials["Inner Fabric"]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hem.geometry}
        material={materials.Hem}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Inner_stitches.geometry}
        material={materials["Inner stitches"]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fabric.geometry}
        material={materials.Fabric}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload("/Plain Glove.glb");