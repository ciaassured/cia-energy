// Loading gate state, entry prompt updates, and entry exit timing.

const MIN_LOADING_TIME_MS = 1000; // Keeps the loading gate visible long enough to feel intentional.
const ENTRY_HIDE_DELAY_MS = 800; // Matches the leaving animation before removing the gate from layout.
const LOAD_ERROR_MESSAGE = 'Render failed to load'; // Fallback copy when model loading fails.

export function createEntryGate({ entry, status, getEntryPrompt, onEnter, onEntered }) {
  let isModelReady = false;
  let isMinimumTimeDone = false;
  let hasEntered = false;

  setTimeout(() => {
    isMinimumTimeDone = true;
    updateReadyState();
  }, MIN_LOADING_TIME_MS);

  entry.addEventListener('click', () => {
    if (!isModelReady || hasEntered) {
      return;
    }

    hasEntered = true;
    entry.disabled = true;
    entry.classList.add('entry--leaving');
    onEnter();

    setTimeout(() => {
      entry.hidden = true;
      onEntered();
    }, ENTRY_HIDE_DELAY_MS);
  });

  function setModelReady() {
    isModelReady = true;
    updateReadyState();
  }

  function setError(message = LOAD_ERROR_MESSAGE) {
    status.textContent = message;
    entry.classList.add('entry--error');
  }

  function refreshCopy() {
    if (isModelReady && isMinimumTimeDone && !hasEntered) {
      status.textContent = getEntryPrompt();
    }
  }

  function updateReadyState() {
    if (!isModelReady || !isMinimumTimeDone || hasEntered) {
      return;
    }

    status.textContent = getEntryPrompt();
    entry.disabled = false;
    entry.classList.add('entry--ready');
  }

  return {
    hasEntered: () => hasEntered,
    refreshCopy,
    setError,
    setModelReady,
  };
}
