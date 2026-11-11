import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { bikeConfig } from './bikeConfig.js';

/**
 * Loads a .glb bike and animates it with the same `anim` contract as PrimitiveBike.
 *
 * Name these nodes in Blender (or edit NODE_NAMES) so they can be animated:
 *   - "WheelFront", "WheelRear": origin at the axle, spin around local X
 *   - "Steer": front fork / handlebar group, origin on the steering axis, turns around local Y
 * Nodes that are missing are simply not animated.
 */
const NODE_NAMES = { front: 'WheelFront', rear: 'WheelRear', steer: 'Steer' };

export function GLTFBike({ anim }) {
  const { scene } = useGLTF(bikeConfig.modelUrl);
  const model = useMemo(() => scene.clone(true), [scene]);
  const nodes = useMemo(
    () => ({
      front: model.getObjectByName(NODE_NAMES.front),
      rear: model.getObjectByName(NODE_NAMES.rear),
      steer: model.getObjectByName(NODE_NAMES.steer),
    }),
    [model]
  );

  useFrame(() => {
    if (nodes.front) nodes.front.rotation.x = anim.wheel;
    if (nodes.rear) nodes.rear.rotation.x = anim.wheel;
    if (nodes.steer) nodes.steer.rotation.y = anim.steer;
  });

  return (
    <primitive object={model} scale={bikeConfig.modelScale} rotation={[0, bikeConfig.modelRotationY, 0]} />
  );
}
