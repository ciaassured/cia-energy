// Input-mode detection and the short UI copy that changes for touch devices.

const TOUCH_QUERY = '(hover: none), (pointer: coarse)'; // Matches phones, tablets, and other coarse pointers.
const DESKTOP_ENTRY_PROMPT = 'Click to enter'; // Entry copy for mouse/trackpad users.
const TOUCH_ENTRY_PROMPT = 'Tap to enter'; // Entry copy for touch users.
const DESKTOP_HINT_TEXT = 'Scroll'; // Bottom hint shown when wheel switching is expected.
const TOUCH_HINT_TEXT = 'Next can'; // Bottom button label shown when tapping is expected.
const DESKTOP_HINT_LABEL = 'Scroll to switch cans'; // Accessible label for desktop hint state.
const TOUCH_HINT_LABEL = 'Switch to next can'; // Accessible label for mobile button state.

export function createResponsiveCopy({ scrollHint, scrollHintText }) {
  const touchQuery = window.matchMedia(TOUCH_QUERY);
  const callbacks = new Set();

  function isTouchInput() {
    return touchQuery.matches;
  }

  function getEntryPrompt() {
    return isTouchInput() ? TOUCH_ENTRY_PROMPT : DESKTOP_ENTRY_PROMPT;
  }

  function update() {
    scrollHintText.textContent = isTouchInput() ? TOUCH_HINT_TEXT : DESKTOP_HINT_TEXT;
    scrollHint.setAttribute('aria-label', isTouchInput() ? TOUCH_HINT_LABEL : DESKTOP_HINT_LABEL);

    for (const callback of callbacks) {
      callback();
    }
  }

  function onChange(callback) {
    callbacks.add(callback);

    return () => callbacks.delete(callback);
  }

  touchQuery.addEventListener('change', update);
  update();

  return {
    getEntryPrompt,
    isTouchInput,
    onChange,
  };
}
