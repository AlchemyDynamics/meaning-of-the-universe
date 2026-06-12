# The Meaning of the Universe

A 3D research library, organized as a galaxy.

Each star is a domain of inquiry. Each planet is a research environment that distills its corpus into a one-minute conclusion you can descend into for hours. An AI Guide (bring-your-own Claude API key) can help you navigate, summarize, and choose what to read next.

**[→ Open the library](https://alchemydynamics.github.io/meaning-of-the-universe/)**

## The first eight territories

| | Cluster |
|---|---|
| **Simulation Theory** | metaphysics |
| **Plasma Dynamics** | physical |
| **World Religions** | humanity |
| **Economics** | systems |
| **Esoterica** | metaphysics |
| **Astrophysics** | physical |
| **Cosmology** | physical |
| **Computation** | systems |

Each topic ships with a distilled conclusion, a connections map, and 3–5 substantive research documents (summary → key findings → full prose) for ~32 readings total.

## What it is

- **Galactic navigator** — Three.js starfield, ~6,000 stars, glowing topic-nodes connected by faint constellation edges. Drag to rotate, scroll to zoom, hover for a label, click to enter.
- **Planet research environments** — Procedural shader planet per topic (8 visual themes: grid, plasma, mandala, flow, crystal, gas, cmb, circuit), action menu for conclusion / documents / connections / guide.
- **Document reader** — Two-column reader with summary, key findings, and full prose for each entry.
- **AI Guide** — Persistent chat dock. Knows your current location in the galaxy. Can navigate for you ("take me to Cosmology"). Direct Anthropic API call from the browser using `anthropic-dangerous-direct-browser-access`.

## Stack

- Vanilla HTML + ES modules.
- [Three.js 0.160](https://threejs.org) via CDN import map (`unpkg`).
- Custom GLSL fragment shaders for the eight planet themes.
- `EffectComposer` + `UnrealBloomPass` for the glow.
- No build step. No bundler. Open `index.html` in a modern browser.

## Run locally

```bash
# from project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or any static server.

## AI Guide setup

1. Click the **librarian** pill (bottom-right) or press <kbd>?</kbd>.
2. Paste a Claude API key (starts with `sk-ant-`). It is stored only in your browser's `localStorage`.
3. Ask anything. The guide knows the corpus and your current location.

The guide will append `[[navigate:topic-id]]` markers when it recommends moving to a topic — the front-end turns these into clickable warp buttons.

## Adding a new topic

Edit `assets/js/data.js`:

```js
{
  id: "your-topic",
  name: "Your Topic",
  cluster: "metaphysics" | "physical" | "systems" | "humanity",
  color: "#hex",
  position: [x, y, z],         // 3D coords, ~20-unit radius
  size: 1.0,
  tags: [...],
  summary: "...",
  conclusion: "one-line distillation",
  conclusionBody: [{type:"p", text:"..."}, {type:"h4",text:"..."}, {type:"ul",items:[...]}],
  planetTheme: { type: "grid"|"plasma"|"mandala"|"flow"|"crystal"|"gas"|"cmb"|"circuit", params: {...} },
  documents: [
    {
      id: "...", type: "survey"|"frontier"|...,
      title: "...", author: "...",
      summary: "...", findings: ["..."], prose: ["...","..."],
    },
  ],
},
```

Add edges in the `EDGES` array. Refresh.

## License

MIT. A project by [Alchemy Dynamics](https://github.com/AlchemyDynamics).
