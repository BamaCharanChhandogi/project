import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";
import { Model } from "./Hoodie";
import { Suspense } from 'react';

export const Experience = () => {
  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial color="blue" /></mesh>}>
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <Float floatIntensity={0.1}>
        <Model position={[0, -1, 5]} /> {/* Adjusted position to match working example */}
      </Float>
      <ContactShadows position-y={-1} opacity={0.4} blur={2} scale={5} />
      <Environment preset="sunset" background blur={4} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
    </Suspense>
  );
};