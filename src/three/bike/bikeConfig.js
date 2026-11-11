/**
 * Bike settings. To use a real model, drop a .glb into /public/models and set
 * `modelUrl: '/models/motorbike.glb'` — see GLTFBike.jsx and the README.
 * Bikes are modelled facing +Z, with the ground at y = 0.
 */
export const bikeConfig = {
  modelUrl: '', // '' = use the primitive bike
  modelScale: 1,
  modelRotationY: 0, // radians, if your model faces another way
  wheelRadius: 0.36, // used to spin wheels at the right speed
  headlight: [0, 1.0, 1.05], // where the beam & spotlight start (bike space)
};
