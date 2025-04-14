import { Decal, useGLTF, useTexture } from '@react-three/drei'
import React, { useEffect } from 'react'
import * as THREE from 'three'

function LearnModel({ selectedColor, selectedTab, selectedTexture, customText, showText }) {
    const { scene } = useGLTF('/Hoodie/newUI/bama44444.glb')
    const textures = useTexture({
        cotton: '/Champlain_BaseColor.png',
        denim: '/Elementary.jpg',
    })
    const [text, setText] = React.useState(null);
    const [decalTargetGeometry, setDecalTargetGeometry] = React.useState(null);
    

    useEffect(() => {
        if (customText && showText) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;
            context.font = '50px Arial';
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'black';
            context.fillText(customText, 20, 130);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            setText(texture);
        }
    }, [customText, showText]);

    useEffect(() => {
        const texture = textures[selectedTexture];
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
        }

        scene.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();

                if (child.name === 'Arms002') {
                    console.log(child);
                    
                    setDecalTargetGeometry(child.geometry); // 🎯 Fix here

                }

                if (selectedTab === 'chest' && child.name.toLowerCase().includes('main')) {
                    child.material.color.set(selectedColor);
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                } else if (selectedTab === 'arms' && child.name.toLowerCase().includes('arm')) {
                    child.material.color.set(selectedColor);
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                } else {
                    child.material.color.set('#ffffff');
                }
            }
        });
    }, [scene, selectedColor, selectedTab, selectedTexture, textures]);

    return (
        <group>
            <primitive object={scene} position={[0, 0, 0]} />
            {decalTargetGeometry && text && (
                <mesh geometry={decalTargetGeometry}>
                    <Decal
                    debug={true}
                        map={text}
                        position={[0, 0, 0.1]}
                        rotation={[0, 0, 0]}
                        scale={[0.5, 0.5, 0.5]}
                    />
                </mesh>
            )}
        </group>
    );
}


export default LearnModel
