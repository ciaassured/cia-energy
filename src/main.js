import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#scene');
const particlesCanvas = document.querySelector('#particles');
const particlesContext = particlesCanvas.getContext('2d');
const entry = document.querySelector('#entry');
const status = document.querySelector('#status');
const openSound = new Audio(`${import.meta.env.BASE_URL}audio/can-open.mp3`);
openSound.preload = 'auto';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0.8, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 6;
controls.target.set(0, 0, 0);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(4, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe8f9ff, 1.65);
fillLight.position.set(-4, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xd8f0ff, 1.8);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

const underLight = new THREE.DirectionalLight(0xe6fbff, 1.8);
underLight.position.set(0, -4, 3);
scene.add(underLight);

const ambientLight = new THREE.HemisphereLight(0xf4fbff, 0x004e76, 2.1);
scene.add(ambientLight);

const root = new THREE.Group();
scene.add(root);
let particles = [];
let isModelReady = false;
let isMinimumTimeDone = false;
let hasEntered = false;

setTimeout(() => {
  isMinimumTimeDone = true;
  updateEntryState();
}, 1000);

const loader = new GLTFLoader();
loader.load(
  `${import.meta.env.BASE_URL}models/cia-energy.glb`,
  (gltf) => {
    root.add(gltf.scene);
    frameModel(gltf.scene);
    isModelReady = true;
    updateEntryState();
  },
  undefined,
  () => {
    status.textContent = 'Render failed to load';
    entry.classList.add('entry--error');
  },
);

entry.addEventListener('click', () => {
  if (!isModelReady || hasEntered) {
    return;
  }

  hasEntered = true;
  entry.disabled = true;
  entry.classList.add('entry--leaving');

  openSound.currentTime = 0;
  openSound.play().catch(() => {});

  setTimeout(() => {
    entry.hidden = true;
  }, 800);
});

function updateEntryState() {
  if (!isModelReady || !isMinimumTimeDone || hasEntered) {
    return;
  }

  status.textContent = 'Click to enter';
  entry.disabled = false;
  entry.classList.add('entry--ready');
}

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
  resizeParticles();
}

function resizeParticles() {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  particlesCanvas.width = Math.floor(window.innerWidth * pixelRatio);
  particlesCanvas.height = Math.floor(window.innerHeight * pixelRatio);
  particlesCanvas.style.width = `${window.innerWidth}px`;
  particlesCanvas.style.height = `${window.innerHeight}px`;
  particlesContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = window.innerWidth < 720 ? 42 : 78;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: 0.7 + Math.random() * 2.2,
    depth: 0.25 + Math.random() * 0.75,
    drift: Math.random() * Math.PI * 2,
    speed: 0.09 + Math.random() * 0.18,
    alpha: 0.08 + Math.random() * 0.22,
  }));
}

function drawParticles(time) {
  particlesContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particlesContext.globalCompositeOperation = 'lighter';

  for (const particle of particles) {
    const x = particle.x + Math.sin(time * particle.speed + particle.drift) * 18 * particle.depth;
    const y = particle.y + Math.cos(time * particle.speed * 0.78 + particle.drift) * 26 * particle.depth;

    particlesContext.beginPath();
    particlesContext.fillStyle = `rgba(218, 247, 255, ${particle.alpha})`;
    particlesContext.arc(x, y, particle.radius * particle.depth, 0, Math.PI * 2);
    particlesContext.fill();
  }

  particlesContext.globalCompositeOperation = 'source-over';
}

function animate(time = 0) {
  drawParticles(time * 0.001);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resizeParticles();
animate();
