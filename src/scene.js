// Three.js renderer, camera, lighting, orbit controls, and model framing.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CAMERA_FOV = 35; // Perspective field of view for the product render.
const CAMERA_NEAR = 0.01; // Near clipping plane for close model details.
const CAMERA_FAR = 1000; // Initial far clipping plane before model framing.
const CAMERA_INITIAL_POSITION = [0, 0.8, 6]; // Camera position before loaded models are framed.
const MAX_PIXEL_RATIO = 2; // Caps WebGL render resolution for performance on dense screens.
const TONE_MAPPING_EXPOSURE = 1.28; // Overall render exposure for the metallic can.
const CONTROLS_DAMPING_FACTOR = 0.05; // Smooths OrbitControls movement.
const AUTO_ROTATE_SPEED = 6; // Default idle rotation speed for the can.
const INITIAL_CONTROLS_TARGET = [0, 0, 0]; // Orbit target before model framing.
const MODEL_TARGET_HEIGHT = 3.4; // Normalized model height after framing.
const MODEL_VERTICAL_OFFSET = -1.25; // Lowers the centered model within the scene.
const FRAMED_CONTROLS_TARGET = [0, 0, 0]; // Orbit target after model framing.
const FRAMED_CAMERA_POSITION = [0, 0.8, 12]; // Camera position used for the framed can.
const FRAMED_CAMERA_NEAR = 0.01; // Near clipping plane after model framing.
const FRAMED_CAMERA_FAR = 100; // Far clipping plane after model framing.

const LIGHTS = [
  { type: 'directional', color: 0xffffff, intensity: 2.4, position: [4, 5, 5] }, // Main highlight across the front.
  { type: 'directional', color: 0xe8f9ff, intensity: 2.2, position: [-4, 2, 3] }, // Soft fill from camera-left.
  { type: 'directional', color: 0xd8f0ff, intensity: 1.8, position: [0, 3, -5] }, // Rim light separating the can from background.
  { type: 'directional', color: 0xffffff, intensity: 1.1, position: [0, 1, 6] }, // Front label readability light.
  { type: 'directional', color: 0xe6fbff, intensity: 2.1, position: [0, -4, 3] }, // Under-light for lower metal detail.
  { type: 'hemisphere', skyColor: 0xf4fbff, groundColor: 0x0087bf, intensity: 3.25 }, // Ambient scene lift.
];

export function createScene({ canvas }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.set(...CAMERA_INITIAL_POSITION);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;
  environment.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CONTROLS_DAMPING_FACTOR;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  controls.target.set(...INITIAL_CONTROLS_TARGET);

  for (const lightConfig of LIGHTS) {
    scene.add(createLight(lightConfig));
  }

  const root = new THREE.Group();
  scene.add(root);

  function frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    model.position.sub(center);

    const scale = MODEL_TARGET_HEIGHT / maxDimension;
    model.scale.setScalar(scale);
    model.position.y += MODEL_VERTICAL_OFFSET;

    controls.target.set(...FRAMED_CONTROLS_TARGET);
    camera.position.set(...FRAMED_CAMERA_POSITION);
    camera.near = FRAMED_CAMERA_NEAR;
    camera.far = FRAMED_CAMERA_FAR;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function update() {
    controls.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  return {
    frameModel,
    render,
    renderer,
    resize,
    root,
    update,
  };
}

function createLight(lightConfig) {
  if (lightConfig.type === 'hemisphere') {
    return new THREE.HemisphereLight(
      lightConfig.skyColor,
      lightConfig.groundColor,
      lightConfig.intensity,
    );
  }

  const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
  light.position.set(...lightConfig.position);
  return light;
}
