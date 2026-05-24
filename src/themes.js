// Can theme application, animated background swaps, and favicon updates.

const THEME_TRANSITION_MS = 700; // Must stay aligned with the CSS opacity transition for .scene-bg--next.
const HIGHLIGHT_RADIUS = '13rem'; // Size of the bright center highlight in the scene gradient.
const CORE_RADIUS = '26rem'; // Size of the theme-colored core glow behind the model.
const SIDE_GLOW_RADIUS = '28rem'; // Size of the upper-left glow layer.
const SHADOW_RADIUS = '30rem'; // Size of the lower-right shadow layer.

export function createThemeController({ app, currentBackground, nextBackground, favicon }) {
  let themeTransitionTimer;

  function applyTheme(theme, faviconPath) {
    app.style.setProperty('--scene-primary', theme.primary);
    app.style.setProperty('--scene-mid', theme.mid);
    app.style.setProperty('--scene-dark', theme.dark);
    app.style.setProperty('--scene-core', theme.core);
    app.style.setProperty('--scene-glow', theme.glow);
    app.style.setProperty('--scene-shadow', theme.shadow);
    app.style.setProperty('--particle-rgb', theme.particle);
    app.dataset.can = theme.name;

    updateFavicon(faviconPath);
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
    }, THEME_TRANSITION_MS);
  }

  return {
    applyTheme,
  };
}

function buildSceneBackground(theme) {
  return `
    radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.24), transparent ${HIGHLIGHT_RADIUS}),
    radial-gradient(circle at 50% 50%, ${theme.core}, transparent ${CORE_RADIUS}),
    radial-gradient(circle at 18% 15%, ${theme.glow}, transparent ${SIDE_GLOW_RADIUS}),
    radial-gradient(circle at 84% 82%, ${theme.shadow}, transparent ${SHADOW_RADIUS}),
    linear-gradient(145deg, ${theme.primary} 0%, ${theme.mid} 43%, ${theme.dark} 100%)
  `;
}
