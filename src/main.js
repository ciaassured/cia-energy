// App orchestration: DOM lookup, module wiring, global input, resize, and the animation loop.

import './styles.css';
import { createAudioController } from './audio.js';
import { createCanController } from './cans.js';
import { createEntryGate } from './entryGate.js';
import { createParticleLayer } from './particles.js';
import { createResponsiveCopy } from './responsive.js';
import { createScene } from './scene.js';
import { createThemeController } from './themes.js';

const WHEEL_DELTA_THRESHOLD = 8; // Small wheel movements below this are ignored to avoid accidental switches.
const HINT_RETURN_DELAY_MS = 1800; // Delay before the bottom switch hint returns after a can switch.

const app = document.querySelector('#app');
const canvas = document.querySelector('#scene');
const particlesCanvas = document.querySelector('#particles');
const entry = document.querySelector('#entry');
const status = document.querySelector('#status');
const scrollHint = document.querySelector('#scroll-hint');
const scrollHintText = scrollHint.querySelector('.scroll-hint__text');
const currentBackground = document.querySelector('#scene-bg-current');
const nextBackground = document.querySelector('#scene-bg-next');
const favicon = document.querySelector('link[rel="icon"]');

const viewer = createScene({ canvas });
const particles = createParticleLayer({ canvas: particlesCanvas, app });
const audio = createAudioController();
const responsiveCopy = createResponsiveCopy({ scrollHint, scrollHintText });
const themes = createThemeController({
  app,
  currentBackground,
  nextBackground,
  favicon,
});
const entryGate = createEntryGate({
  entry,
  status,
  getEntryPrompt: responsiveCopy.getEntryPrompt,
  onEnter: audio.playOpen,
  onEntered: showScrollHint,
});
const cans = createCanController({
  root: viewer.root,
  renderer: viewer.renderer,
  frameModel: viewer.frameModel,
  onActiveCanChange: (can) => themes.applyTheme(can.theme, can.favicon),
});

let isModelReady = false;
let switchLock = false;
let hintTimer;

responsiveCopy.onChange(entryGate.refreshCopy);

cans.load().then(() => {
  cans.setActiveCan(0);
  isModelReady = true;
  entryGate.setModelReady();
}).catch(() => {
  entryGate.setError();
});

window.addEventListener('wheel', (event) => {
  if (!isModelReady || Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) {
    return;
  }

  event.preventDefault();
  requestCanSwitch(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

scrollHint.addEventListener('click', () => {
  requestCanSwitch(1);
});

window.addEventListener('resize', resize);
resize();
animate();

function requestCanSwitch(direction) {
  if (!isModelReady || switchLock) {
    return;
  }

  switchLock = true;
  cans.switchCan(direction);
  pulseScrollHint();
  audio.playSwoosh().finally(unlockSwitchAfterSwoosh);
}

function unlockSwitchAfterSwoosh() {
  setTimeout(() => {
    switchLock = false;
  }, audio.getSwooshLockDuration());
}

function showScrollHint() {
  if (!entryGate.hasEntered()) {
    return;
  }

  scrollHint.classList.add('scroll-hint--visible');
  scrollHint.classList.remove('scroll-hint--used');
}

function pulseScrollHint() {
  scrollHint.classList.remove('scroll-hint--visible');
  scrollHint.classList.add('scroll-hint--used');
  clearTimeout(hintTimer);

  hintTimer = setTimeout(showScrollHint, HINT_RETURN_DELAY_MS);
}

function resize() {
  viewer.resize();
  particles.resize();
}

function animate(time = 0) {
  particles.draw(time * 0.001);
  viewer.update();
  viewer.render();
  requestAnimationFrame(animate);
}
