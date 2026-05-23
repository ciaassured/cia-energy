# Project Agent Notes

## Project Goal

Build a single-page web app that presents the CIA Energy drink can model as the main experience. The model should sit centered on the page, rotate by default at the current established pace, and allow pointer/touch camera orbit controls similar to moving around a model in Blender.

## Stack

- Use Vite with vanilla JavaScript.
- Use Three.js for 3D rendering.
- Keep the app compatible with GitHub Pages.
- Use relative build paths through `base: './'` in `vite.config.js`.
- Serve static model files from `public/models`.

## Asset Workflow

- Blender source file: `assets/blender/cia-energy.blend`.
- BlenderKit asset base ID: `513f59ae-3148-4a66-a0cb-d95081ea1ead`.
- Web model file: `public/models/cia-energy.glb`.
- If the Blender source changes, re-export a GLB and replace `public/models/cia-energy.glb`.
- Update the can graphics in Blender before export; do not rely on browser-side or scripted text overlays for the label.
- Do not load `.blend` files in the browser.

## Design Direction

- Keep the experience focused on the render, with the current entry gate, can-opening audio, and subtle particle layer treated as part of the intended presentation.
- The 3D canvas should fill the viewport and keep the can visually centered.
- Avoid adding landing-page copy, cards, extra sections, or competing UI unless requested.
- Any controls should be subtle and not compete with the model.

## Verification

- Run `npm run build` before considering changes complete.
- For visual changes, run the dev server and verify the model appears, rotates slowly, and can be orbited with mouse/touch.

## Git

- Use Conventional Commits for commit messages.
- Prefer concise messages such as `feat: create CIA Energy 3D viewer` or `chore: update deployment workflow`.
