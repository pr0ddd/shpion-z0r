import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import SpyIconModel from '@libs/three/SpyIconModel';

const Logo3D: React.FC = () => {
  return (
    <Canvas style={{ width: 60, height: 60, backgroundColor: 'transparent'}} camera={{ position: [0, 0, 2.5], fov: 45 }} gl={{ alpha: true }}>
      <Suspense fallback={null}>
        <ambientLight intensity={1.5} />
        <hemisphereLight intensity={1.2} groundColor={0x666666} />
        <pointLight position={[5, 5, 5]} intensity={12} decay={2} />
        <pointLight position={[-5, 5, 5]} intensity={10} decay={2} />
        <pointLight position={[0, -5, 5]} intensity={8} decay={2} />
        <spotLight position={[0, 0, 7]} intensity={25} angle={0.35} penumbra={1} />
        <Environment preset="studio" background={false} />
        <SpyIconModel />
      </Suspense>
    </Canvas>
  );
};

export default Logo3D; 