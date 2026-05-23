# CIA Energy

Single-page Three.js viewer for the Freshup 3D can render.

## Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

The app uses Vite with `base: './'`, so the production build works from a GitHub Pages project path.

## Asset

The web model lives at `public/models/freshup.glb`. Re-export the Blender source to that path when the model changes.
