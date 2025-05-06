import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// This component renders control buttons around a decal
function DecalControls({ 
  selectedDecal, 
  customLogos, 
  setCustomLogos,
  targetMesh 
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  
  useEffect(() => {
    if (!selectedDecal || !customLogos[selectedDecal]?.texture || !targetMesh) return;
    
    // Create HTML overlay for the controls that follows the 3D position
    const updateControlsPosition = () => {
      if (!controlsRef.current) return;
      
      // Get decal position in world space
      const decalPosition = new THREE.Vector3(
        customLogos[selectedDecal].position[0],
        customLogos[selectedDecal].position[1],
        customLogos[selectedDecal].position[2]
      );
      
      // Get decal scale to determine the size of our control box
      const decalScale = customLogos[selectedDecal].scale || 0.14;
      
      // Calculate the correct dimensions based on the aspect ratio
      const aspectRatio = customLogos[selectedDecal].aspectRatio || 1;
      const width = decalScale * aspectRatio;
      const height = decalScale;
      
      // Create corners of the decal in local space
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      
      // Calculate world positions for each corner
      const worldPosition = decalPosition.clone().add(targetMesh.position);
      
      // Get the rotation of the decal
      const rotation = new THREE.Euler(
        customLogos[selectedDecal].rotation?.[0] || 0,
        customLogos[selectedDecal].rotation?.[1] || 0,
        customLogos[selectedDecal].rotation?.[2] || 0
      );
      
      // Apply rotation to get the correct corner positions
      const corners = [
        new THREE.Vector3(-halfWidth, halfHeight, 0),  // Top-left
        new THREE.Vector3(halfWidth, halfHeight, 0),   // Top-right
        new THREE.Vector3(-halfWidth, -halfHeight, 0), // Bottom-left
        new THREE.Vector3(halfWidth, -halfHeight, 0)   // Bottom-right
      ];
      
      // Apply rotation to corners
      corners.forEach(corner => {
        corner.applyEuler(rotation);
        corner.add(worldPosition);
      });
      
      // Project corners to screen space
      const screenCorners = corners.map(corner => {
        const screenPos = corner.clone().project(camera);
        return {
          x: (screenPos.x + 1) * gl.domElement.width / 2,
          y: (-screenPos.y + 1) * gl.domElement.height / 2
        };
      });
      
      // Calculate the center position
      const center = {
        x: (screenCorners[0].x + screenCorners[3].x) / 2,
        y: (screenCorners[0].y + screenCorners[3].y) / 2
      };
      
      // Calculate the bounding box
      const left = Math.min(...screenCorners.map(c => c.x));
      const right = Math.max(...screenCorners.map(c => c.x));
      const top = Math.min(...screenCorners.map(c => c.y));
      const bottom = Math.max(...screenCorners.map(c => c.y));
      const boxWidth = right - left;
      const boxHeight = bottom - top;
      
      // Update the control div position and size
      const controls = controlsRef.current;
      controls.style.left = `${left}px`;
      controls.style.top = `${top}px`;
      controls.style.width = `${boxWidth}px`;
      controls.style.height = `${boxHeight}px`;
      controls.style.display = 'block';
      
      // Update button positions
      const buttons = controls.querySelectorAll('.control-button');
      buttons.forEach(button => {
        const position = button.getAttribute('data-position');
        const index = position === 'top-left' ? 0 : 
                     position === 'top-right' ? 1 : 
                     position === 'bottom-left' ? 2 : 3;
                     
        button.style.position = 'absolute';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.left = `${screenCorners[index].x - left}px`;
        button.style.top = `${screenCorners[index].y - top}px`;
      });
    };
    
    // Create the controls overlay if it doesn't exist
    if (!controlsRef.current) {
      const controls = document.createElement('div');
      controls.className = 'decal-controls';
      controls.style.position = 'absolute';
      controls.style.pointerEvents = 'none';
      controls.style.border = '2px dashed rgba(0, 0, 0, 0.7)';
      controls.style.zIndex = '1000';
      controls.style.display = 'none';
      
      // Create corner buttons
      const createButton = (position, icon, action) => {
        const button = document.createElement('button');
        button.innerHTML = icon;
        button.className = `control-button ${position}`;
        button.setAttribute('data-position', position);
        button.style.position = 'absolute';
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#ffffff';
        button.style.border = '1px solid #000000';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.cursor = 'pointer';
        button.style.pointerEvents = 'auto';
        button.style.fontSize = '14px';
        button.style.zIndex = '1001';
        button.style.transform = 'translate(-50%, -50%)';
        
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          action();
        });
        
        controls.appendChild(button);
      };
      
      // Delete button (top-left)
      createButton('top-left', '🗑️', () => {
        setCustomLogos((prev) => ({
          ...prev,
          [selectedDecal]: { ...prev[selectedDecal], texture: null }
        }));
      });
      
      // Resize button (top-right)
      createButton('top-right', '↔️', () => {
        setCustomLogos((prev) => ({
          ...prev,
          [selectedDecal]: { 
            ...prev[selectedDecal], 
            scale: (prev[selectedDecal].scale || 0.14) + 0.01 
          }
        }));
      });
      
      // Rotate button (bottom-left)
      createButton('bottom-left', '↻', () => {
        setCustomLogos((prev) => ({
          ...prev,
          [selectedDecal]: { 
            ...prev[selectedDecal], 
            rotation: [
              (prev[selectedDecal].rotation?.[0] || 0) + 0.1,
              prev[selectedDecal].rotation?.[1] || 0,
              prev[selectedDecal].rotation?.[2] || 0
            ] 
          }
        }));
      });
      
      // Copy button (bottom-right)
      createButton('bottom-right', '📋', () => {
        const copyKey = `${selectedDecal}_copy_${Date.now()}`;
        setCustomLogos((prev) => ({
          ...prev,
          [copyKey]: {
            ...prev[selectedDecal],
            position: [
              (prev[selectedDecal].position[0] || 0) + 0.05,
              (prev[selectedDecal].position[1] || 0) + 0.05,
              prev[selectedDecal].position[2] || 0
            ],
          },
        }));
      });
      
      document.body.appendChild(controls);
      controlsRef.current = controls;
    }
    
    // Set up animation loop to update controls position
    const animate = () => {
      updateControlsPosition();
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      if (controlsRef.current) {
        controlsRef.current.style.display = 'none';
      }
    };
  }, [selectedDecal, customLogos, camera, gl.domElement, targetMesh]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        document.body.removeChild(controlsRef.current);
      }
    };
  }, []);
  
  return null; // This component doesn't render anything in the scene
}

export default DecalControls;