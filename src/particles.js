// Subtle particle canvas layer, including sizing, generation, and drawing.

const MAX_PIXEL_RATIO = 2; // Caps particle canvas resolution for performance on dense screens.
const MOBILE_WIDTH_BREAKPOINT = 720; // Width below which the lighter mobile particle count is used.
const MOBILE_PARTICLE_COUNT = 42; // Number of particles rendered on narrow screens.
const DESKTOP_PARTICLE_COUNT = 78; // Number of particles rendered on wider screens.
const MIN_RADIUS = 0.7; // Smallest particle radius in CSS pixels.
const RADIUS_RANGE = 2.2; // Additional random radius added per particle.
const MIN_DEPTH = 0.25; // Lowest parallax multiplier.
const DEPTH_RANGE = 0.75; // Additional random parallax multiplier.
const MIN_SPEED = 0.09; // Slowest particle drift speed.
const SPEED_RANGE = 0.18; // Additional random drift speed.
const MIN_ALPHA = 0.08; // Lowest particle opacity.
const ALPHA_RANGE = 0.22; // Additional random particle opacity.
const HORIZONTAL_DRIFT = 18; // Horizontal drift distance in CSS pixels.
const VERTICAL_DRIFT = 26; // Vertical drift distance in CSS pixels.
const VERTICAL_SPEED_RATIO = 0.78; // Slows vertical movement relative to horizontal movement.

export function createParticleLayer({ canvas, app }) {
  const context = canvas.getContext('2d');
  let particles = [];

  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = window.innerWidth < MOBILE_WIDTH_BREAKPOINT
      ? MOBILE_PARTICLE_COUNT
      : DESKTOP_PARTICLE_COUNT;

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: MIN_RADIUS + Math.random() * RADIUS_RANGE,
      depth: MIN_DEPTH + Math.random() * DEPTH_RANGE,
      drift: Math.random() * Math.PI * 2,
      speed: MIN_SPEED + Math.random() * SPEED_RANGE,
      alpha: MIN_ALPHA + Math.random() * ALPHA_RANGE,
    }));
  }

  function draw(time) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.globalCompositeOperation = 'lighter';

    for (const particle of particles) {
      const x = particle.x + Math.sin(time * particle.speed + particle.drift) * HORIZONTAL_DRIFT * particle.depth;
      const y = particle.y + Math.cos(time * particle.speed * VERTICAL_SPEED_RATIO + particle.drift) * VERTICAL_DRIFT * particle.depth;

      context.beginPath();
      context.fillStyle = `rgba(${getComputedStyle(app).getPropertyValue('--particle-rgb')}, ${particle.alpha})`;
      context.arc(x, y, particle.radius * particle.depth, 0, Math.PI * 2);
      context.fill();
    }

    context.globalCompositeOperation = 'source-over';
  }

  return {
    draw,
    resize,
  };
}
