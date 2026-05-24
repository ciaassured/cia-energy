// Short presentation audio effects and audio-based interaction timing.

const CAN_OPEN_PATH = 'audio/can-open.mp3'; // Entry sound played when the user starts the experience.
const SWOOSH_PATH = 'audio/swoosh.mp3'; // Transition sound played when switching between cans.
const SWOOSH_FALLBACK_DURATION_MS = 650; // Used when the browser has not reported the swoosh duration yet.
const MIN_SWITCH_LOCK_MS = 320; // Minimum delay before another can switch can be triggered.

export function createAudioController() {
  const openSound = new Audio(`${import.meta.env.BASE_URL}${CAN_OPEN_PATH}`);
  openSound.preload = 'auto';

  const swooshSound = new Audio(`${import.meta.env.BASE_URL}${SWOOSH_PATH}`);
  swooshSound.preload = 'auto';

  function playOpen() {
    openSound.currentTime = 0;
    return openSound.play().catch(() => {});
  }

  function playSwoosh() {
    swooshSound.currentTime = 0;
    return swooshSound.play().catch(() => {});
  }

  function getSwooshLockDuration() {
    const duration = Number.isFinite(swooshSound.duration)
      ? swooshSound.duration * 1000
      : SWOOSH_FALLBACK_DURATION_MS;

    return Math.max(duration, MIN_SWITCH_LOCK_MS);
  }

  return {
    playOpen,
    playSwoosh,
    getSwooshLockDuration,
  };
}
