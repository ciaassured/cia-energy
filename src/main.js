import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#scene');
const status = document.querySelector('#status');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ec);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0.8, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.22;
controls.target.set(0, 0, 0);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(4, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xfff2d6, 1.4);
fillLight.position.set(-4, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xd8f0ff, 1.8);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

const ambientLight = new THREE.HemisphereLight(0xffffff, 0xd8cab5, 2.4);
scene.add(ambientLight);

const root = new THREE.Group();
scene.add(root);

const loader = new GLTFLoader();
loader.load(
  `${import.meta.env.BASE_URL}models/freshup.glb`,
  (gltf) => {
    root.add(gltf.scene);
    frameModel(gltf.scene);
    status.hidden = true;
  },
  undefined,
  () => {
    status.textContent = 'Render failed to load';
  },
);

function frameModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  model.position.sub(center);

  const targetHeight = 3.4;
  const scale = targetHeight / maxDimension;
  model.scale.setScalar(scale);

  controls.target.set(0, 0, 0);
  camera.position.set(0, 0.8, 12);
  camera.near = 0.01;
  camera.far = 100;
  camera.updateProjectionMatrix();
  controls.update();
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
animate();
