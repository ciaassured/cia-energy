# Blender Label Workflow

Use this when replacing the CIA Energy can skin and exporting the web model.

## Files

- Source blend: `assets/blender/cia-energy.blend`
- Label artwork: `assets/energy-adblue.png`
- Web model output: `public/models/cia-energy.glb`

## Update The Can Skin

1. Open `assets/blender/cia-energy.blend` in Blender.
2. Select the can body object.
3. Open the Shader Editor and select the `Label` material.
4. Find the image texture node connected to the Principled BSDF `Base Color` input.
5. Replace that image with the new can-wrap PNG.
6. Confirm the label is mapped correctly on the can in Material Preview or Rendered view.
7. Save the blend file.

## Export The GLB

1. Go to `File > Export > glTF 2.0`.
2. Set the format to `glTF Binary (.glb)`.
3. Export to `public/models/cia-energy.glb`, replacing the existing file.
4. Do not export or load `.blend` files in the browser.
