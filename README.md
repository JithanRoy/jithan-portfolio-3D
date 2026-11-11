# Jithan Roy — Ride-through 3D Portfolio

A motorbike rides a winding sunset-to-neon-night highway; each portfolio section is a landmark along the road.
Built with React + Vite, three.js, @react-three/fiber and @react-three/drei.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build locally
```

Node 18+ (tested on Node 24).

**Controls:** scroll / swipe to ride · W/↑ accelerate · S/↓ roll back · A/D or ←/→ steer within the lane ·
"Jump to" menu or the route map to skip ahead · 📯 honk · 🔇/🔊 engine sound (off by default) · "2D view" for the simple version.

## Folder structure

```
index.html                 Shell; SEO tags + static copy are injected at build time
vite.config.js             Vite + the "content-seo" plugin + chunk splitting
seo/staticHtml.js          Generates <head> meta / Open Graph / JSON-LD and a crawlable HTML copy
public/                    favicon.svg, og-image.png (1200×630), apple-touch-icon.png
src/
  content.js               ← ALL YOUR TEXT, LINKS, PROJECTS, JOBS (edit this)
  theme.js                 ← colors + day→night sky keyframes
  route.js                 Stops derived from content.js, scroll↔progress easing
  store.js                 Tiny shared state (ride progress, active stop, sound…)
  App.jsx                  Chooses 3D ride vs simple version (WebGL check, ?view=simple)
  RideApp.jsx              Canvas + HUD + loader (lazy-loaded; simple view never downloads three.js)
  audio/engine.js          Synthesized engine + horn (Web Audio, no files)
  three/
    roadPath.js            ← road control points, road width, lane
    layout.js              Where each landmark sits relative to its stop
    Scene.jsx              ScrollControls + everything in the world
    Rider.jsx              Scroll → progress, bike pose/lean, chase camera, FOV, keyboard
    Atmosphere.jsx         Sky dome, sun, stars, fog, lights (day→night)
    Road.jsx               Road ribbon, neon edge lines, dashes
    Scenery.jsx            Instanced trees (swaying), hills, lamps, clouds, neon city
    Traffic.jsx            Oncoming cars
    Landmarks.jsx          Gate, garage, skill signs, billboards, milestones, finish, rest stop
    bike/
      bikeConfig.js        ← set modelUrl to use a .glb
      Bike.jsx             Picks primitive vs glTF bike
      PrimitiveBike.jsx    Bike + rider from primitives
      GLTFBike.jsx         glTF loader using the same animation contract
  ui/
    Hud.jsx                Header, jump menu, sound/honk, route-map progress, speed lines, hint
    SectionPanel.jsx       Content panel that fades in at each stop
    blocks.jsx             Content renderers shared by the panel and the simple version
    SimpleSite.jsx         Accessible 2D version
    Loader.jsx             Loading screen with progress bar
  styles.css
```

## Where to edit things

| What | File |
| --- | --- |
| Name, bio, skills, projects, experience, education, contact, résumé link | `src/content.js` |
| Site URL, page title, meta description, OG image | `site` in `src/content.js` |
| Colors (scene + UI) | `palette` in `src/theme.js` (UI picks them up as `--c-*` CSS variables) |
| Sunset → night timing/colors | `skyKeys` in `src/theme.js` |
| Road shape | `CONTROL_POINTS` in `src/three/roadPath.js` (`[x, z]` pairs, ride goes first → last) |
| How long the ride is / how strongly it eases at stops | `SCROLL_PAGES`, `SLOW` in `src/route.js` |
| Landmark placement | `src/three/layout.js` |

Adding a project or job in `content.js` automatically adds a stop, a billboard / milestone, a route-map entry,
a panel and an entry in the simple version and the static SEO HTML.

To add a résumé: put the PDF in `public/` (e.g. `public/Jithan-Roy-Resume.pdf`) and set `contact.resume: '/Jithan-Roy-Resume.pdf'`.

## Deploy

### Vercel
1. Push this folder to a GitHub repo (or set **Root Directory** to `portfolio-3d` if it lives inside another repo).
2. vercel.com → **Add New → Project** → import the repo. Vercel detects Vite (build `npm run build`, output `dist`). Deploy.
3. Custom domain: **Project → Settings → Domains → Add** `yourdomain.com`. At your DNS provider add
   an `A` record `@ → 76.76.21.21` and a `CNAME` `www → cname.vercel-dns.com` (Vercel shows the exact values). HTTPS is automatic.

Or from the CLI: `npm i -g vercel && vercel` (preview) then `vercel --prod`.

### Netlify
`netlify.toml` is included (build `npm run build`, publish `dist`, long-cache headers for `/assets`).
1. app.netlify.com → **Add new site → Import from Git** → pick the repo (set **Base directory** to `portfolio-3d` if needed).
2. Custom domain: **Site configuration → Domain management → Add a domain**, then either use Netlify DNS or add a
   `CNAME www → <site>.netlify.app` plus the apex `A`/`ALIAS` record Netlify shows you.

**After you know the domain, update `site.url` in `src/content.js`** so canonical and Open Graph URLs are correct, then redeploy.

## Swapping in a real 3D bike (.glb)

1. Get a low-poly motorbike (Sketchfab, Poly Pizza, or your own Blender model). Aim for < 30k triangles and < 2 MB.
2. In Blender: make the bike face **+Z** (in three.js terms; Blender's −Y forward exports as +Z with "+Y up"), ground at 0,
   and name the parts so they can be animated:
   - `WheelFront`, `WheelRear` — origin at the axle (they spin around local X)
   - `Steer` — fork + handlebar, origin on the steering axis (turns around local Y)
3. Export glTF Binary (`.glb`). Optionally compress: `npx gltfjsx model.glb --transform` (Draco + texture resize).
4. Put it in `public/models/motorbike.glb` and in `src/three/bike/bikeConfig.js` set
   `modelUrl: '/models/motorbike.glb'`, adjust `modelScale` / `modelRotationY` until it sits right, and move
   `headlight` to the lamp position.
5. A rider model works the same way — add it inside `GLTFBike.jsx` (or bake it into the bike file).

The loader bar already tracks real download progress via drei's `useProgress` once a model is used.

## Accessibility, performance, SEO

- **Simple version**: "2D view" button, a skip link (first Tab stop), the loader's "View simple version", `?view=simple`,
  and automatic fallback when WebGL is unavailable. It doesn't download three.js (~55 kB gzipped total).
- **Reduced motion**: with `prefers-reduced-motion`, camera/scroll smoothing is removed, no FOV kick, speed lines,
  rider bob, tree sway or cloud drift, and CSS animations are disabled.
- **Performance**: `dpr` capped at 2 and dropped to 1 by `PerformanceMonitor` when FPS dips; trees, hills, lamps,
  clouds, buildings and dashes are instanced; 3 lights total (hemisphere, sun, headlight); no real-time shadows
  (blob shadow instead); in-world HTML labels mount only near the rider.
- **SEO**: title, description, canonical, Open Graph/Twitter tags, JSON-LD `Person`, favicon and a static HTML copy
  of all content in `index.html`, all generated from `content.js` at build time.
