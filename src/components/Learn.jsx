import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import LearnModel from './LearnModel'

function Learn() {
    const [selectColor, setSelectColor] = React.useState('#0000ff') // hex format
    const [selectTab, setSelectTab] = React.useState('chest');
    const [selectTexture, setSelectTexture] = React.useState('cotton');
    const [customText, setCustomText] = React.useState('Bama');
    const [showText, setShowText] = React.useState(true);

    return (
        <div className='h-screen flex'>
            {/* sidebar */}
            <div className='w-1/4 p-4 bg-gray-100'>
                <h2 className='text-xl font-bold mb-2'>Customize</h2>
                <div className='mb-4'>
                    <button className='mr-2 p-2 bg-blue-200' onClick={() => setSelectTab('chest')}>Chest</button>
                    <button className='p-2 bg-green-200' onClick={() => setSelectTab('arms')}>Arms</button>
                </div>
                <input
                    type='color'
                    value={selectColor}
                    onChange={(e) => setSelectColor(e.target.value)}
                />
                <div>
                    <button onClick={() => setSelectTexture('cotton')}>Cotton</button>
                    <button onClick={() => setSelectTexture('denim')}>Denim</button>
                </div>
                <div className='mt-4'>
                    <input
                        type='text'
                        value={customText}
                        onChange={(e) => {
                            setCustomText(e.target.value)
                            setShowText(e.target.value.length > 0) // Show text if there's any input
                        }}
                        placeholder='Enter custom text'
                        className='border p-2'
                    />
                </div>
            </div>

            {/* canvas */}
            <div className='flex-1'>
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={45} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={0.5} />

                    <LearnModel 
                    selectedColor={selectColor} 
                    selectedTab={selectTab} 
                    selectedTexture={selectTexture}
                    customText={customText}
                    showText={showText}
                    />

                    <OrbitControls
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 1.8}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        target={[0, 0, 0]}
                        minDistance={2}
                        maxDistance={10}
                    />
                </Canvas>
            </div>
        </div>
    )
}

export default Learn
