// Can model data, GLB loading, texture sharpening, and active can switching.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TEXTURE_PROPERTIES = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
]; // Material texture slots sharpened after GLB load.

const CANS = [
  {
    model: 'models/cia-energy.glb', // Default AdBlue can GLB served from public/models.
    favicon: 'favicons/can-adblue.svg', // Browser tab icon for the AdBlue theme.
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
    model: 'models/cia-energy-91.glb', // Alternate 91 can GLB served from public/models.
    favicon: 'favicons/can-91.svg', // Browser tab icon for the 91 theme.
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

export function createCanController({ root, renderer, frameModel, onActiveCanChange }) {
  const loader = new GLTFLoader();
  let activeCanIndex = 0;

  function load() {
    return Promise.all(CANS.map(loadCan)).then((models) => {
      models.forEach((model, index) => {
        CANS[index].scene = model;
        model.visible = index === activeCanIndex;
        root.add(model);
        frameModel(model);
      });
    });
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
    activeCanIndex = (index + CANS.length) % CANS.length;

    CANS.forEach((can, canIndex) => {
      if (can.scene) {
        can.scene.visible = canIndex === activeCanIndex;
      }
    });

    onActiveCanChange(CANS[activeCanIndex]);
  }

  function switchCan(direction) {
    setActiveCan(activeCanIndex + direction);
  }

  function sharpenModelTextures(model) {
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    model.traverse((object) => {
      if (!object.isMesh) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];

      for (const material of materials) {
        if (!material) {
          continue;
        }

        for (const property of TEXTURE_PROPERTIES) {
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

  return {
    load,
    setActiveCan,
    switchCan,
  };
}
