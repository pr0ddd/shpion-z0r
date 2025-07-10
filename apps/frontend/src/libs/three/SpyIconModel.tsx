import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Box3, Vector3 } from 'three';

const SpyIconModel: React.FC = () => {
  const modelRef = useRef<Group>(null!);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const yawOffset = -Math.PI / 4; // faces camera initially

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouse.current.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(() => {
    if (!modelRef.current) return;
    const maxYaw = Math.PI / 4;
    const maxPitch = Math.PI / 4;
    const yaw = mouse.current.x * maxYaw;
    const pitch = -mouse.current.y * maxPitch;
    modelRef.current.rotation.set(pitch, yawOffset + yaw, 0);
  });

  const gltf = useGLTF('/models/spy-icon.gltf');

  const processedScene = useMemo(() => {
    const cloned = gltf.scene.clone();
    const box = new Box3().setFromObject(cloned);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const desired = 1.5;
    const scaleFactor = desired / maxDim;
    cloned.scale.setScalar(scaleFactor);
    box.setFromObject(cloned);
    const center = box.getCenter(new Vector3());
    cloned.position.sub(center);
    cloned.rotation.x = -Math.PI / 2;
    cloned.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mat = obj.material.clone();
        if (mat.color) mat.color.set('#cccccc');
        if (mat.metalness !== undefined) mat.metalness = 0.2;
        if (mat.roughness !== undefined) mat.roughness = 0.8;
        obj.material = mat;
      }
    });
    return cloned;
  }, [gltf.scene]);

  return <primitive ref={modelRef} object={processedScene} />;
};

useGLTF.preload('/models/spy-icon.gltf');
export default SpyIconModel; 