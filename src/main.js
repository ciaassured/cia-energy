import './styles.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#scene');
const particlesCanvas = document.querySelector('#particles');
const particlesContext = particlesCanvas.getContext('2d');
const entry = document.querySelector('#entry');
const status = document.querySelector('#status');
const scrollHint = document.querySelector('#scroll-hint');
const currentBackground = document.querySelector('#scene-bg-current');
const nextBackground = document.querySelector('#scene-bg-next');
const favicon = document.querySelector('link[rel="icon"]');
const openSound = new Audio(`${import.meta.env.BASE_URL}audio/can-open.mp3`);
openSound.preload = 'auto';
const swooshSound = new Audio(`${import.meta.env.BASE_URL}audio/swoosh.mp3`);
swooshSound.preload = 'auto';
const app = document.querySelector('#app');

const cans = [
  {
    model: 'models/cia-energy.glb',
    favicon: 'favicons/can-adblue.svg',
    theme: {
      name: 'adblue',
      primary: '#00a1dc',
      mid: '#0079b4',
      dark: '#003f72',
      core: 'rgba(0, 84, 142, 0.4)',
      glow: 'rgba(121, 226, 255, 0.36)',
      shadow: 'rgba(0, 61, 112, 0.52)',
      particle: '218, 247, 255',
    },
  },
  {
    model: 'models/cia-energy-91.glb',
    favicon: 'favicons/can-91.svg',
    theme: {
      name: '91',
      primary: '#009b3a',
      mid: '#007b31',
      dark: '#00491f',
      core: 'rgba(0, 86, 34, 0.4)',
      glow: 'rgba(108, 236, 152, 0.34)',
      shadow: 'rgba(0, 62, 28, 0.52)',
      particle: '216, 255, 228',
    },
  },
];

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
renderer.toneMappingExposure = 1.28;

const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(environment).texture;
environment.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 6;
controls.target.set(0, 0, 0);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(4, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe8f9ff, 2.2);
fillLight.position.set(-4, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xd8f0ff, 1.8);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 1.1);
frontLight.position.set(0, 1, 6);
scene.add(frontLight);

const underLight = new THREE.DirectionalLight(0xe6fbff, 2.1);
underLight.position.set(0, -4, 3);
scene.add(underLight);

const ambientLight = new THREE.HemisphereLight(0xf4fbff, 0x0087bf, 3.25);
scene.add(ambientLight);

const root = new THREE.Group();
scene.add(root);
let particles = [];
let activeCanIndex = 0;
let wheelLock = false;
let hintTimer;
let themeTransitionTimer;
let isModelReady = false;
let isMinimumTimeDone = false;
let hasEntered = false;

setTimeout(() => {
  isMinimumTimeDone = true;
  updateEntryState();
}, 1000);

const loader = new GLTFLoader();
Promise.all(cans.map(loadCan)).then((models) => {
  models.forEach((model, index) => {
    cans[index].scene = model;
    model.visible = index === activeCanIndex;
    root.add(model);
    frameModel(model);
  });

  setActiveCan(0);
  isModelReady = true;
  updateEntryState();
}).catch(() => {
  status.textContent = 'Render failed to load';
  entry.classList.add('entry--error');
});

window.addEventListener('wheel', (event) => {
  if (!isModelReady || wheelLock || Math.abs(event.deltaY) < 8) {
    return;
  }

  event.preventDefault();
  wheelLock = true;
  const direction = event.deltaY > 0 ? 1 : -1;
  setActiveCan(activeCanIndex + direction);
  pulseScrollHint();
  playSwoosh().finally(unlockWheelAfterSwoosh);
}, { passive: false });

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
    showScrollHint();
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

function loadCan(can) {
  return new Promise((resolve, reject) => {
    loader.load(
      `${import.meta.env.BASE_URL}${can.model}`,
      (gltf) => {
        sharpenModelTextures(gltf.scene);
        resolve(gltf.scene);
      },
      undefined,
      reject,
    );
  });
}

function setActiveCan(index) {
  activeCanIndex = (index + cans.length) % cans.length;

  cans.forEach((can, canIndex) => {
    if (can.scene) {
      can.scene.visible = canIndex === activeCanIndex;
    }
  });

  applyTheme(cans[activeCanIndex].theme);
  updateFavicon(cans[activeCanIndex].favicon);
}

function playSwoosh() {
  swooshSound.currentTime = 0;
  return swooshSound.play().catch(() => {});
}

function unlockWheelAfterSwoosh() {
  const duration = Number.isFinite(swooshSound.duration) ? swooshSound.duration * 1000 : 650;

  setTimeout(() => {
    wheelLock = false;
  }, Math.max(duration, 320));
}

function showScrollHint() {
  if (!hasEntered) {
    return;
  }

  scrollHint.classList.add('scroll-hint--visible');
  scrollHint.classList.remove('scroll-hint--used');
}

function pulseScrollHint() {
  scrollHint.classList.remove('scroll-hint--visible');
  scrollHint.classList.add('scroll-hint--used');
  clearTimeout(hintTimer);

  hintTimer = setTimeout(showScrollHint, 1800);
}

function applyTheme(theme) {
  app.style.setProperty('--scene-primary', theme.primary);
  app.style.setProperty('--scene-mid', theme.mid);
  app.style.setProperty('--scene-dark', theme.dark);
  app.style.setProperty('--scene-core', theme.core);
  app.style.setProperty('--scene-glow', theme.glow);
  app.style.setProperty('--scene-shadow', theme.shadow);
  app.style.setProperty('--particle-rgb', theme.particle);
  app.dataset.can = theme.name;
  animateBackgroundTheme(theme);
}

function updateFavicon(path) {
  favicon.href = `${import.meta.env.BASE_URL}${path}`;
}

function animateBackgroundTheme(theme) {
  const background = buildSceneBackground(theme);

  clearTimeout(themeTransitionTimer);

  if (!currentBackground.style.background) {
    currentBackground.style.background = background;
    return;
  }

  nextBackground.style.background = background;
  app.classList.add('is-theme-switching');

  themeTransitionTimer = setTimeout(() => {
    currentBackground.style.background = background;
    app.classList.remove('is-theme-switching');
  }, 700);
}

function buildSceneBackground(theme) {
  return `
    radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.24), transparent 13rem),
    radial-gradient(circle at 50% 50%, ${theme.core}, transparent 26rem),
    radial-gradient(circle at 18% 15%, ${theme.glow}, transparent 28rem),
    radial-gradient(circle at 84% 82%, ${theme.shadow}, transparent 30rem),
    linear-gradient(145deg, ${theme.primary} 0%, ${theme.mid} 43%, ${theme.dark} 100%)
  `;
}

function sharpenModelTextures(model) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const textureProperties = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'emissiveMap',
    'alphaMap',
  ];

  model.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    for (const material of materials) {
      if (!material) {
        continue;
      }

      for (const property of textureProperties) {
        const texture = material[property];

        if (!texture?.isTexture) {
          continue;
        }

        texture.anisotropy = maxAnisotropy;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      }
    }
  });
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
  model.position.y -= 1.25;

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
    particlesContext.fillStyle = `rgba(${getComputedStyle(app).getPropertyValue('--particle-rgb')}, ${particle.alpha})`;
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
