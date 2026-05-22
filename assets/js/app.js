/* ============================================================
   The Meaning of the Universe — application
   ------------------------------------------------------------
   Three.js scene with galactic point-cloud navigator and
   procedural-shader planet research environments.
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import {
  TOPICS, EDGES, CLUSTERS, SUB_TOPICS,
  topicById, connectionsOf,
  subTopicsOf, subTopicById, resolveById, allSearchable,
  registerGeneratedTopic, registerGeneratedMoon, registerGeneratedEdge,
} from "./data.js";

/* ============================================================
   Globals
   ============================================================ */
const state = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(-2, -2),
  hovered: null,            // topic id
  mode: "galaxy",           // "galaxy" | "transit" | "planet" | "moon" | "surface"
  currentTopic: null,       // topic object when in planet mode
  currentMoon: null,        // moon object when in moon mode
  topicMeshes: new Map(),   // id -> mesh
  moonMeshes: [],           // [{ id, group, mesh, orbit, hoverHalo }]
  generatingNow: false,
  genToken: 0,
  edgeLines: null,
  starfield: null,
  planetMesh: null,
  planetGroup: null,
  cameraTargetPos: null,
  cameraTargetLook: new THREE.Vector3(0, 0, 0),
  clock: new THREE.Clock(),
  edgesVisible: true,
  lastInteract: 0,
  // remembered camera pose to restore on return
  savedCam: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  // cosmic simulation / cannonball
  collideMode: false,
  collideFirst: null,
  projectiles: [],
  // multi-star fusion via shift-select
  selectedStars: new Set(),
  pendingFusion: null,
  // Flag: when the user arrives at a freshly-generated star, auto-play its narration.
  autoNarrateOnArrival: false,
  // guide
  guideKey: localStorage.getItem("motu.guideKey") || "",
  guideHistory: (() => {
    try { return (JSON.parse(localStorage.getItem("motu.guideHistory") || "[]") || []).slice(-20); }
    catch { return []; }
  })(),
};

window.__motu = state; // debug handle

/* ============================================================
   Boot
   ============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  // Build the chakra petal decorations so they're ready when the user clicks begin.
  buildChakraPetals();

  // The boot animation, audio, and camera rush are all gated behind the
  // user's first click. This guarantees the AudioContext can unlock so the
  // 8-note scale plays in sync with the chakra animation.
  setupBootBegin();

  try {
    setBootStatus("ready — tap begin to enter");
    loadPersistedEntities();
    initScene();
    buildStarfield();
    buildTopicNodes();
    buildEdges();
    buildPlanet();
    attachUI();
    initTTS();
    setupSettingsPanel();
    bindTTSButtons();
    startLoop();
    document.getElementById("topicCount").textContent = TOPICS.length;
    document.getElementById("docCount").textContent = TOPICS.reduce((a, t) => a + t.documents.length, 0);
  } catch (err) {
    console.error("[init] failed", err);
    setBootStatus("init failed — see browser console");
  }
});

function setupBootBegin() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  // Ensure the paused state is set (in case the HTML was served cached without it)
  boot.classList.add("before-begin");
  // The overlay is in the static HTML — find it (or create a fallback if absent)
  let overlay = document.getElementById("bootBeginOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "boot-begin-overlay";
    overlay.id = "bootBeginOverlay";
    overlay.innerHTML = `<div class="boot-begin-prompt">click anywhere to begin</div><span class="boot-begin-hint">enters with sound</span>`;
    boot.appendChild(overlay);
  }

  let begun = false;
  const beginBoot = () => {
    if (begun) return;
    begun = true;

    // Unlock the audio context — this is the user gesture browsers require.
    const ctx = getAudioContext();
    if (ctx && ctx.state !== "running") {
      try { ctx.resume(); } catch (_) {}
    }

    overlay.remove();
    boot.classList.remove("before-begin");

    playBootChakraTones();
    scheduleBootDismiss();
    startBootCameraRush();

    if (!state.guideKey && !localStorage.getItem("motu.firstRunHinted")) {
      setTimeout(() => {
        if (state.mode === "galaxy") {
          toast(`${TOPICS.length} topics ready — click any star to explore · paste a Claude key in The Librarian to grow the library`);
          localStorage.setItem("motu.firstRunHinted", "1");
        }
      }, 10500);
    }

    window.removeEventListener("keydown", keyBegin);
  };
  const keyBegin = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      beginBoot();
    }
  };
  // Click anywhere on the full-screen overlay → begin
  overlay.addEventListener("click", beginBoot);
  window.addEventListener("keydown", keyBegin);
}

function scheduleBootDismiss() {
  const bootStarted = performance.now();
  // Open the third-eye mask at 5s; fade boot at 7.5s; remove at 9s.
  setTimeout(() => {
    const b = document.getElementById("boot");
    if (b) b.classList.add("opening");
  }, 5000);
  setTimeout(() => {
    const b = document.getElementById("boot");
    if (b) b.classList.add("fade");
  }, 7500);
  setTimeout(() => {
    const b = document.getElementById("boot");
    if (b) b.remove();
  }, 9000);

  // Skip-on-gesture: any click or key after a 600ms grace period dismisses early.
  const skipBoot = () => {
    if (performance.now() - bootStarted < 600) return;     // honor the first moment
    const b = document.getElementById("boot");
    if (!b) return;
    b.classList.add("opening");
    b.classList.add("fade");
    setTimeout(() => { const x = document.getElementById("boot"); if (x) x.remove(); }, 700);
    window.removeEventListener("keydown", skipBoot);
    window.removeEventListener("pointerdown", skipBoot);
  };
  window.addEventListener("pointerdown", skipBoot);
  window.addEventListener("keydown", skipBoot);
  // ascending chakra tones, scheduled at the same instants the chakras flare
  setTimeout(() => playBootChakraTones(), 80);
  // try to resume audio context on first user gesture (in case autoplay was blocked)
  const resumeOnGesture = () => {
    if (_audioCtx && _audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
    window.removeEventListener("pointerdown", resumeOnGesture);
    window.removeEventListener("keydown", resumeOnGesture);
  };
  window.addEventListener("pointerdown", resumeOnGesture, { once: true });
  window.addEventListener("keydown", resumeOnGesture, { once: true });
}

/* Populate each chakra's petal decoration from data-attributes on the SVG.
   Generated at boot init so the petals are present when chakras flare. */
function buildChakraPetals() {
  const groups = document.querySelectorAll(".boot-chakra-svg .petals");
  if (!groups.length) return;
  const svgNS = "http://www.w3.org/2000/svg";
  for (const g of groups) {
    const n = parseInt(g.dataset.petals || "0", 10);
    const r = parseFloat(g.dataset.radius || "16");
    const cy = parseFloat(g.dataset.cy || "0");
    const color = g.dataset.color || "#a78bfa";
    // wing-style for third eye: only two petals horizontally as wings
    const isWings = g.classList.contains("petals-wings");
    if (isWings) {
      const left = document.createElementNS(svgNS, "ellipse");
      left.setAttribute("cx", String(100 - r));
      left.setAttribute("cy", String(cy));
      left.setAttribute("rx", "12"); left.setAttribute("ry", "5");
      left.setAttribute("fill", color);
      left.setAttribute("opacity", "0.55");
      g.appendChild(left);
      const right = document.createElementNS(svgNS, "ellipse");
      right.setAttribute("cx", String(100 + r));
      right.setAttribute("cy", String(cy));
      right.setAttribute("rx", "12"); right.setAttribute("ry", "5");
      right.setAttribute("fill", color);
      right.setAttribute("opacity", "0.55");
      g.appendChild(right);
      continue;
    }
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2;
      const x = 100 + r * Math.sin(theta);
      const y = cy - r * Math.cos(theta);
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      dot.setAttribute("r", "2.4");
      dot.setAttribute("fill", color);
      dot.setAttribute("opacity", "0.75");
      g.appendChild(dot);
    }
  }
}

let _audioCtx = null;
function getAudioContext() {
  if (_audioCtx) return _audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
    return _audioCtx;
  } catch (e) { return null; }
}

/* Eight crystal-bell tones — a FULL C major scale, C5 → C6.
   Each chakra rings its own note (root C, sacral D, solar E, heart F,
   throat G, third-eye A, crown B) and an 8th tone resolves on the
   octave C6 as the cadence. Each tone has a primary sine + a chorus-
   detuned partner + an octave sparkle harmonic through a low-pass.
   Long exponential decay so they overlap into a building chord. */
const CHAKRA_TONES = [
  { freq: 523.25,  when: 0.20 },  // C5  — root
  { freq: 587.33,  when: 0.60 },  // D5  — sacral
  { freq: 659.25,  when: 1.00 },  // E5  — solar plexus
  { freq: 698.46,  when: 1.40 },  // F5  — heart
  { freq: 783.99,  when: 1.80 },  // G5  — throat
  { freq: 880.00,  when: 2.20 },  // A5  — third eye
  { freq: 987.77,  when: 2.55 },  // B5  — crown (leading tone)
  { freq: 1046.50, when: 2.90 },  // C6  — octave resolution
];

function playBootChakraTones() {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Try to nudge the context to running synchronously. Browsers that allow
  // it (recent gesture / no policy) will succeed; others stay suspended.
  if (ctx.state !== "running") {
    try { ctx.resume(); } catch (_) {}
  }
  // Deliberately do NOT bind a deferred gesture listener — late tones played
  // on the user's first star click would feel disconnected from the chakra
  // animation. If the context isn't running right now, accept silence; the
  // tones belong to the intro or nowhere.
  if (ctx.state !== "running") return;
  for (const t of CHAKRA_TONES) playGlassBell(ctx, t.freq, t.when);
}

function playGlassBell(ctx, freq, when) {
  const t0 = ctx.currentTime + when;
  // primary sine
  const o1 = ctx.createOscillator();
  o1.type = "sine";
  o1.frequency.setValueAtTime(freq, t0);
  // slight chorus-like detune for "water glass" body
  const o1b = ctx.createOscillator();
  o1b.type = "sine";
  o1b.frequency.setValueAtTime(freq * 1.003, t0);
  // octave harmonic for crystalline sparkle
  const o2 = ctx.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(freq * 2.001, t0);
  // gentle low-pass for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(4200, t0);
  // envelopes
  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0, t0);
  g1.gain.linearRampToValueAtTime(0.28, t0 + 0.05);
  g1.gain.exponentialRampToValueAtTime(0.0005, t0 + 4.5);
  const g1b = ctx.createGain();
  g1b.gain.setValueAtTime(0, t0);
  g1b.gain.linearRampToValueAtTime(0.10, t0 + 0.05);
  g1b.gain.exponentialRampToValueAtTime(0.0005, t0 + 3.5);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, t0);
  g2.gain.linearRampToValueAtTime(0.07, t0 + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.0005, t0 + 2.8);
  // overall master so all tones don't compound too loud
  const master = ctx.createGain();
  master.gain.value = 0.55;
  o1.connect(g1); o1b.connect(g1b); o2.connect(g2);
  g1.connect(filter); g1b.connect(filter); g2.connect(filter);
  filter.connect(master).connect(ctx.destination);
  o1.start(t0); o1.stop(t0 + 4.7);
  o1b.start(t0); o1b.stop(t0 + 3.7);
  o2.start(t0); o2.stop(t0 + 3.0);
}

/**
 * Three.js camera "rush" from deep space to the normal galaxy view.
 * Coincides with the third-eye portal opening so the user feels as if
 * they fly through the eye and into the galaxy.
 */
function startBootCameraRush() {
  if (!state.camera) return;
  state.camera.position.set(0, 6, 300);    // start FAR
  const targetZ = 36;
  const startTime = performance.now();
  const duration = 7000;
  function tick() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
    state.camera.position.z = 300 - (300 - targetZ) * eased;
    if (t < 1) requestAnimationFrame(tick);
  }
  tick();
  // delay idle-rotation onset so the rush is uninterrupted
  state.lastInteract = performance.now() + duration;
}

function setBootStatus(s) {
  const el = document.getElementById("bootStatus");
  if (el) el.textContent = s;
}

/* ============================================================
   Scene init
   ============================================================ */
function initScene() {
  const stage = document.getElementById("stage");
  state.scene = new THREE.Scene();
  state.scene.fog = new THREE.FogExp2(0x03030a, 0.012);

  state.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
  state.camera.position.set(0, 6, 36);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setClearColor(0x03030a, 1);
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.1;
  stage.appendChild(state.renderer.domElement);

  // post: subtle bloom for that glowing-star feel
  state.composer = new EffectComposer(state.renderer);
  state.composer.addPass(new RenderPass(state.scene, state.camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.14,  // strength — quiet glow, no wash-out
    0.45,  // radius — tighter falloff
    0.48   // threshold — only the brightest cores bloom at all
  );
  state.composer.addPass(bloom);

  // controls
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.06;
  state.controls.rotateSpeed = 0.45;
  state.controls.zoomSpeed = 0.7;
  state.controls.panSpeed = 0.4;
  state.controls.minDistance = 6;
  state.controls.maxDistance = 80;
  state.controls.autoRotate = false;       // toggled in the loop when idle in galaxy
  state.controls.autoRotateSpeed = 0.42;   // a slow showcase orbit
  state.controls.addEventListener("start", () => {
    state.lastInteract = performance.now();
    state.controls.autoRotate = false;
  });
  state.controls.addEventListener("change", () => { state.lastInteract = performance.now(); });

  // ambient
  state.scene.add(new THREE.AmbientLight(0x404466, 0.6));
  const key = new THREE.DirectionalLight(0xaabaff, 0.4);
  key.position.set(20, 30, 20);
  state.scene.add(key);

  window.addEventListener("resize", onResize);
  state.renderer.domElement.addEventListener("pointermove", onPointerMove);
  state.renderer.domElement.addEventListener("click", (e) => onPointerClick(e));
  state.renderer.domElement.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      onPointerMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  }, { passive: true });
  state.renderer.domElement.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      onPointerMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  }, { passive: true });
}

function onResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.composer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(e) {
  state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  state.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  state.pointerScreen = { x: e.clientX, y: e.clientY };
}

function onPointerClick(e) {
  if (state.mode === "galaxy") {
    // SHIFT+CLICK → toggle multi-star selection (or clear if not on a star)
    if (e && e.shiftKey) {
      if (state.hovered) {
        toggleStarSelection(state.hovered);
      } else {
        clearStarSelection();
      }
      return;
    }
    if (state.collideMode) {
      handleCollideClick();
      return;
    }
    if (state.hovered) {
      clearStarSelection();
      enterPlanet(state.hovered);
    } else if (state.selectedStars.size > 0 && !state.hovered) {
      // clicking empty space when there's a selection: clear it
      clearStarSelection();
    }
  } else if (state.mode === "planet" || state.mode === "moon") {
    if (state.hoveredMoon) {
      // Ignore clicking the moon you're already viewing.
      if (state.mode === "moon" && state.hoveredMoon === state.currentMoon?.id) return;
      const rec = state.moonMeshes.find(m => m.id === state.hoveredMoon);
      if (rec) enterMoon(rec);
      return;
    }
    // No moon under cursor — in planet mode, clicking the planet itself
    // descends to the surface; in moon mode this is a no-op.
    if (state.mode !== "planet") return;
    state.raycaster.setFromCamera(state.pointer, state.camera);
    if (state.planetMesh && state.planetGroup.visible) {
      const hits = state.raycaster.intersectObject(state.planetMesh, false);
      if (hits.length > 0) {
        openSurfaceConfirmation();
      }
    }
  }
}

function toggleStarSelection(topicId) {
  const node = state.topicMeshes.get(topicId);
  if (!node) return;
  if (state.selectedStars.has(topicId)) {
    state.selectedStars.delete(topicId);
    node.userData.selected = false;
  } else {
    state.selectedStars.add(topicId);
    node.userData.selected = true;
  }
  updateSelectionHud();
}

function clearStarSelection() {
  for (const id of state.selectedStars) {
    const node = state.topicMeshes.get(id);
    if (node) node.userData.selected = false;
  }
  state.selectedStars.clear();
  updateSelectionHud();
}

function updateSelectionHud() {
  const hud = document.getElementById("selectionHud");
  const n = state.selectedStars.size;
  if (n < 2) {
    hud.hidden = true;
    return;
  }
  hud.hidden = false;
  document.getElementById("selectionCount").textContent = `${n} ideas selected`;
}

function handleCollideClick() {
  if (!state.hovered) return;
  if (!state.collideFirst) {
    state.collideFirst = state.hovered;
    const node = state.topicMeshes.get(state.hovered);
    if (node) node.userData.corona?.scale.set(node.userData.size * 16, node.userData.size * 16, 1);
    showCollideBanner(`now aim at a second idea — colliding with “${topicById(state.hovered).name}”`);
    return;
  }
  if (state.hovered === state.collideFirst) {
    toast("pick a different idea");
    return;
  }
  const a = state.collideFirst, b = state.hovered;
  exitCollideMode();
  fireCollision(a, b);
}

/* ============================================================
   Starfield
   ============================================================ */
function buildStarfield() {
  setBootStatus("scattering 6,000 distant suns…");
  const N = 6000;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const sizes = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    // distribute on a large shell with depth variation
    const r = 220 + Math.random() * 380;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[3*i] = r * Math.sin(phi) * Math.cos(theta);
    positions[3*i+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6; // flatter
    positions[3*i+2] = r * Math.cos(phi);

    // color: mostly white, some warm/cool tinted
    const t = Math.random();
    if (t > 0.92) { colors[3*i] = 0.7; colors[3*i+1] = 0.85; colors[3*i+2] = 1.0; }
    else if (t > 0.85) { colors[3*i] = 1.0; colors[3*i+1] = 0.85; colors[3*i+2] = 0.7; }
    else if (t > 0.80) { colors[3*i] = 0.9; colors[3*i+1] = 0.7; colors[3*i+2] = 1.0; }
    else { colors[3*i] = 0.95; colors[3*i+1] = 0.95; colors[3*i+2] = 1.0; }

    sizes[i] = 0.6 + Math.random() * Math.random() * 5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // mild twinkle
        float tw = 0.85 + 0.15 * sin(uTime * 2.0 + position.x * 0.13 + position.y * 0.09);
        gl_PointSize = aSize * tw * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.1, r);
        gl_FragColor = vec4(vColor, a);
      }`,
    vertexColors: true,
  });

  state.starfield = new THREE.Points(geo, mat);
  state.scene.add(state.starfield);

  // distant nebula clouds for cosmic depth
  buildNebulae();

  // a faint galactic disk haze
  const hazeGeo = new THREE.RingGeometry(40, 200, 64);
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0x4d3b8a,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Mesh(hazeGeo, hazeMat);
  haze.rotation.x = Math.PI / 2;
  state.scene.add(haze);
}

/* ============================================================
   Topic nodes
   ============================================================ */
/* Build a single topic node — used both at boot and for AI-generated stars. */
function makeTopicNode(topic) {
  const colorObj = new THREE.Color(topic.color);
  const size = topic.size || 1.0;

  // invisible hit-target — wider click box so the corona is clickable
  const hitGeo = new THREE.SphereGeometry(3.0 * size, 14, 14);
  const hitMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.renderOrder = -1;

  // soft outer corona (slowly breathing)
  const coronaMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(colorObj),
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const corona = new THREE.Sprite(coronaMat);
  corona.scale.set(10 * size, 10 * size, 1);

  // tighter halo for definition
  const haloMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(colorObj),
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(5.5 * size, 5.5 * size, 1);

  // core sphere
  const coreGeo = new THREE.SphereGeometry(0.6 * size, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({ color: colorObj });
  const core = new THREE.Mesh(coreGeo, coreMat);

  // pulse ring
  const ringGeo = new THREE.RingGeometry(1.0 * size, 1.05 * size, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorObj, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);

  const node = new THREE.Group();
  node.add(hit, corona, halo, core, ring);
  node.position.set(...topic.position);
  node.userData = { topicId: topic.id, core, halo, ring, corona, hit, baseColor: colorObj.clone(), size };
  return node;
}

function buildTopicNodes() {
  setBootStatus("placing the topic-stars…");
  const group = new THREE.Group();
  state.starLabels = new Map();
  state.hitTargets = [];

  for (const topic of TOPICS) {
    const node = makeTopicNode(topic);
    group.add(node);
    state.topicMeshes.set(topic.id, node);
    state.hitTargets.push(node.userData.hit);
    addStarLabel(topic);
  }

  state.scene.add(group);
  state.topicGroup = group;
}

function addStarLabel(topic) {
  const host = document.getElementById("starLabels");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "star-label";
  el.dataset.topicId = topic.id;
  el.innerHTML = `<span class="star-label-dot" style="background:${topic.color};color:${topic.color}"></span>${escapeHtml(topic.name)}`;
  host.appendChild(el);
  state.starLabels.set(topic.id, el);
}

function removeStarLabel(topicId) {
  const el = state.starLabels?.get(topicId);
  if (el) { el.remove(); state.starLabels.delete(topicId); }
}

function buildNebulae() {
  const colors = [
    new THREE.Color("#5b3aff"),
    new THREE.Color("#a04bff"),
    new THREE.Color("#3a6dff"),
    new THREE.Color("#ff6da3"),
    new THREE.Color("#ffb04a"),
  ];
  for (let i = 0; i < 9; i++) {
    const c = colors[i % colors.length];
    const tex = makeNebulaTexture(c);
    const mat = new THREE.SpriteMaterial({
      map: tex, color: 0xffffff, transparent: true, opacity: 0.20,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const r = 180 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.6,
      r * Math.cos(phi),
    );
    const s = 120 + Math.random() * 160;
    sprite.scale.set(s, s, 1);
    state.scene.add(sprite);
  }
}

function makeNebulaTexture(color) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  // base radial fade
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  const hex = "#" + color.getHexString();
  g.addColorStop(0.0, hexWithAlpha(hex, 0.55));
  g.addColorStop(0.4, hexWithAlpha(hex, 0.30));
  g.addColorStop(0.7, hexWithAlpha(hex, 0.10));
  g.addColorStop(1.0, hexWithAlpha(hex, 0.0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // wispy noise: scatter low-alpha blobs
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 20 + Math.random() * 80;
    const lg = ctx.createRadialGradient(x, y, 0, x, y, r);
    lg.addColorStop(0, hexWithAlpha(hex, 0.16));
    lg.addColorStop(1, hexWithAlpha(hex, 0.0));
    ctx.fillStyle = lg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeGlowTexture(color) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  const hex = "#" + color.getHexString();
  g.addColorStop(0.0, hexWithAlpha(hex, 1.0));
  g.addColorStop(0.2, hexWithAlpha(hex, 0.7));
  g.addColorStop(0.5, hexWithAlpha(hex, 0.2));
  g.addColorStop(1.0, hexWithAlpha(hex, 0.0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
function hexWithAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ============================================================
   Edges
   ============================================================ */
function buildEdges() {
  setBootStatus("threading the constellations…");
  const positions = [];
  const colors = [];

  for (const [a, b] of EDGES) {
    const ta = topicById(a), tb = topicById(b);
    if (!ta || !tb) continue;
    const ca = new THREE.Color(ta.color), cb = new THREE.Color(tb.color);

    // Sample along bezier for soft curve
    const start = new THREE.Vector3(...ta.position);
    const end = new THREE.Vector3(...tb.position);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    // gentle bow toward origin
    mid.lerp(new THREE.Vector3(0, 0, 0), 0.18);

    const SEG = 40;
    for (let i = 0; i < SEG; i++) {
      const t1 = i / SEG, t2 = (i + 1) / SEG;
      const p1 = bezier(start, mid, end, t1);
      const p2 = bezier(start, mid, end, t2);
      positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      const c1 = ca.clone().lerp(cb, t1);
      const c2 = ca.clone().lerp(cb, t2);
      colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  state.edgeLines = new THREE.LineSegments(geo, mat);
  state.scene.add(state.edgeLines);
}

function bezier(a, b, c, t) {
  const u = 1 - t;
  return new THREE.Vector3(
    u*u*a.x + 2*u*t*b.x + t*t*c.x,
    u*u*a.y + 2*u*t*b.y + t*t*c.y,
    u*u*a.z + 2*u*t*b.z + t*t*c.z,
  );
}

/* ============================================================
   Planet (procedural shader)
   ============================================================ */
const planetVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const planetFragment = `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;
  uniform int uTheme;
  uniform float uHue;
  uniform float uAccent;
  uniform float uParamA;

  // hash & noise
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Baseline drifting cloud layer — every planet has some weather.
  // Returns a soft additive tint based on a wide noise field that drifts.
  float clouds_field(vec3 p, float scale, float speed) {
    return pow(fbm(p * scale + vec3(0.0, uTime * speed, 0.0)), 1.4);
  }

  // ─── theme colorers (each with distinguishing weather) ───────────
  vec3 theme_grid(vec3 p) {
    // SIMULATION THEORY — wireframe cubes + data cascades
    vec3 q = p * 4.0;
    vec3 g = abs(fract(q + uTime * 0.02) - 0.5);
    float line = step(0.46, max(max(g.x, g.y), g.z));
    float glitch = step(0.97, hash(floor(q) + floor(uTime * 6.0)));
    vec3 base = hsv2rgb(vec3(uHue, 0.4, 0.06));
    vec3 grid = hsv2rgb(vec3(uHue, 0.6, 0.9));
    vec3 hot  = hsv2rgb(vec3(uAccent, 0.8, 1.2));
    vec3 col = base + line * grid * (0.5 + 0.5 * fbm(q*0.3)) + glitch * hot * 0.6;
    // weather: vertical data cascades (rain of bright bits)
    float cascade = step(0.94, hash(floor(q * vec3(6.0, 3.0, 6.0) + vec3(0.0, uTime * 5.0, 0.0))));
    col += vec3(0.3, 0.95, 1.0) * cascade * 0.7;
    return col;
  }
  vec3 theme_plasma(vec3 p) {
    // PLASMA DYNAMICS — turbulent flares + solar arcs
    vec3 q = p * 2.3;
    float n = fbm(q + vec3(0.0, uTime * 0.18, 0.0));
    float flare = pow(fbm(q*2.2 + vec3(uTime*0.5)), 3.0);
    vec3 cool = hsv2rgb(vec3(0.04, 0.85, 0.5));
    vec3 hot  = hsv2rgb(vec3(0.12, 0.9, 1.4));
    vec3 white = vec3(1.0, 0.95, 0.85);
    vec3 col = mix(cool, hot, n);
    col += white * flare * 0.6;
    // weather: prominence arcs sweeping the surface
    float arc = pow(max(0.0, sin(p.y * 14.0 + uTime * 0.7) * sin(atan(p.z, p.x) * 6.0)), 8.0);
    col += vec3(1.0, 0.55, 0.18) * arc * 0.6;
    return col;
  }
  vec3 theme_mandala(vec3 p) {
    // WORLD RELIGIONS — radial sacred geometry + ritual pulse rings
    float theta = atan(p.z, p.x);
    float phi = acos(p.y / max(length(p), 0.001));
    float r1 = cos(theta * 6.0 + uTime * 0.15) * 0.5 + 0.5;
    float r2 = cos(phi * 8.0) * 0.5 + 0.5;
    float r3 = cos(theta * 12.0 + phi * 4.0) * 0.5 + 0.5;
    float patt = pow(r1 * r2 * r3, 1.5);
    vec3 deep  = hsv2rgb(vec3(0.74, 0.7, 0.15));
    vec3 gold  = hsv2rgb(vec3(uHue, 0.85, 1.1));
    vec3 ivory = hsv2rgb(vec3(0.12, 0.25, 1.2));
    vec3 col = mix(deep, gold, patt) + ivory * pow(patt, 6.0) * 0.4;
    // weather: concentric pulse rings emanating from poles
    float r = length(p.xz);
    float pulse = sin(r * 9.0 - uTime * 1.4);
    col += ivory * pow(max(0.0, pulse), 6.0) * 0.45;
    return col;
  }
  vec3 theme_flow(vec3 p) {
    // ECONOMICS — particle streams + cross-current eddies
    vec3 q = p * 3.0;
    float streamA = sin(q.x * 5.0 + q.y * 3.0 + uTime * 0.6);
    float streamB = sin(q.z * 4.0 - q.y * 5.0 + uTime * 0.5);
    float lines = smoothstep(0.94, 1.0, max(streamA, streamB));
    float pulse = fbm(q + uTime * 0.2);
    vec3 base = hsv2rgb(vec3(uHue, 0.6, 0.1 + 0.3 * pulse));
    vec3 stream = hsv2rgb(vec3(uAccent, 0.7, 1.4));
    vec3 col = base + stream * lines;
    // weather: occasional storm eddy — bright vortex spot
    vec3 eddyCenter = vec3(cos(uTime * 0.18) * 0.7, sin(uTime * 0.21) * 0.4, sin(uTime * 0.18) * 0.7);
    float eddyD = distance(p, eddyCenter);
    float eddy = smoothstep(0.30, 0.05, eddyD);
    col += hsv2rgb(vec3(uAccent + 0.1, 0.8, 1.2)) * eddy * 0.55;
    return col;
  }
  vec3 theme_crystal(vec3 p) {
    // ESOTERICA — faceted with sigil glow + sparkle weather
    vec3 q = p * 2.4;
    vec3 fl = floor(q + 0.5);
    float facet = vnoise(fl);
    float edges = 1.0 - smoothstep(0.0, 0.05, abs(fract(q.x) - 0.5) + abs(fract(q.y) - 0.5) + abs(fract(q.z) - 0.5) - 0.4);
    float sigil = pow(0.5 + 0.5 * sin(fbm(p*1.2)*15.0 + uTime*0.3), 6.0);
    vec3 deep = hsv2rgb(vec3(uHue, 0.7, 0.08 + 0.18 * facet));
    vec3 silver = vec3(0.85, 0.82, 1.0);
    vec3 violet = hsv2rgb(vec3(uHue, 0.9, 1.3));
    vec3 col = deep + silver * edges * 0.4 + violet * sigil * 0.7;
    // weather: sparkle flickers (random bright points)
    float spark = pow(hash(floor(p * 7.0 + uTime * 2.5)), 9.0);
    col += silver * spark * 2.4;
    return col;
  }
  vec3 theme_gas(vec3 p) {
    // ASTROPHYSICS — banded gas giant + persistent storm spot
    float band = sin(p.y * uParamA + fbm(p * 1.8 + uTime * 0.05) * 1.5);
    float fine = fbm(p * 6.0 + uTime * 0.1) * 0.3;
    vec3 deep = hsv2rgb(vec3(uHue, 0.6, 0.25));
    vec3 light = hsv2rgb(vec3(uHue + 0.05, 0.3, 1.0));
    vec3 storm = hsv2rgb(vec3(uAccent, 0.7, 0.9));
    float storms = smoothstep(0.7, 0.95, fbm(p*3.0 - uTime*0.07));
    vec3 col = mix(deep, light, smoothstep(-0.4, 0.4, band) + fine) + storm * storms * 0.4;
    // weather: a Great Red Spot style oval that drifts in longitude
    vec3 spotC = vec3(cos(uTime * 0.06) * 0.85, -0.35, sin(uTime * 0.06) * 0.85);
    float spotD = distance(p, spotC);
    float spot = smoothstep(0.32, 0.08, spotD);
    col += hsv2rgb(vec3(uAccent - 0.05, 0.85, 1.0)) * spot * 0.55;
    return col;
  }
  vec3 theme_cmb(vec3 p) {
    // COSMOLOGY — cosmic web + slow expansion pulses
    float web = fbm(p * 4.0);
    float net = pow(fbm(p * 8.0 + 7.3), 2.5);
    float voids = smoothstep(0.3, 0.5, web);
    vec3 cold = hsv2rgb(vec3(0.63, 0.7, 0.04));
    vec3 warm = hsv2rgb(vec3(0.03, 0.7, 0.45));
    vec3 nodes = hsv2rgb(vec3(uHue, 0.6, 1.1));
    vec3 col = mix(cold, warm, voids) + nodes * net * 0.5;
    // weather: web-pulse that breathes with cosmic expansion
    float breath = 0.5 + 0.5 * sin(uTime * 0.35);
    col += nodes * pow(net, 0.6) * breath * 0.35;
    return col;
  }
  vec3 theme_circuit(vec3 p) {
    // COMPUTATION — circuit-board + traveling data signals
    vec3 q = p * 5.0;
    float gridX = step(0.45, abs(fract(q.x) - 0.5));
    float gridY = step(0.45, abs(fract(q.y) - 0.5));
    float gridZ = step(0.45, abs(fract(q.z) - 0.5));
    float lines = max(gridX * gridY, gridY * gridZ);
    float pulse = step(0.97, hash(floor(q) + floor(uTime * 4.0)));
    vec3 base  = hsv2rgb(vec3(0.55, 0.7, 0.05));
    vec3 trace = hsv2rgb(vec3(uHue, 0.7, 0.9));
    vec3 spark = hsv2rgb(vec3(uAccent, 0.5, 1.5));
    vec3 col = base + trace * lines * 0.6 + spark * pulse * 0.8;
    // weather: traveling data signal — a brighter pulse moving along grid lines
    float wave = step(0.92, fract(q.x * 0.3 - uTime * 0.7) * lines);
    col += spark * wave * 1.1;
    return col;
  }

  void main() {
    vec3 p = normalize(vPos);
    vec3 col;
    if      (uTheme == 0) col = theme_grid(p);
    else if (uTheme == 1) col = theme_plasma(p);
    else if (uTheme == 2) col = theme_mandala(p);
    else if (uTheme == 3) col = theme_flow(p);
    else if (uTheme == 4) col = theme_crystal(p);
    else if (uTheme == 5) col = theme_gas(p);
    else if (uTheme == 6) col = theme_cmb(p);
    else                  col = theme_circuit(p);

    // rim light
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0,0,1)), 0.0), 2.0);
    col += rim * 0.35;

    // subtle terminator shading
    float lambert = clamp(dot(normalize(vNormal), normalize(vec3(0.6, 0.4, 1.0))), 0.0, 1.0);
    col *= 0.5 + 0.5 * lambert;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const THEME_INDEX = { grid: 0, plasma: 1, mandala: 2, flow: 3, crystal: 4, gas: 5, cmb: 6, circuit: 7 };

function buildPlanet() {
  setBootStatus("preparing planetary substrate…");
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(4.2, 96, 96);
  const mat = new THREE.ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
    uniforms: {
      uTime: { value: 0 },
      uTheme: { value: 0 },
      uHue: { value: 0.7 },
      uAccent: { value: 0.95 },
      uParamA: { value: 6.0 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);

  // atmospheric halo
  const haloGeo = new THREE.SphereGeometry(4.6, 64, 64);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(0xa78bfa) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uColor;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0,0,1)), 2.0);
        gl_FragColor = vec4(uColor, 1.0) * intensity;
      }`,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);

  group.add(mesh, halo);
  group.position.set(0, 0, 0);
  group.visible = false;
  state.scene.add(group);
  state.planetMesh = mesh;
  state.planetGroup = group;
  state.planetHalo = halo;
}

function setPlanetTheme(topic) {
  const u = state.planetMesh.material.uniforms;
  const t = topic.planetTheme;
  u.uTheme.value = THEME_INDEX[t.type] ?? 0;
  u.uHue.value = t.params.hue ?? 0.7;
  u.uAccent.value = t.params.accent ?? 0.95;
  // theme-specific param
  u.uParamA.value = t.params.bands ?? t.params.complexity ?? t.params.density ?? t.params.facets ?? t.params.turbulence ?? t.params.glitch ?? t.params.structure ?? 6.0;
  state.planetHalo.material.uniforms.uColor.value.set(topic.color);
}

/* ============================================================
   Surface mode — immersive procedural world per topic
   ------------------------------------------------------------
   Click the planet → confirmation → camera flythrough → enter
   a giant inverted sphere using the topic's existing shader, so
   the user is "inside" the world the planet represents. Theme-
   colored particle atmosphere. Topic info overlay. Free-look
   rotation. Return button.
   PHASE 2 hook: replace the procedural inverted-sphere with a
   panorama from a world-model API (Replicate / Decart / etc.)
   when the user wires one up in Settings.
   ============================================================ */

function openSurfaceConfirmation() {
  const entry = currentEntry();
  if (!entry) return;
  document.getElementById("surfaceConfirmName").textContent = entry.name;
  document.getElementById("modal-surface-confirm").hidden = false;
}

function setupSurfaceMode() {
  document.getElementById("surfaceAccept").addEventListener("click", () => {
    document.getElementById("modal-surface-confirm").hidden = true;
    enterSurface();
  });
  document.getElementById("surfaceDecline").addEventListener("click", () => {
    document.getElementById("modal-surface-confirm").hidden = true;
  });
  document.getElementById("btn-surface-return").addEventListener("click", exitSurface);
}

function enterSurface() {
  const entry = currentEntry();
  if (!entry) return;
  stopSpeech();   // halt the orbit-view narration

  // remember camera pose so we can restore it on return
  state.savedCamSurface = {
    pos: state.camera.position.clone(),
    target: state.controls.target.clone(),
  };

  // Build the surface scene (or refresh it for this topic)
  buildSurfaceScene(entry);

  // Hide planet HUD / moons; show surface HUD
  document.getElementById("hud-planet").hidden = true;
  document.getElementById("hud-surface").hidden = false;
  populateSurfaceOverlay(entry);
  state.topicGroup.visible = false;
  state.planetGroup.visible = false;
  state.edgeLines.visible = false;
  for (const m of state.moonMeshes) m.group.visible = false;

  // Camera flies into the planet — from current pose to origin (inside surface sphere)
  const target = new THREE.Vector3(0, 0, 0.001);   // tiny offset so OrbitControls doesn't NaN
  state.cameraTargetPos = target;
  state.cameraTargetLook = new THREE.Vector3(2, 0.4, -1).normalize().multiplyScalar(8); // look outward
  state.mode = "transit";
  state.afterTransit = "surface";
  state.controls.minDistance = 0.01;
  state.controls.maxDistance = 30;
}

function exitSurface() {
  stopSpeech();
  // Tear down the surface scene
  disposeSurfaceScene();
  document.getElementById("hud-surface").hidden = true;
  document.getElementById("hud-planet").hidden = false;
  state.planetGroup.visible = true;
  state.topicGroup.visible = false;   // still in planet mode, galaxy stays hidden
  for (const m of state.moonMeshes) m.group.visible = true;

  // Restore camera to orbit-of-planet pose
  const dir = new THREE.Vector3(1, 0.3, 1.6).normalize();
  state.cameraTargetPos = dir.multiplyScalar(12.1);
  state.cameraTargetLook = new THREE.Vector3(0, 0, 0);
  state.mode = "transit";
  state.afterTransit = "planet";
  state.controls.minDistance = 6;
  state.controls.maxDistance = 22;
}

function onArriveAtSurface() {
  // Free-look mode: camera orbits at a small fixed distance from origin,
  // so dragging rotates the view across the inverted surface dome.
  state.controls.enableZoom = false;
  state.controls.enablePan = false;
  state.controls.minDistance = 0.5;
  state.controls.maxDistance = 0.5;
  state.controls.rotateSpeed = 0.3;
  state.controls.target.set(0, 0, 0);
  state.camera.position.set(0, 0, 0.5);
  state.controls.update();
}

function populateSurfaceOverlay(entry) {
  document.getElementById("surfaceOverlayCluster").textContent =
    "surface · " + (entry.cluster || (entry.parentId ? "moon" : ""));
  document.getElementById("surfaceOverlayTitle").textContent = entry.name;
  document.getElementById("surfaceOverlaySummary").textContent =
    entry.summary || entry.conclusion || "";
}

function buildSurfaceScene(entry) {
  disposeSurfaceScene();
  const group = new THREE.Group();

  // Giant inverted sphere using the topic's planet shader — the inside of the world.
  const theme = entry.planetTheme || { type: "crystal", params: {} };
  const geo = new THREE.SphereGeometry(45, 96, 96);
  const mat = new THREE.ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
    side: THREE.BackSide,
    uniforms: {
      uTime:   { value: 0 },
      uTheme:  { value: THEME_INDEX[theme.type] ?? 0 },
      uHue:    { value: theme.params?.hue ?? 0.7 },
      uAccent: { value: theme.params?.accent ?? 0.95 },
      uParamA: {
        value: theme.params?.bands ?? theme.params?.complexity
            ?? theme.params?.density ?? theme.params?.facets
            ?? theme.params?.turbulence ?? theme.params?.glitch
            ?? theme.params?.structure ?? 6.0,
      },
    },
  });
  const dome = new THREE.Mesh(geo, mat);
  group.add(dome);

  // Atmospheric particle field — drifts gently around the camera.
  const N = 1200;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const baseColor = new THREE.Color(entry.color || "#a78bfa");
  for (let i = 0; i < N; i++) {
    const r = 3 + Math.random() * 25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[3*i]   = r * Math.sin(phi) * Math.cos(theta);
    positions[3*i+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[3*i+2] = r * Math.cos(phi);
    const tint = 0.7 + Math.random() * 0.3;
    colors[3*i]   = baseColor.r * tint;
    colors[3*i+1] = baseColor.g * tint;
    colors[3*i+2] = baseColor.b * tint;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.25, sizeAttenuation: true,
    transparent: true, opacity: 0.7,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  state.surfaceGroup = group;
  state.surfaceMaterial = mat;
  state.surfaceParticles = particles;
  state.scene.add(group);
}

function disposeSurfaceScene() {
  if (!state.surfaceGroup) return;
  state.scene.remove(state.surfaceGroup);
  state.surfaceGroup.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });
  state.surfaceGroup = null;
  state.surfaceMaterial = null;
  state.surfaceParticles = null;
}

/* ============================================================
   Moons (sub-topics) — built when entering a planet
   ============================================================ */
function buildMoons(topic) {
  disposeMoons();
  const moons = subTopicsOf(topic.id);
  for (const sub of moons) {
    const group = new THREE.Group();
    const color = new THREE.Color(sub.color || topic.color);
    const size = sub.size ?? 0.45;

    // moon body — same shader, smaller
    const geo = new THREE.SphereGeometry(size, 48, 48);
    const mat = new THREE.ShaderMaterial({
      vertexShader: planetVertex,
      fragmentShader: planetFragment,
      uniforms: {
        uTime: { value: 0 },
        uTheme: { value: THEME_INDEX[sub.planetTheme?.type] ?? 0 },
        uHue: { value: sub.planetTheme?.params?.hue ?? 0.7 },
        uAccent: { value: sub.planetTheme?.params?.accent ?? 0.95 },
        uParamA: {
          value: sub.planetTheme?.params?.bands ?? sub.planetTheme?.params?.complexity
              ?? sub.planetTheme?.params?.density ?? sub.planetTheme?.params?.facets
              ?? sub.planetTheme?.params?.turbulence ?? sub.planetTheme?.params?.glitch
              ?? sub.planetTheme?.params?.structure ?? 6.0
        },
      },
    });
    const body = new THREE.Mesh(geo, mat);

    // halo
    const haloMat = new THREE.SpriteMaterial({
      map: makeGlowTexture(color),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(size * 4, size * 4, 1);

    // Invisible larger sphere — widens the hover/click hitbox to match the corona.
    const hitGeo = new THREE.SphereGeometry(size * 2.4, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
    });
    const hit = new THREE.Mesh(hitGeo, hitMat);

    group.add(body, halo, hit);

    // orbit trail (faint ring tilted at orbit.tilt)
    const orbit = sub.orbit || { radius: 7, speed: 0.15, phase: 0, tilt: 0 };
    const trailGeo = new THREE.RingGeometry(orbit.radius - 0.01, orbit.radius + 0.01, 128);
    const trailMat = new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.rotation.z = orbit.tilt || 0;
    state.planetGroup.add(trail);

    state.scene.add(group);

    // Hover label — hidden until the moon is hovered (or selected sibling).
    const labelHost = document.getElementById("moonLabels");
    let label = null;
    if (labelHost) {
      label = document.createElement("div");
      label.className = "moon-label";
      const cssColor = "#" + new THREE.Color(color).getHexString();
      label.innerHTML = `<span class="moon-label-dot" style="background:${cssColor};color:${cssColor}"></span>${escapeHtml(sub.name)}`;
      labelHost.appendChild(label);
    }

    state.moonMeshes.push({
      id: sub.id,
      sub,
      group,
      body,
      halo,
      hit,         // wider invisible raycast target
      trail,
      mat,
      orbit,
      paused: false,
      size,
      color,
      label,
    });
  }
}

function disposeMoons() {
  for (const m of state.moonMeshes) {
    state.scene.remove(m.group);
    state.planetGroup.remove(m.trail);
    m.body.geometry.dispose(); m.body.material.dispose();
    m.trail.geometry.dispose(); m.trail.material.dispose();
    m.halo.material.map?.dispose(); m.halo.material.dispose();
    if (m.hit) { try { m.hit.geometry.dispose(); m.hit.material.dispose(); } catch (_) {} }
    if (m.label) { try { m.label.remove(); } catch (_) {} }
  }
  state.moonMeshes.length = 0;
}

function updateMoonPositions(t) {
  for (const m of state.moonMeshes) {
    if (m.paused) continue;
    const a = t * m.orbit.speed + (m.orbit.phase || 0);
    const r = m.orbit.radius;
    const tilt = m.orbit.tilt || 0;
    m.group.position.set(
      r * Math.cos(a),
      Math.sin(a) * r * tilt,
      r * Math.sin(a)
    );
    m.mat.uniforms.uTime.value = t;
    m.body.rotation.y += 0.005;
  }
}

/* ============================================================
   Moon mode — selecting a moon focuses on it
   ============================================================ */
function enterMoon(moonRecord) {
  stopSpeech();   // halt any narration from the previous entry
  const m = moonRecord;
  // Moon keeps orbiting; the camera will follow it (set up below).
  state.currentMoon = m.sub;
  state.mode = "transit";
  state.afterTransit = "moon";

  // Snapshot a static "viewing offset" relative to the moon — recomputed
  // each frame as moonPos + offset so the camera tracks the moving moon
  // without changing direction relative to the orbit.
  const moonPos = new THREE.Vector3();
  m.group.getWorldPosition(moonPos);
  const fromOrigin = moonPos.clone().normalize();
  state.followMoonId = m.id;
  state.followMoonOffset = fromOrigin.multiplyScalar(2.0).add(new THREE.Vector3(0, 0.6, 0));
  state._lastMoonFollowPos = null;     // recaptured on arrival

  state.cameraTargetPos = moonPos.clone().add(state.followMoonOffset);
  state.cameraTargetLook = moonPos.clone();
  state.controls.minDistance = 1.5;
  state.controls.maxDistance = 14;

  // boost moon glow while focused
  m.halo.scale.set(m.size * 6, m.size * 6, 1);

  populateMoonHud(m.sub, state.currentTopic);
  updateBackButton();
  updateGuideContext(`moon — ${m.sub.name}`);
}

function returnToPlanet() {
  stopSpeech();
  // unfocus moon; resume orbits
  for (const m of state.moonMeshes) {
    m.paused = false;
    m.halo.scale.set(m.size * 4, m.size * 4, 1);
  }
  state.followMoonId = null;
  state.followMoonOffset = null;
  state._lastMoonFollowPos = null;
  state.currentMoon = null;

  // re-center on planet
  const dir = new THREE.Vector3(1, 0.3, 1.6).normalize();
  state.cameraTargetPos = dir.multiplyScalar(12.1);  // pull back ~10% so planet fits the view better
  state.cameraTargetLook = new THREE.Vector3(0, 0, 0);
  state.mode = "transit";
  state.afterTransit = "planet";
  state.controls.minDistance = 6;
  state.controls.maxDistance = 22;

  populatePlanetHud(state.currentTopic);
  updateBackButton();
  updateGuideContext(`planet — ${state.currentTopic.name}`);
}

function populateMoonHud(moon, parent) {
  document.getElementById("planetCluster").textContent = `moon of ${parent.name}`;
  document.getElementById("planetTitle").textContent = moon.name;
  document.getElementById("planetSummary").textContent = moon.summary;
  document.getElementById("planetDocCount").textContent = `${moon.documents.length} entries`;
  document.getElementById("planetConnCount").textContent = `parent: ${parent.name}`;

  renderTagButtons(moon.tags || []);
  renderCard(moon);
  resetDeleteButton();
}

/* Return the entry's card data, or derive one from existing fields
   so seed topics still render in card style. */
function cardFor(entry) {
  if (entry.card) return entry.card;
  // derive
  const propositions = [];
  for (const node of entry.conclusionBody || []) {
    if (node.type === "ul") {
      for (const item of node.items) {
        if (item && item.length >= 20 && item.length <= 220) propositions.push(item);
      }
    }
  }
  const facts = [];
  for (const doc of (entry.documents || []).slice(0, 2)) {
    for (const f of (doc.findings || [])) {
      if (f && f.length >= 20 && f.length <= 200) facts.push(f);
    }
  }
  // seeAlso: connections for top-level; sibling moons + parent for moons
  let seeAlso = [];
  if (entry.parentId) {
    const parent = topicById(entry.parentId);
    if (parent) seeAlso.push({ id: parent.id, name: parent.name, why: "parent topic" });
    for (const sib of subTopicsOf(entry.parentId)) {
      if (sib.id !== entry.id) seeAlso.push({ id: sib.id, name: sib.name, why: "sibling" });
    }
  } else {
    for (const c of connectionsOf(entry.id)) {
      seeAlso.push({ id: c.id, name: c.name, why: "connection" });
    }
    for (const sub of subTopicsOf(entry.id)) {
      seeAlso.push({ id: sub.id, name: sub.name, why: "satellite" });
    }
  }
  seeAlso = seeAlso.slice(0, 6);

  return {
    punchline: entry.conclusion || entry.summary || "",
    propositions: propositions.slice(0, 5),
    hypotheses: [],
    facts: facts.slice(0, 3),
    openQuestions: [],   // seed topics don't carry these by default; rebuild adds them
    seeAlso,
  };
}

function renderCard(entry) {
  const card = cardFor(entry);
  const root = document.getElementById("planetCard");
  if (!root) return;

  document.getElementById("cardPunchline").textContent = card.punchline || entry.summary || "";

  const propUl = document.getElementById("cardPropositions");
  propUl.innerHTML = "";
  for (const p of (card.propositions || [])) {
    const li = document.createElement("li");
    li.textContent = p;
    propUl.appendChild(li);
  }

  const hypothesesWrap = document.getElementById("cardHypothesesWrap");
  const hypothesesUl = document.getElementById("cardHypotheses");
  hypothesesUl.innerHTML = "";
  const hypos = card.hypotheses || [];
  if (hypos.length > 0) {
    hypothesesWrap.hidden = false;
    for (const h of hypos) {
      const li = document.createElement("li");
      li.textContent = h;
      hypothesesUl.appendChild(li);
    }
  } else {
    hypothesesWrap.hidden = true;
  }

  const factsWrap = document.getElementById("cardFactsWrap");
  const factsUl = document.getElementById("cardFacts");
  factsUl.innerHTML = "";
  const facts = card.facts || [];
  if (facts.length > 0) {
    factsWrap.hidden = false;
    for (const f of facts) {
      const li = document.createElement("li");
      li.textContent = f;
      factsUl.appendChild(li);
    }
  } else {
    factsWrap.hidden = true;
  }

  // Open Questions — each one a clickable doorway. Click opens The Librarian
  // with the question pre-filled, so the user can immediately explore it.
  const questionsWrap = document.getElementById("cardQuestionsWrap");
  const questionsUl = document.getElementById("cardQuestions");
  questionsUl.innerHTML = "";
  const questions = card.openQuestions || [];
  if (questions.length > 0) {
    questionsWrap.hidden = false;
    for (const q of questions) {
      const li = document.createElement("li");
      li.textContent = q;
      li.title = "click to ask The Librarian";
      li.addEventListener("click", () => askLibrarianAbout(q));
      questionsUl.appendChild(li);
    }
  } else {
    questionsWrap.hidden = true;
  }

  const seeAlsoWrap = document.getElementById("cardSeeAlsoWrap");
  const seeAlsoEl = document.getElementById("cardSeeAlso");
  seeAlsoEl.innerHTML = "";
  const seeAlso = (card.seeAlso || []).filter(s => s && s.id);
  if (seeAlso.length > 0) {
    seeAlsoWrap.hidden = false;
    for (const s of seeAlso) {
      const resolved = resolveById(s.id);
      const targetName = resolved?.entry?.name || s.name;
      const targetColor = resolved?.entry?.color || "#a78bfa";
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "card-seealso-pill";
      pill.innerHTML = `<span class="pill-dot" style="background:${targetColor};color:${targetColor}"></span><span>${escapeHtml(targetName)}</span>${s.why ? `<span class="pill-why">— ${escapeHtml(s.why)}</span>` : ""}`;
      pill.addEventListener("click", () => {
        if (!resolved) return;
        if (resolved.kind === "topic") {
          navigateToHit({ id: resolved.entry.id, kind: "topic", name: resolved.entry.name });
        } else {
          navigateToHit({ id: resolved.entry.id, kind: "moon", name: resolved.entry.name, parentId: resolved.parent.id });
        }
      });
      seeAlsoEl.appendChild(pill);
    }
  } else {
    seeAlsoWrap.hidden = true;
  }

  // Track the currently-rendered entry in a ref so the static listen button
  // always reads the current card, not the first one bound.
  state._cardEntryRef = entry;
  const ttsBtn = root.querySelector("[data-tts-card]");
  if (ttsBtn && !ttsBtn._bound) {
    ttsBtn.addEventListener("click", () => handleTTSButtonClick(ttsBtn, () => cardReadAloud(state._cardEntryRef)));
    ttsBtn._bound = true;
  }
  const stopBtn = root.querySelector("[data-tts-stop]");
  if (stopBtn && !stopBtn._bound) {
    stopBtn.addEventListener("click", () => stopSpeech());
    stopBtn._bound = true;
  }
}

/* Open the Librarian with a question pre-filled in the input and ready to send.
   Used by Open Questions clicks on the card, and could be reused elsewhere. */
function askLibrarianAbout(question) {
  if (!question) return;
  openGuide();
  const input = document.getElementById("guideInput");
  if (input) {
    input.value = question;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function cardReadAloud(entry) {
  const card = cardFor(entry);
  const parts = [];
  parts.push(`${entry.name}.`);
  if (card.punchline) parts.push(card.punchline);
  if (card.propositions?.length) {
    parts.push("Propositions.");
    for (const p of card.propositions) parts.push(p);
  }
  if (card.hypotheses?.length) {
    parts.push("Hypotheses.");
    for (const h of card.hypotheses) parts.push(h);
  }
  if (card.facts?.length) {
    parts.push("Notable.");
    for (const f of card.facts) parts.push(f);
  }
  if (card.seeAlso?.length) {
    parts.push("Adjacent territories: " + card.seeAlso.map(s => s.name).join(", ") + ".");
  }
  return parts.join("\n\n");
}

// Render tags at the bottom of the planet/moon panel as clickable buttons.
// Click → navigate to matching topic/moon, or generate a new entry via Opus.
function renderTagButtons(tagList) {
  const tags = document.getElementById("planetTags");
  tags.innerHTML = "";
  const curId = currentEntry()?.id;
  for (const tag of tagList) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "planet-tag";
    // Tag visually distinguishes "leads to an existing entry" vs "will generate a new one"
    const match = findLocalMatch(tag);
    if (match && match.id !== curId) {
      btn.classList.add("tag-known");
      btn.title = `warp to "${match.name}"`;
    } else {
      btn.classList.add("tag-new");
      btn.title = `generate a new entry for "${tag}"`;
    }
    btn.textContent = tag;
    btn.addEventListener("click", () => handleTagClick(tag));
    tags.appendChild(btn);
  }
}

async function handleTagClick(tagText) {
  const hit = findLocalMatch(tagText);
  const curId = currentEntry()?.id;
  if (hit && hit.id !== curId) {
    navigateToHit(hit);
    return;
  }
  // either no match, or the only match is the entry we're already on — generate a fresh entry
  if (!state.guideKey) {
    toast(`Connect The Librarian to explore "${tagText}"`);
    openGuide();
    return;
  }
  await generateAndAddEntity(tagText);
}

function updateBackButton() {
  const btn = document.getElementById("btn-return-galaxy");
  const label = btn.querySelector("span");
  if (state.mode === "moon" || state.currentMoon) {
    label.textContent = `back to ${state.currentTopic.name}`;
    btn.dataset.action = "to-planet";
  } else {
    label.textContent = "return to galaxy";
    btn.dataset.action = "to-galaxy";
  }
}

/* ============================================================
   Loop
   ============================================================ */
function startLoop() {
  function frame() {
    requestAnimationFrame(frame);
    const dt = state.clock.getDelta();
    const t = state.clock.elapsedTime;

    // starfield twinkle
    state.starfield.material.uniforms.uTime.value = t;

    // Camera orbit + background drift + slow galaxy spin (combined showcase motion).
    if (state.mode === "galaxy") {
      const since = performance.now() - state.lastInteract;
      // The camera orbits the galaxy via OrbitControls.autoRotate, enabled after idle.
      state.controls.autoRotate = since > 1400;
      // Slow rotation of the galaxy itself for extra motion.
      if (state.topicGroup) state.topicGroup.rotation.y += dt * 0.014;
      if (state.edgeLines && state.topicGroup) state.edgeLines.rotation.y = state.topicGroup.rotation.y;
      // The starfield (background) drifts independently for cosmic motion.
      state.starfield.rotation.y += dt * 0.012;
    } else {
      state.controls.autoRotate = false;
    }

    // advance any in-flight idea-cannonballs
    advanceProjectiles(dt, t);

    // node pulsing — corona breath + ring
    for (const [, node] of state.topicMeshes) {
      const phase = t * 0.6 + node.position.x * 0.3;
      const s = 1 + 0.06 * Math.sin(phase);
      node.userData.ring.scale.setScalar(s);
      node.userData.ring.material.opacity = 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(phase));
      // corona breath if present — selected stars get an enlarged + brighter corona
      if (node.userData.corona) {
        const breath = 1 + 0.18 * Math.sin(t * 0.9 + node.position.z * 0.4);
        const isSelected = !!node.userData.selected;
        const baseScale = node.userData.size * (isSelected ? 16 : 10);
        node.userData.corona.scale.set(baseScale * breath, baseScale * breath, 1);
        const op = isSelected ? 0.85 : (0.55 + 0.25 * Math.sin(t * 0.55 + node.position.x));
        node.userData.corona.material.opacity = op;
      }
      // gentle bobbing
      node.position.y += Math.sin(t * 0.4 + node.position.x) * 0.0006;
    }

    // hover
    if (state.mode === "galaxy") doHoverPick();
    else if (state.mode === "planet" || state.mode === "moon") doHoverPickMoons();

    // planet rotation & shader time
    if (state.planetGroup.visible) {
      state.planetGroup.rotation.y += dt * 0.08;
      state.planetMesh.material.uniforms.uTime.value = t;
      updateMoonPositions(t);
      // Follow the focused moon: update transit targets while inflight,
      // or shift camera + look-target by the moon's per-frame delta once
      // we've arrived. This keeps the moon stationary in view while it
      // continues orbiting the star.
      if (state.followMoonId) {
        const fm = state.moonMeshes.find(mm => mm.id === state.followMoonId);
        if (fm) {
          const mp = new THREE.Vector3();
          fm.group.getWorldPosition(mp);
          if (state.mode === "transit" && state.cameraTargetPos && state.followMoonOffset) {
            state.cameraTargetPos.copy(mp).add(state.followMoonOffset);
            state.cameraTargetLook.copy(mp);
          } else if (state.mode === "moon" && state._lastMoonFollowPos) {
            const delta = mp.clone().sub(state._lastMoonFollowPos);
            state.camera.position.add(delta);
            state.controls.target.add(delta);
          }
          state._lastMoonFollowPos = mp.clone();
        }
      }
    }

    // surface scene — animate shader + drift particles
    if (state.surfaceGroup) {
      if (state.surfaceMaterial) state.surfaceMaterial.uniforms.uTime.value = t;
      state.surfaceGroup.rotation.y += dt * 0.012;
      if (state.surfaceParticles) {
        state.surfaceParticles.rotation.y -= dt * 0.018;
        state.surfaceParticles.rotation.x = Math.sin(t * 0.05) * 0.05;
      }
    }

    // camera transit
    if (state.mode === "transit" && state.cameraTargetPos) {
      state.camera.position.lerp(state.cameraTargetPos, 0.06);
      const lookCurrent = state.controls.target.clone();
      lookCurrent.lerp(state.cameraTargetLook, 0.08);
      state.controls.target.copy(lookCurrent);
      if (state.camera.position.distanceTo(state.cameraTargetPos) < 0.5) {
        state.mode = state.afterTransit;
        state.cameraTargetPos = null;
        if (state.afterTransit === "planet") { state.mode = "planet"; onArriveAtPlanet(); }
        else if (state.afterTransit === "galaxy") { state.mode = "galaxy"; onArriveAtGalaxy(); }
        else if (state.afterTransit === "moon") { state.mode = "moon"; onArriveAtMoon(); }
        else if (state.afterTransit === "surface") { state.mode = "surface"; onArriveAtSurface(); }
      }
    }

    // project star labels to screen each frame (cheap with ~20 labels)
    if (state.starLabels && state.starLabels.size > 0) updateStarLabels();
    if (state.moonMeshes.length > 0) updateMoonLabels();

    state.controls.update();
    state.composer.render();
  }
  frame();
}

const _moonLabelV = new THREE.Vector3();
function updateMoonLabels() {
  const showAny = (state.mode === "planet" || state.mode === "moon");
  if (!showAny) {
    for (const m of state.moonMeshes) if (m.label) m.label.classList.remove("visible");
    return;
  }
  const w = window.innerWidth, h = window.innerHeight;
  const currentMoonId = state.currentMoon?.id || null;
  for (const m of state.moonMeshes) {
    if (!m.label) continue;
    // Show on hover OR for the currently-focused moon (so you always know where you are)
    const shouldShow = (state.hoveredMoon === m.id) || (currentMoonId === m.id);
    if (!shouldShow) { m.label.classList.remove("visible"); continue; }
    m.group.getWorldPosition(_moonLabelV);
    _moonLabelV.project(state.camera);
    if (_moonLabelV.z > 1) { m.label.classList.remove("visible"); continue; }
    const x = (_moonLabelV.x * 0.5 + 0.5) * w;
    const y = (-_moonLabelV.y * 0.5 + 0.5) * h;
    m.label.style.transform = `translate(calc(-50% + ${x}px), calc(-22px + ${y}px))`;
    m.label.classList.add("visible");
  }
}

const _labelV = new THREE.Vector3();
function updateStarLabels() {
  const inGalaxy = state.mode === "galaxy" || state.mode === "transit";
  const w = window.innerWidth, h = window.innerHeight;
  for (const [id, label] of state.starLabels) {
    if (!inGalaxy) { label.classList.add("hidden"); continue; }
    const node = state.topicMeshes.get(id);
    if (!node) { label.classList.add("hidden"); continue; }
    // world position of the node accounting for any parent group rotation
    node.getWorldPosition(_labelV);
    const distance = state.camera.position.distanceTo(_labelV);
    _labelV.project(state.camera);
    const behind = _labelV.z > 1;
    if (behind) { label.classList.add("hidden"); continue; }
    label.classList.remove("hidden");
    const x = (_labelV.x * 0.5 + 0.5) * w;
    const y = (-_labelV.y * 0.5 + 0.5) * h;
    // offset above the star a bit (28px world-screen offset)
    label.style.transform = `translate(calc(-50% + ${x}px), calc(-30px + ${y}px))`;
    // fade with distance — close stars get full label, distant ones fade
    const opacity = Math.max(0.15, Math.min(0.95, 80 / distance));
    label.style.opacity = opacity;
  }
}

/* ============================================================
   Hover picking
   ============================================================ */
function doHoverPickMoons() {
  if (state.moonMeshes.length === 0) {
    if (state.hoveredMoon) {
      state.hoveredMoon = null;
      document.getElementById("tooltip").hidden = true;
      document.body.style.cursor = "";
    }
    return;
  }
  state.raycaster.setFromCamera(state.pointer, state.camera);
  // Use the wider invisible hit-spheres so the moon's full corona is hoverable.
  const targets = state.moonMeshes.map(m => m.hit || m.body);
  const hits = state.raycaster.intersectObjects(targets, false);
  const tooltip = document.getElementById("tooltip");

  if (hits.length > 0) {
    const hitObj = hits[0].object;
    const rec = state.moonMeshes.find(m => m.hit === hitObj || m.body === hitObj);
    if (!rec) return;
    if (rec.id !== state.hoveredMoon) {
      state.hoveredMoon = rec.id;
      tooltip.innerHTML = `${rec.sub.name}<span class="tt-sub">moon · ${rec.sub.documents.length} documents</span>`;
      tooltip.hidden = false;
      document.body.style.cursor = "pointer";
    }
    if (state.pointerScreen) {
      tooltip.style.left = `${state.pointerScreen.x}px`;
      tooltip.style.top = `${state.pointerScreen.y}px`;
    }
  } else {
    if (state.hoveredMoon) {
      state.hoveredMoon = null;
      tooltip.hidden = true;
      document.body.style.cursor = "";
    }
  }
}

function doHoverPick() {
  state.raycaster.setFromCamera(state.pointer, state.camera);
  // Use the cached wider invisible hit-spheres (no per-frame allocation).
  const hits = state.raycaster.intersectObjects(state.hitTargets || [], false);
  const tooltip = document.getElementById("tooltip");

  if (hits.length > 0) {
    // intersected object is the hit sphere (or core); its parent is the topic-node group
    const node = hits[0].object.parent;
    const id = node.userData.topicId;
    if (id !== state.hovered) {
      state.hovered = id;
      const topic = topicById(id);
      tooltip.innerHTML = `${escapeHtml(topic.name)}<span class="tt-sub">${escapeHtml(topic.cluster)} · ${topic.documents.length} documents</span><span class="tt-hint">shift-click to fuse</span>`;
      tooltip.hidden = false;
      document.body.style.cursor = "pointer";
      // grow halo
      node.userData.halo.scale.setScalar(8 * node.userData.size);
    }
    if (state.pointerScreen) {
      tooltip.style.left = `${state.pointerScreen.x}px`;
      tooltip.style.top = `${state.pointerScreen.y}px`;
    }
  } else {
    if (state.hovered) {
      const node = state.topicMeshes.get(state.hovered);
      if (node) node.userData.halo.scale.setScalar(6 * node.userData.size);
      state.hovered = null;
      tooltip.hidden = true;
      document.body.style.cursor = "";
    }
  }
}

/* ============================================================
   Mode transitions
   ============================================================ */
function enterPlanet(id) {
  stopSpeech();   // halt any narration from the previous entry
  const topic = topicById(id);
  if (!topic) return;

  // save current camera pose
  state.savedCam.pos.copy(state.camera.position);
  state.savedCam.look.copy(state.controls.target);

  // hide topic nodes & edges for clean planet view
  state.topicGroup.visible = false;
  state.edgeLines.visible = false;
  state.starfield.material.opacity = 1.0;

  // configure planet
  setPlanetTheme(topic);
  state.planetGroup.position.set(0, 0, 0);
  state.planetGroup.visible = true;
  state.currentTopic = topic;

  // target camera: ~12 units away from origin, slight angle
  const dir = new THREE.Vector3(1, 0.3, 1.6).normalize();
  state.cameraTargetPos = dir.multiplyScalar(12.1);  // pull back ~10% so planet fits the view better
  state.cameraTargetLook = new THREE.Vector3(0, 0, 0);
  state.mode = "transit";
  state.afterTransit = "planet";
  state.controls.enabled = true;
  state.controls.minDistance = 6;
  state.controls.maxDistance = 22;

  // hide galaxy HUD, show planet HUD
  document.getElementById("hud-galaxy").hidden = true;
  populatePlanetHud(topic);
  document.getElementById("hud-planet").hidden = false;
  document.getElementById("tooltip").hidden = true;
  state.hovered = null;
  state.hoveredMoon = null;

  // build orbiting moons (if any)
  buildMoons(topic);

  updateBackButton();
  updateGuideContext(`planet — ${topic.name}`);
}

function onArriveAtPlanet() {
  // Auto-narrate the card every time we arrive at a planet.
  // Cached audio plays instantly on second+ visits; first visit fetches once.
  if (!state.currentTopic) return;
  setTimeout(() => {
    if (state.mode !== "planet" || TTS.playing) return;
    const text = cardReadAloud(state.currentTopic);
    const btn = document.querySelector("[data-tts-card]");
    startSpeech(text, btn);
  }, 700);
}

function returnToGalaxy() {
  stopSpeech();
  disposeMoons();
  state.planetGroup.visible = false;
  state.cameraTargetPos = state.savedCam.pos.clone();
  state.cameraTargetLook = state.savedCam.look.clone();
  state.mode = "transit";
  state.afterTransit = "galaxy";
  state.controls.minDistance = 6;
  state.controls.maxDistance = 80;
  document.getElementById("hud-planet").hidden = true;
  document.getElementById("hud-galaxy").hidden = false;
  state.topicGroup.visible = true;
  state.edgeLines.visible = state.edgesVisible;
  state.currentTopic = null;
  state.currentMoon = null;
  updateGuideContext("galactic view");
}

function onArriveAtGalaxy() { /* hook */ }

function onArriveAtMoon() {
  // Auto-narrate every moon arrival, same as planets.
  if (!state.currentMoon) return;
  setTimeout(() => {
    if (state.mode !== "moon" || TTS.playing) return;
    const text = cardReadAloud(state.currentMoon);
    const btn = document.querySelector("[data-tts-card]");
    startSpeech(text, btn);
  }, 700);
}

/* ============================================================
   Planet HUD population
   ============================================================ */
function populatePlanetHud(topic) {
  document.getElementById("planetCluster").textContent = topic.cluster + " · " + (CLUSTERS[topic.cluster]?.label ?? "");
  document.getElementById("planetTitle").textContent = topic.name;
  document.getElementById("planetSummary").textContent = topic.summary;
  document.getElementById("planetDocCount").textContent = `${topic.documents.length} entries`;
  document.getElementById("planetConnCount").textContent = `${connectionsOf(topic.id).length} links`;

  renderTagButtons(topic.tags || []);
  renderCard(topic);
  resetDeleteButton();
}

/* ============================================================
   Modals
   ============================================================ */
function openConclusion(entry) {
  document.getElementById("conclusionTitle").textContent = entry.name;
  document.getElementById("conclusionLead").textContent = entry.conclusion || entry.summary || "";
  const body = document.getElementById("conclusionBody");
  body.innerHTML = "";
  for (const node of (entry.conclusionBody || [])) {
    if (node.type === "p") {
      const p = document.createElement("p");
      p.textContent = node.text;
      body.appendChild(p);
    } else if (node.type === "h4") {
      const h = document.createElement("h4");
      h.textContent = node.text;
      body.appendChild(h);
    } else if (node.type === "ul") {
      const ul = document.createElement("ul");
      for (const item of node.items) {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }
  }
  appendSourcesIfAny(body, entry.sources, "broader reading");
  // Append "see also" pills at the bottom — fills the dead-end after reading the conclusion.
  appendSeeAlsoPills(body, entry);
  document.getElementById("modal-conclusion").hidden = false;
}

function appendSeeAlsoPills(parent, entry) {
  const card = cardFor(entry);
  const seeAlso = (card?.seeAlso || []).filter(s => s && s.id);
  if (seeAlso.length === 0) return;
  const wrap = document.createElement("div");
  wrap.className = "sources-section";
  const h = document.createElement("h4");
  h.textContent = "where to go next";
  wrap.appendChild(h);
  const row = document.createElement("div");
  row.className = "card-seealso";
  for (const s of seeAlso) {
    const resolved = resolveById(s.id);
    if (!resolved) continue;
    const targetColor = resolved.entry.color || "#a78bfa";
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "card-seealso-pill";
    pill.innerHTML = `<span class="pill-dot" style="background:${targetColor};color:${targetColor}"></span><span>${escapeHtml(resolved.entry.name)}</span>${s.why ? `<span class="pill-why">— ${escapeHtml(s.why)}</span>` : ""}`;
    pill.addEventListener("click", () => {
      closeAllModals();
      if (resolved.kind === "topic") navigateToHit({ id: resolved.entry.id, kind: "topic", name: resolved.entry.name });
      else navigateToHit({ id: resolved.entry.id, kind: "moon", name: resolved.entry.name, parentId: resolved.parent.id });
    });
    row.appendChild(pill);
  }
  if (row.childElementCount > 0) {
    wrap.appendChild(row);
    parent.appendChild(wrap);
  }
}

/* Append a "Sources" section if the entry/document has any. */
function appendSourcesIfAny(parent, sources, label) {
  if (!Array.isArray(sources) || sources.length === 0) return;
  const wrap = document.createElement("div");
  wrap.className = "sources-section";
  const h = document.createElement("h4");
  h.textContent = label || "sources";
  wrap.appendChild(h);
  const list = document.createElement("ol");
  list.className = "sources-list";
  for (const s of sources) {
    if (!s || !s.url) continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = s.label || s.url;
    li.appendChild(a);
    list.appendChild(li);
  }
  if (list.childElementCount > 0) {
    wrap.appendChild(list);
    parent.appendChild(wrap);
  }
}

function openDocuments(entry) {
  document.getElementById("docsTitle").textContent = entry.name;
  const list = document.getElementById("docList");
  list.innerHTML = "";
  const docs = entry.documents || [];
  state._currentDocs = docs;
  docs.forEach((doc, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="doc-type">${escapeHtml(doc.type)}</span>
      <span class="doc-title">${escapeHtml(doc.title)}</span>
      <span class="doc-author">${escapeHtml(doc.author)}</span>
    `;
    li.addEventListener("click", () => {
      [...list.children].forEach(c => c.classList.remove("active"));
      li.classList.add("active");
      renderDocument(doc, docs);
    });
    list.appendChild(li);
    if (idx === 0) {
      li.classList.add("active");
      renderDocument(doc, docs);
    }
  });
  document.getElementById("modal-documents").hidden = false;
}

function switchDoc(docId) {
  const docs = state._currentDocs || [];
  const doc = docs.find(d => d.id === docId);
  if (!doc) return;
  // update active class in the list, then render
  const list = document.getElementById("docList");
  if (list) {
    [...list.children].forEach((li, i) => li.classList.toggle("active", docs[i]?.id === doc.id));
  }
  renderDocument(doc, docs);
}

function appendDocNav(parent, doc, docs) {
  if (!docs || docs.length < 2) return;
  const idx = docs.findIndex(d => d.id === doc.id);
  const prev = docs[idx - 1] || null;
  const next = docs[idx + 1] || null;
  if (!prev && !next) return;
  const nav = document.createElement("footer");
  nav.className = "doc-nav";
  nav.innerHTML = `
    ${prev ? `<button class="doc-nav-btn doc-nav-prev" data-doc-prev="${escapeHtml(prev.id)}"><span class="doc-nav-arrow">←</span> <span class="doc-nav-label"><span class="doc-nav-eyebrow">previous</span> ${escapeHtml(prev.title)}</span></button>` : `<span></span>`}
    ${next ? `<button class="doc-nav-btn doc-nav-next" data-doc-next="${escapeHtml(next.id)}"><span class="doc-nav-label"><span class="doc-nav-eyebrow">next</span> ${escapeHtml(next.title)}</span> <span class="doc-nav-arrow">→</span></button>` : ""}
  `;
  parent.appendChild(nav);
}

function renderDocument(doc, allDocs) {
  // any previous reading should stop when switching docs
  stopSpeech();
  state._currentDocs = allDocs || state._currentDocs;
  state._currentDocId = doc.id;
  const reader = document.getElementById("docReader");
  reader.innerHTML = `
    <div class="doc-head-row">
      <h4>${escapeHtml(doc.title)}</h4>
      <div class="tts-controls">
        <button class="tts-btn" data-tts-doc title="Read aloud">
          <svg class="tts-icon-play" viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
          <svg class="tts-icon-pause" viewBox="0 0 24 24" width="14" height="14" hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>
          <span class="tts-label">listen</span>
        </button>
        <button class="tts-stop" data-tts-stop title="Stop" hidden>
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
    <div class="doc-meta">${escapeHtml(doc.author)} · ${escapeHtml(doc.type)}</div>
    <div class="doc-summary">${escapeHtml(doc.summary)}</div>
    <div class="doc-findings">
      <h5>key findings</h5>
      <ul>${doc.findings.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    </div>
    <div class="doc-prose">${doc.prose.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</div>
  `;
  // append sources section if the document has any
  appendSourcesIfAny(reader, doc.sources, "sources");
  // prev / next navigation through the doc list
  appendDocNav(reader, doc, state._currentDocs || []);
  reader.scrollTop = 0;
  // wire the dynamically-rendered control set + doc-nav prev/next
  const navPrev = reader.querySelector("[data-doc-prev]");
  if (navPrev) navPrev.addEventListener("click", () => switchDoc(navPrev.dataset.docPrev));
  const navNext = reader.querySelector("[data-doc-next]");
  if (navNext) navNext.addEventListener("click", () => switchDoc(navNext.dataset.docNext));

  const btn = reader.querySelector("[data-tts-doc]");
  if (btn) {
    btn.addEventListener("click", () => handleTTSButtonClick(btn, () => entryToReadable(doc, "document")));
  }
  const stopBtn = reader.querySelector("[data-tts-stop]");
  if (stopBtn) stopBtn.addEventListener("click", () => stopSpeech());
}

function openConnections(entry) {
  document.getElementById("connTitle").textContent = entry.name;
  const grid = document.getElementById("connGrid");
  grid.innerHTML = "";
  document.getElementById("connAdder").innerHTML = "";

  // moon: connections = parent + sibling moons
  if (entry.parentId) {
    const parent = topicById(entry.parentId);
    if (parent) {
      const card = mkConnCard(parent, "parent topic");
      card.addEventListener("click", () => {
        closeAllModals();
        // exit moon mode, stay on planet
        if (state.currentMoon) returnToPlanet();
      });
      grid.appendChild(card);
    }
    for (const sib of subTopicsOf(entry.parentId)) {
      if (sib.id === entry.id) continue;
      const card = mkConnCard(sib, "sibling moon");
      card.addEventListener("click", () => {
        closeAllModals();
        const rec = state.moonMeshes.find(m => m.id === sib.id);
        if (rec) enterMoon(rec);
      });
      grid.appendChild(card);
    }
  } else {
    // top-level topic: galactic edges
    for (const c of connectionsOf(entry.id)) {
      const card = mkConnCard(c, c.cluster);
      card.addEventListener("click", () => {
        closeAllModals();
        state.planetGroup.visible = false;
        setTimeout(() => enterPlanet(c.id), 50);
      });
      grid.appendChild(card);
    }
    // also list own moons as "satellites"
    for (const sub of subTopicsOf(entry.id)) {
      const card = mkConnCard(sub, "satellite moon");
      card.addEventListener("click", () => {
        closeAllModals();
        const rec = state.moonMeshes.find(m => m.id === sub.id);
        if (rec) enterMoon(rec);
      });
      grid.appendChild(card);
    }
  }

  // For top-level topics only: offer an inline "+ add connection" affordance.
  // (Moons don't participate in the galactic edge graph.)
  if (!entry.parentId) {
    renderConnAdderButton(entry);
  }

  document.getElementById("modal-connections").hidden = false;
}

function renderConnAdderButton(topic) {
  const host = document.getElementById("connAdder");
  host.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "add-conn-btn";
  btn.textContent = "+ add connection";
  btn.addEventListener("click", () => renderConnAdderPicker(topic));
  host.appendChild(btn);
}

function renderConnAdderPicker(topic) {
  const host = document.getElementById("connAdder");
  host.innerHTML = "";

  const connectedIds = new Set(connectionsOf(topic.id).map(c => c.id));
  connectedIds.add(topic.id);
  const available = TOPICS.filter(t => !connectedIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (available.length === 0) {
    const p = document.createElement("p");
    p.className = "dim";
    p.textContent = "Already connected to every other star.";
    host.appendChild(p);
    return;
  }

  const intro = document.createElement("p");
  intro.className = "conn-intro";
  intro.textContent = "Pick topics to connect to:";
  host.appendChild(intro);

  const list = document.createElement("div");
  list.className = "conn-checklist";
  host.appendChild(list);

  for (const other of available) {
    const row = document.createElement("label");
    row.className = "conn-check-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = other.id;
    const dot = document.createElement("span");
    dot.className = "conn-check-dot";
    dot.style.background = other.color;
    dot.style.color = other.color;
    const name = document.createElement("span");
    name.className = "conn-check-name";
    name.textContent = other.name;
    row.appendChild(cb);
    row.appendChild(dot);
    row.appendChild(name);
    cb.addEventListener("change", updateCount);
    list.appendChild(row);
  }

  const actions = document.createElement("div");
  actions.className = "conn-review-actions";
  const cancel = document.createElement("button");
  cancel.className = "setting-btn ghost";
  cancel.textContent = "cancel";
  cancel.addEventListener("click", () => renderConnAdderButton(topic));
  const confirm = document.createElement("button");
  confirm.className = "setting-btn";
  const countSpan = document.createElement("span");
  countSpan.textContent = "0";
  const pluralSpan = document.createElement("span");
  confirm.appendChild(document.createTextNode("add "));
  confirm.appendChild(countSpan);
  confirm.appendChild(document.createTextNode(" connection"));
  confirm.appendChild(pluralSpan);
  actions.appendChild(cancel);
  actions.appendChild(confirm);
  host.appendChild(actions);

  function updateCount() {
    const checked = list.querySelectorAll("input:checked").length;
    countSpan.textContent = checked;
    pluralSpan.textContent = checked === 1 ? "" : "s";
  }

  confirm.addEventListener("click", () => {
    const checked = [...list.querySelectorAll("input:checked")];
    if (checked.length === 0) { renderConnAdderButton(topic); return; }
    for (const cb of checked) {
      if (registerGeneratedEdge(topic.id, cb.value)) {
        persistEdge(topic.id, cb.value);
      }
    }
    rebuildEdges();
    toast(`+ ${checked.length} connection${checked.length === 1 ? "" : "s"}`);
    openConnections(topic);  // re-render the modal to show new cards
  });
}

function mkConnCard(entity, sub) {
  const card = document.createElement("button");
  card.className = "conn-card";
  card.innerHTML = `<span class="conn-name">${escapeHtml(entity.name)}</span><span class="conn-cluster">${escapeHtml(sub)}</span>`;
  card.style.borderLeft = `3px solid ${entity.color || "#a78bfa"}`;
  return card;
}

function closeAllModals() {
  stopSpeech();
  document.querySelectorAll(".modal").forEach(m => m.hidden = true);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

/* ============================================================
   UI wiring
   ============================================================ */
function currentEntry() {
  return state.currentMoon || state.currentTopic;
}

/* ============================================================
   Title rename — let the learner name their own stars
   ------------------------------------------------------------
   The planet title is contenteditable on click. Enter or blur
   commits; Esc cancels. Renames persist via the override system
   (motu.override.<id>) so the seed topic name in data.js is
   never destructively edited — the user's name wins on load.
   ============================================================ */
function setupTitleRename() {
  const titleEl = document.getElementById("planetTitle");
  if (!titleEl) return;
  let oldName = "";

  titleEl.addEventListener("click", () => {
    if (titleEl.isContentEditable) return;       // already editing
    const entry = currentEntry();
    if (!entry) return;
    oldName = titleEl.textContent;
    titleEl.contentEditable = "true";
    titleEl.spellcheck = false;
    titleEl.focus();
    // select all text
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
    if (e.key === "Escape") { e.preventDefault(); titleEl.textContent = oldName; titleEl.blur(); }
  });

  titleEl.addEventListener("blur", () => {
    if (!titleEl.isContentEditable) return;
    titleEl.contentEditable = "false";
    const entry = currentEntry();
    if (!entry) return;
    const newName = titleEl.textContent.replace(/\s+/g, " ").trim();
    if (!newName) {
      titleEl.textContent = oldName;
      return;
    }
    if (newName === oldName) return;
    entry.name = newName;
    titleEl.textContent = newName;
    persistRename(entry);
    refreshStarLabel(entry);
    refreshGuideContext(entry);
    toast(`renamed → ${newName}`);
  });

  // Prevent rich-paste from polluting the title (only plain text allowed)
  titleEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\s+/g, " ").trim();
    document.execCommand("insertText", false, text);
  });
}

function persistRename(entry) {
  try {
    const key = `motu.override.${entry.id}`;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};
    data.name = entry.name;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) { handleQuotaError(e); }
}

function refreshStarLabel(entry) {
  const label = state.starLabels?.get(entry.id);
  if (!label) return;
  // rebuild label content with the new name
  label.innerHTML = `<span class="star-label-dot" style="background:${entry.color};color:${entry.color}"></span>${escapeHtml(entry.name)}`;
}

function refreshGuideContext(entry) {
  const label = state.currentMoon ? `moon — ${entry.name}` : `planet — ${entry.name}`;
  updateGuideContext(label);
}

/* ============================================================
   Listen tracking — per-topic / per-kind listen time + completion.
   Persisted to localStorage as motu.listenStats. Used as a
   weighted-interest signal for new content generation.
   ============================================================ */
const LISTEN = {
  current: null,  // { entryId, kind, startedAt, estimatedMs }
  history: (() => {
    try { return JSON.parse(localStorage.getItem("motu.listenStats") || "{}"); }
    catch { return {}; }
  })(),
};

function listenStart(entryId, kind, text) {
  if (!entryId) return;
  // estimate duration: ~13 chars/sec at rate 1.0, scaled by playback rate
  const estMs = (text.length / (13 * (TTS.rate || 1.0))) * 1000;
  LISTEN.current = {
    entryId, kind,
    startedAt: performance.now(),
    estimatedMs: estMs,
  };
}

function listenEnd() {
  const c = LISTEN.current;
  if (!c) return;
  const elapsedMs = performance.now() - c.startedAt;
  if (elapsedMs < 1500) { LISTEN.current = null; return; }   // ignore quick cancels
  const completion = Math.max(0, Math.min(1, elapsedMs / c.estimatedMs));
  const cur = LISTEN.history[c.entryId] || { totalMs: 0, sessions: 0, completion: 0, lastListened: 0, kinds: {} };
  cur.totalMs += elapsedMs;
  cur.sessions += 1;
  cur.completion = (cur.completion * (cur.sessions - 1) + completion) / cur.sessions;
  cur.lastListened = Date.now();
  cur.kinds[c.kind] = (cur.kinds[c.kind] || 0) + 1;
  LISTEN.history[c.entryId] = cur;
  try { localStorage.setItem("motu.listenStats", JSON.stringify(LISTEN.history)); } catch {}
  LISTEN.current = null;
}

/* Format the top entries for inclusion in a generation prompt. */
function listenContextForPrompt() {
  const entries = Object.entries(LISTEN.history)
    .map(([id, s]) => {
      const t = topicById(id) || subTopicById(id);
      return t ? { id, name: t.name, kind: t.parentId ? "moon" : "topic", totalSec: Math.round(s.totalMs / 1000), sessions: s.sessions, completion: s.completion } : null;
    })
    .filter(Boolean)
    .filter(e => e.totalSec >= 20)
    .sort((a, b) => b.totalSec - a.totalSec)
    .slice(0, 10);
  if (entries.length === 0) return "";
  const lines = entries.map((e, i) =>
    `  ${i+1}. ${e.id} ("${e.name}") — ${e.totalSec}s across ${e.sessions} session${e.sessions === 1 ? "" : "s"}, avg ${Math.round(e.completion * 100)}% completion`
  );
  return "USER LISTENING HISTORY — a signal of their genuine interests:\n" + lines.join("\n") +
    "\n\nLean into this. Where natural, link seeAlso to ids they've listened to (familiar anchor) AND 1-2 they haven't (novel discovery).";
}

/* ============================================================
   TTS audio cache (IndexedDB)
   ------------------------------------------------------------
   Per-entry narration is fetched once from ElevenLabs and stored
   as a Blob keyed by (voice, model, hash-of-text). On reload of
   the same entry with the same voice + content, we hit cache and
   play back instantly. If the entry's content changes (rename,
   regenerate, content edit), the hash differs → cache miss →
   fresh fetch. Old cache lingers harmlessly until cleared.
   ============================================================ */
const TTS_DB_NAME = "motu-tts";
const TTS_DB_STORE = "audio";

function openTTSDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(TTS_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TTS_DB_STORE)) {
        db.createObjectStore(TTS_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getCachedTTS(key) {
  try {
    const db = await openTTSDB();
    const tx = db.transaction(TTS_DB_STORE, "readonly");
    const store = tx.objectStore(TTS_DB_STORE);
    return await new Promise((res) => {
      const r = store.get(key);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  } catch (e) { return null; }
}
async function saveCachedTTS(key, blob) {
  try {
    const db = await openTTSDB();
    const tx = db.transaction(TTS_DB_STORE, "readwrite");
    tx.objectStore(TTS_DB_STORE).put(blob, key);
    await new Promise(r => tx.oncomplete = r);
  } catch (e) {}
}
function simpleHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* ============================================================
   Text-to-speech
   ------------------------------------------------------------
   Uses the browser's Web Speech API — no API key required.
   Voices are paragraph-chunked into a queue to (a) sidestep
   Chrome's 15-second per-utterance bug and (b) allow stop/skip.
   Settings persist in localStorage.
   ============================================================ */

const TTS = {
  // browser engine state
  voices: [],                // [{voice: SpeechSynthesisVoice, score, label}]
  selected: null,            // SpeechSynthesisVoice or null
  // elevenlabs engine state
  elKey: localStorage.getItem("motu.tts.elKey") || "",
  elVoices: [],              // [{voice_id, name, labels, category}]
  elModel: localStorage.getItem("motu.tts.elModel") || "eleven_turbo_v2_5",
  elQuota: null,             // { used, limit }
  // unified selection: "browser:<voiceURI>" or "elevenlabs:<voiceId>"
  engine: "browser",
  // playback state
  rate: parseFloat(localStorage.getItem("motu.tts.rate") || "1.10"),
  pitch: parseFloat(localStorage.getItem("motu.tts.pitch") || "1.0"),
  queue: [],
  index: 0,
  playing: false,
  paused: false,
  currentBtn: null,
  // elevenlabs audio playback
  audio: null,               // HTMLAudioElement currently playing
  audioParts: [],            // queued blob URLs (now always 0 or 1, kept for compat)
  audioPartIndex: 0,
  pendingAbort: null,        // AbortController for in-flight fetch
  _token: 0,                 // race-protection for cache-aware async fetches
  _elQuotaExhausted: false,  // set once an API call fails with quota / auth error
  _quotaToastShown: false,
};

function initTTS() {
  if (!("speechSynthesis" in window)) {
    const hint = document.getElementById("voiceHint");
    if (hint) hint.textContent = "Your browser does not support speech synthesis.";
    document.querySelectorAll(".tts-btn").forEach(b => b.style.display = "none");
    return;
  }
  loadVoices();
  speechSynthesis.addEventListener("voiceschanged", loadVoices);
  // Chrome sometimes never fires voiceschanged — poll up to ~3s
  let polls = 0;
  const poll = setInterval(() => {
    polls++;
    if (TTS.voices.length > 0 || polls > 30) { clearInterval(poll); return; }
    loadVoices();
  }, 100);
}

function loadVoices() {
  const raw = speechSynthesis.getVoices();
  // English only — the library is in English
  const en = raw.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  // dedupe by voiceURI
  const seen = new Set();
  TTS.voices = [];
  for (const v of en) {
    if (seen.has(v.voiceURI)) continue;
    seen.add(v.voiceURI);
    TTS.voices.push({ voice: v, score: scoreVoice(v), label: prettyVoice(v) });
  }
  TTS.voices.sort((a, b) => b.score - a.score);

  // pick preferred: persisted, else first warm-female if found, else first
  const persistedURI = localStorage.getItem("motu.tts.voiceURI");
  let pick = TTS.voices.find(v => v.voice.voiceURI === persistedURI);
  if (!pick) {
    const warmRx = /aria|jenny|sonia|ava|samantha|libby|olivia|moira/i;
    pick = TTS.voices.find(v => warmRx.test(v.voice.name));
  }
  if (!pick && TTS.voices.length) pick = TTS.voices[0];
  TTS.selected = pick?.voice || null;

  populateVoiceSelect();
  // update hint with current state — helps when nothing seems to be working
  const hint = document.getElementById("voiceHint");
  if (hint) {
    if (TTS.voices.length === 0) {
      hint.textContent = "no voices detected yet · they often arrive after first click";
    } else {
      hint.textContent = `${TTS.voices.length} voices available · current: ${TTS.selected?.name || "browser default"}`;
    }
  }
}

function scoreVoice(v) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/neural|online/.test(n)) s += 100;
  if (/premium/.test(n)) s += 80;
  if (/enhanced|natural/.test(n)) s += 60;
  if (/(microsoft|apple|google)/.test(n)) s += 20;
  if (v.localService === false) s += 30;
  // known-warm narrator voices
  if (/aria|jenny|sonia|ava|samantha|libby|olivia|moira/i.test(n)) s += 50;
  // mild bonus for variety of accents
  if (v.lang === "en-US") s += 5;
  if (v.lang === "en-GB") s += 4;
  if (v.lang === "en-AU") s += 3;
  return s;
}

function prettyVoice(v) {
  // strip the "Microsoft" / "Google" prefixes for cleanliness; keep accent + tag
  let name = v.name
    .replace(/^Microsoft\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s+Online\s+\(Natural\)\s*-\s*/i, " · ")
    .replace(/\s+\(.*?\)\s*-\s*/i, " · ");
  // accent tag
  const accent = ({ "en-US": "US", "en-GB": "UK", "en-AU": "AU", "en-CA": "CA", "en-IN": "IN", "en-IE": "IE", "en-NZ": "NZ", "en-ZA": "ZA" })[v.lang] || v.lang;
  return `${name} (${accent})`;
}

function qualityStars(score) {
  if (score >= 150) return "★★★";
  if (score >= 70) return "★★";
  if (score >= 30) return "★";
  return "·";
}

function populateVoiceSelect() {
  const sel = document.getElementById("voiceSelect");
  if (!sel) return;
  const prev = localStorage.getItem("motu.tts.unifiedKey") || "";
  sel.innerHTML = "";

  // ElevenLabs voices first (if connected)
  if (TTS.elVoices.length > 0) {
    const og = document.createElement("optgroup");
    og.label = "★★★★★ ElevenLabs (premium)";
    for (const v of TTS.elVoices) {
      const opt = document.createElement("option");
      opt.value = `elevenlabs:${v.voice_id}`;
      const desc = elVoiceDescription(v);
      opt.textContent = `${v.name}${desc ? " · " + desc : ""}`;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }

  // Browser voices — hidden once ElevenLabs voices are loaded
  // (kept visible as a fallback while EL voices are still loading)
  const showBrowser = !TTS.elKey || TTS.elVoices.length === 0;
  if (showBrowser && TTS.voices.length > 0) {
    const og = document.createElement("optgroup");
    og.label = "Browser (built-in)";
    for (const v of TTS.voices) {
      const opt = document.createElement("option");
      opt.value = `browser:${v.voice.voiceURI}`;
      opt.textContent = `${qualityStars(v.score)}  ${v.label}`;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }

  if (sel.children.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "no voices available";
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;

  // restore selection
  if (prev) {
    sel.value = prev;
    if (sel.value !== prev) {
      // prev no longer exists — fall through to default
      sel.selectedIndex = 0;
    }
  } else {
    sel.selectedIndex = 0;
  }
  applyVoiceSelection(sel.value);
}

function elVoiceDescription(v) {
  if (!v.labels) return "";
  const ls = v.labels;
  const bits = [];
  if (ls.gender) bits.push(ls.gender);
  if (ls.age) bits.push(ls.age);
  if (ls.accent) bits.push(ls.accent);
  if (ls.description) bits.push(ls.description);
  if (ls.use_case) bits.push(ls.use_case);
  return bits.slice(0, 3).join(" · ");
}

function applyVoiceSelection(value) {
  // value: "browser:<voiceURI>" | "elevenlabs:<voiceId>"
  const [engine, id] = value.split(":", 2);
  if (engine === "browser") {
    const rec = TTS.voices.find(v => v.voice.voiceURI === id);
    if (rec) {
      TTS.engine = "browser";
      TTS.selected = rec.voice;
    }
  } else if (engine === "elevenlabs") {
    if (TTS.elVoices.find(v => v.voice_id === id)) {
      TTS.engine = "elevenlabs";
    }
  }
  localStorage.setItem("motu.tts.unifiedKey", value);
  updateSettingsVisibility();
  // update hint
  const hint = document.getElementById("voiceHint");
  if (hint) {
    if (TTS.engine === "elevenlabs") {
      const v = TTS.elVoices.find(v => v.voice_id === id);
      hint.textContent = `ElevenLabs · ${v?.name || "selected"} · audio fetched on demand`;
    } else if (TTS.selected) {
      hint.textContent = `${TTS.voices.length} browser voices · current: ${TTS.selected.name}`;
    }
  }
}

// Reserved for future engine-specific UI toggles. Pitch is now wired to both engines.
function updateSettingsVisibility() {
  // pitch is now applied to both engines — leave row visible
}

/* split a long text into utterance-sized chunks (paragraphs / sentences) */
function chunkForSpeech(text) {
  // split on paragraph breaks first, then long paragraphs into sentences
  const paras = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const chunks = [];
  for (const p of paras) {
    if (p.length <= 240) { chunks.push(p); continue; }
    // sentence split — keep terminators
    const sents = p.match(/[^.!?]+[.!?]+["')\]]?\s*/g) || [p];
    let buf = "";
    for (const s of sents) {
      if ((buf + s).length > 240 && buf) { chunks.push(buf.trim()); buf = s; }
      else buf += s;
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks;
}

function entryToReadable(entry, kind) {
  // kind: "conclusion" | "document"
  if (kind === "conclusion") {
    const parts = [];
    parts.push(`${entry.name}.`);
    parts.push(`Distilled conclusion. ${entry.conclusion || entry.summary || ""}`);
    for (const node of (entry.conclusionBody || [])) {
      if (node.type === "p") parts.push(node.text);
      else if (node.type === "h4") parts.push(node.text + ".");
      else if (node.type === "ul") {
        for (const item of node.items) parts.push(item);
      }
    }
    return parts.join("\n\n");
  }
  if (kind === "document") {
    const doc = entry;
    const parts = [];
    parts.push(`${doc.title}.`);
    parts.push(`Summary. ${doc.summary || ""}`);
    if (doc.findings?.length) {
      parts.push("Key findings.");
      for (const f of doc.findings) parts.push(f);
    }
    if (doc.prose?.length) {
      for (const p of doc.prose) parts.push(p);
    }
    return parts.join("\n\n");
  }
  return "";
}

function startSpeech(text, btn, opts = {}) {
  stopSpeech();
  // Self-correct: if EL is configured but engine somehow drifted to browser
  // (e.g., race during boot when elVoices populated late), force it back.
  if (TTS.elKey && getSelectedElVoiceId() && TTS.engine !== "elevenlabs") {
    console.log("[TTS] auto-correcting engine to 'elevenlabs'");
    TTS.engine = "elevenlabs";
  }
  // listen tracking
  const entry = currentEntry();
  const kind = btn?.dataset?.ttsSource || (btn?.dataset?.ttsDoc !== undefined ? "document" : btn?.dataset?.ttsCard !== undefined ? "card" : "other");
  if (entry) listenStart(entry.id, kind, text);
  // Narration is ElevenLabs-only (Lily). No browser-voice fallback.
  startSpeechElevenLabs(text, btn, opts);
}

function startSpeechBrowser(text, btn) {
  if (!("speechSynthesis" in window)) {
    toast("speech synthesis not supported in this browser");
    return;
  }
  if (TTS.voices.length === 0) loadVoices();
  const chunks = chunkForSpeech(text);
  if (chunks.length === 0) return;
  TTS.queue = chunks.map(c => {
    const u = new SpeechSynthesisUtterance(c);
    if (TTS.selected) u.voice = TTS.selected;
    u.rate = TTS.rate;
    u.pitch = TTS.pitch;
    u.volume = 1.0;
    u.lang = TTS.selected?.lang || "en-US";
    return u;
  });
  TTS.index = 0;
  TTS.playing = true;
  TTS.paused = false;
  TTS.currentBtn = btn;
  if (btn) { btn.classList.add("playing"); setBtnLabel(btn, "pause"); showStopFor(btn); }
  playNextChunk();
}

async function startSpeechElevenLabs(text, btn, opts = {}) {
  const isManual = !!opts.manual;
  const voiceId = getSelectedElVoiceId();
  console.log("[TTS-EL] starting", { isManual, hasKey: !!TTS.elKey, voiceId, exhausted: TTS._elQuotaExhausted, textLen: text?.length });

  if (!voiceId || !TTS.elKey) {
    if (isManual) toast("Connect ElevenLabs in Settings to enable narration");
    return;
  }
  // Auto-narration with known quota exhaustion: silent.
  // Manual clicks BYPASS the flag — maybe it's transient, give it a shot.
  if (TTS._elQuotaExhausted && !isManual) {
    return;
  }

  TTS.playing = true;
  TTS.paused = false;
  TTS.currentBtn = btn;
  if (btn) { btn.classList.add("playing"); showStopFor(btn); }

  const cacheKey = `${voiceId}:${TTS.elModel}:${simpleHash(text)}`;
  const speechToken = ++TTS._token;

  try {
    let blob = await getCachedTTS(cacheKey);
    if (speechToken !== TTS._token || !TTS.playing) return;
    let fromCache = !!blob;
    console.log("[TTS-EL] cache", fromCache ? "HIT" : "MISS", cacheKey.slice(0, 40));

    if (!blob) {
      if (btn) {
        const label = btn.querySelector(".tts-label");
        if (label && !label._original) { label._original = label.textContent; label.textContent = "generating…"; }
      }
      TTS.pendingAbort = new AbortController();
      blob = await elFetchFullAudio(text, voiceId, TTS.pendingAbort.signal);
      if (speechToken !== TTS._token || !TTS.playing) return;
      console.log("[TTS-EL] fetched", blob.size, "bytes");
      saveCachedTTS(cacheKey, blob).catch(() => {});
      // Successful manual fetch clears any stale quota flag
      if (isManual && TTS._elQuotaExhausted) {
        TTS._elQuotaExhausted = false;
        TTS._quotaToastShown = false;
        console.log("[TTS-EL] quota flag cleared (manual succeeded)");
      }
    }

    const url = URL.createObjectURL(blob);
    TTS.audioParts = [url];
    TTS.audioPartIndex = 0;
    restoreBtnLabel(btn);
    setBtnLabel(btn, "pause");
    playElevenPart(0);
    if (!fromCache) refreshElQuota();
  } catch (err) {
    console.warn("[TTS-EL] error:", err.message || err);
    restoreBtnLabel(btn);
    if (isElQuotaError(err)) {
      TTS._elQuotaExhausted = true;
      // Manual clicks always get a toast. Auto-narration only the first time.
      if (isManual || !TTS._quotaToastShown) {
        TTS._quotaToastShown = true;
        toast("ElevenLabs quota exceeded — narration paused. Top up at elevenlabs.io.");
      }
    } else if (err.name !== "AbortError") {
      // network / unknown errors: always toast (manual or not)
      toast(`audio: ${err.message?.slice(0, 100) || "request failed"}`);
    }
    stopSpeech();
  }
}

/* Detect ElevenLabs errors that are permanent for the session (quota / auth /
   subscription) — these stop further auto-attempts. Rate-limit (429) is
   transient so we don't flag-permanent on it. */
function isElQuotaError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("quota") ||
         msg.includes("subscription") ||
         msg.includes("payment") ||
         /api\s*40[1-3]/.test(msg);
}

async function elFetchFullAudio(text, voiceId, signal) {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": TTS.elKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: TTS.elModel,
      voice_settings: { stability: 0.45, similarity_boost: 0.78, style: 0.0, use_speaker_boost: true },
    }),
    signal,
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${txt.slice(0, 200)}`);
  }
  return await resp.blob();
}

function restoreBtnLabel(btn) {
  if (!btn) return;
  const label = btn.querySelector(".tts-label");
  if (label && label._original) { label.textContent = label._original; label._original = null; }
}

function getSelectedElVoiceId() {
  const v = localStorage.getItem("motu.tts.unifiedKey") || "";
  const [engine, id] = v.split(":", 2);
  return engine === "elevenlabs" ? id : null;
}

async function elFetchAudio(text, voiceId, signal) {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": TTS.elKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: TTS.elModel,
      voice_settings: { stability: 0.45, similarity_boost: 0.78, style: 0.0, use_speaker_boost: true },
    }),
    signal,
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${t.slice(0, 200)}`);
  }
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

function playElevenPart(index) {
  if (!TTS.playing) return;
  if (index >= TTS.audioParts.length) {
    stopSpeech({ natural: true });
    return;
  }
  const url = TTS.audioParts[index];
  if (!url) {
    // not ready yet — wait briefly then retry
    setTimeout(() => playElevenPart(index), 200);
    return;
  }
  const a = new Audio(url);
  // Pitch on pre-rendered audio: disable the browser's pitch-preservation so
  // playbackRate genuinely modulates pitch as well. We bake pitch into rate as
  // (speed * pitch) — pitch and speed are then slightly coupled, which is the
  // honest trade-off for pitch-shifting MP3 without a full phase vocoder.
  a.preservesPitch = false;
  a.mozPreservesPitch = false;
  a.webkitPreservesPitch = false;
  a.playbackRate = Math.max(0.5, Math.min(2.0, TTS.rate * TTS.pitch));
  TTS.audio = a;
  a.addEventListener("ended", () => {
    URL.revokeObjectURL(url);
    TTS.audioParts[index] = null;
    if (TTS.playing) playElevenPart(index + 1);
  });
  a.addEventListener("error", () => {
    if (TTS.playing) playElevenPart(index + 1);
  });
  a.play().then(() => {
    console.log("[TTS-EL] playback started");
  }).catch(err => {
    console.warn("[TTS-EL] audio.play() rejected:", err.message || err);
    toast(`playback blocked — click the page to allow audio`);
    if (TTS.playing) playElevenPart(index + 1);
  });
}

// ElevenLabs handles longer text well; chunk by paragraph break for streaming start
function chunkForSpeechEL(text) {
  const paras = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  // group small paragraphs together up to ~800 chars to balance latency and request count
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > 800 && buf) {
      chunks.push(buf.trim()); buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function playNextChunk() {
  if (!TTS.playing) return;
  if (TTS.index >= TTS.queue.length) {
    stopSpeech();
    return;
  }
  const u = TTS.queue[TTS.index++];
  u.onend = () => playNextChunk();
  u.onerror = () => playNextChunk();
  speechSynthesis.speak(u);
}

function stopSpeech(opts = {}) {
  // Capture the natural-end callback BEFORE clearing; fire it after cleanup
  // only if this stop was due to natural completion (not user interruption).
  const naturalCb = opts.natural ? TTS.onComplete : null;
  TTS.onComplete = null;

  if (LISTEN.current) listenEnd();
  TTS.playing = false;
  TTS.paused = false;
  TTS.queue = [];
  TTS.index = 0;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  // elevenlabs
  if (TTS.audio) { try { TTS.audio.pause(); } catch(e){} TTS.audio = null; }
  if (TTS.pendingAbort) { try { TTS.pendingAbort.abort(); } catch(e){} TTS.pendingAbort = null; }
  for (const url of TTS.audioParts) { if (url) URL.revokeObjectURL(url); }
  TTS.audioParts = [];
  TTS.audioPartIndex = 0;
  if (TTS.currentBtn) {
    TTS.currentBtn.classList.remove("playing");
    TTS.currentBtn.classList.remove("paused");
    setBtnLabel(TTS.currentBtn, "listen");
    restoreBtnLabel(TTS.currentBtn);
    const sibling = TTS.currentBtn.parentElement?.querySelector("[data-tts-stop]");
    if (sibling) sibling.hidden = true;
  }
  TTS.currentBtn = null;

  if (naturalCb) { try { naturalCb(); } catch (_) {} }
}

function pauseSpeech() {
  if (!TTS.playing || TTS.paused) return;
  TTS.paused = true;
  if (TTS.engine === "browser") {
    if ("speechSynthesis" in window) speechSynthesis.pause();
  } else if (TTS.engine === "elevenlabs") {
    if (TTS.audio) { try { TTS.audio.pause(); } catch(e){} }
  }
  if (TTS.currentBtn) {
    TTS.currentBtn.classList.remove("playing");
    TTS.currentBtn.classList.add("paused");
    setBtnLabel(TTS.currentBtn, "resume");
  }
}

function resumeSpeech() {
  if (!TTS.playing || !TTS.paused) return;
  TTS.paused = false;
  if (TTS.engine === "browser") {
    if ("speechSynthesis" in window) speechSynthesis.resume();
  } else if (TTS.engine === "elevenlabs") {
    if (TTS.audio) { TTS.audio.play().catch(()=>{}); }
  }
  if (TTS.currentBtn) {
    TTS.currentBtn.classList.remove("paused");
    TTS.currentBtn.classList.add("playing");
    setBtnLabel(TTS.currentBtn, "pause");
  }
}

function setBtnLabel(btn, txt) {
  const l = btn?.querySelector(".tts-label");
  if (l) l.textContent = txt;
}

function showStopFor(btn) {
  const sibling = btn?.parentElement?.querySelector("[data-tts-stop]");
  if (sibling) sibling.hidden = false;
}

/* ============================================================
   ElevenLabs — connect, disconnect, quota
   ============================================================ */

async function elConnectFlow() {
  document.getElementById("elDisconnected").hidden = true;
  document.getElementById("elKeyRow").hidden = false;
  document.getElementById("elKey").focus();
}
async function elCancelConnect() {
  document.getElementById("elKeyRow").hidden = true;
  document.getElementById("elDisconnected").hidden = false;
}
async function elSaveKey() {
  const key = document.getElementById("elKey").value.trim();
  if (!key) return;
  try {
    showGenerationOverlay("connecting to ElevenLabs…", "loading voices");
    TTS.elKey = key;
    const voices = await elFetchVoices(key);
    TTS.elVoices = voices;
    ensureLilyInVoices();
    // Force Lily as the saved selection from the moment of first connection.
    const lily = TTS.elVoices.find(v => v.voice_id === LILY_VOICE_ID || (v.name || "").toLowerCase() === "lily");
    if (lily) localStorage.setItem("motu.tts.unifiedKey", `elevenlabs:${lily.voice_id}`);
    localStorage.setItem("motu.tts.elKey", key);
    populateVoiceSelect();
    // first-connection default: prefer Lily, then Rachel, else the first available
    const sel = document.getElementById("voiceSelect");
    const preferred = pickPreferredElVoice();
    if (preferred) {
      sel.value = `elevenlabs:${preferred.voice_id}`;
      applyVoiceSelection(sel.value);
    }
    document.getElementById("elKeyRow").hidden = true;
    document.getElementById("elDisconnected").hidden = true;
    document.getElementById("elConnected").hidden = false;
    document.getElementById("elKey").value = "";
    // model toggle: restore persisted
    document.querySelectorAll("input[name='elModel']").forEach(r => {
      r.checked = (r.value === TTS.elModel);
    });
    await refreshElQuota();
    hideGenerationOverlay();
    toast(`✦ ElevenLabs connected · ${TTS.elVoices.length} voices`);
  } catch (err) {
    hideGenerationOverlay();
    toast(`ElevenLabs: ${err.message?.slice(0, 80) || "key rejected"}`);
    TTS.elKey = "";
  }
}
function elDisconnect() {
  TTS.elKey = "";
  TTS.elVoices = [];
  TTS.elQuota = null;
  localStorage.removeItem("motu.tts.elKey");
  // if currently using EL voice, drop back to browser
  if (TTS.engine === "elevenlabs") {
    TTS.engine = "browser";
    localStorage.removeItem("motu.tts.unifiedKey");
  }
  document.getElementById("elConnected").hidden = true;
  document.getElementById("elKeyRow").hidden = true;
  document.getElementById("elDisconnected").hidden = false;
  document.getElementById("elQuota").textContent = "";
  populateVoiceSelect();
  // also re-select a browser voice
  if (TTS.voices.length) {
    const sel = document.getElementById("voiceSelect");
    sel.value = `browser:${TTS.voices[0].voice.voiceURI}`;
    applyVoiceSelection(sel.value);
  }
  toast("ElevenLabs disconnected");
}

// ElevenLabs standard "Lily" voice — guaranteed available across all accounts.
// Hardcoded id so she can be used even if the user's library somehow excludes her.
const LILY_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";
const LILY_FALLBACK = {
  voice_id: LILY_VOICE_ID,
  name: "Lily",
  category: "premade",
  labels: { description: "warm narrator", accent: "british" },
};

// Inject Lily into elVoices if she isn't already there.
function ensureLilyInVoices() {
  if (!TTS.elVoices.length) return;
  if (!TTS.elVoices.find(v => v.voice_id === LILY_VOICE_ID || (v.name || "").toLowerCase() === "lily")) {
    TTS.elVoices.unshift(LILY_FALLBACK);
  }
}

// Default preference: Lily, by voice_id or name (incl. partial). Never Adam.
function pickPreferredElVoice() {
  if (!TTS.elVoices.length) return null;
  // 1. by voice_id
  let hit = TTS.elVoices.find(v => v.voice_id === LILY_VOICE_ID);
  if (hit) return hit;
  // 2. exact name
  const order = ["lily", "rachel", "charlotte", "bella", "domi"];
  for (const name of order) {
    hit = TTS.elVoices.find(v => (v.name || "").toLowerCase() === name);
    if (hit) return hit;
  }
  // 3. partial name (catches "Lily — Soft Whisper" or similar)
  for (const name of order) {
    hit = TTS.elVoices.find(v => (v.name || "").toLowerCase().includes(name));
    if (hit) return hit;
  }
  // 4. anything but Adam
  hit = TTS.elVoices.find(v => (v.name || "").toLowerCase() !== "adam");
  if (hit) return hit;
  return TTS.elVoices[0];
}

async function elRestoreConnected() {
  // re-validate the key by listing voices; show connected UI on success
  const voices = await elFetchVoices(TTS.elKey);
  TTS.elVoices = voices;
  ensureLilyInVoices();
  // FORCE Lily as the unified key — overwrite any stale selection (e.g. Adam).
  const lily = TTS.elVoices.find(v => v.voice_id === LILY_VOICE_ID || (v.name || "").toLowerCase() === "lily");
  if (lily) localStorage.setItem("motu.tts.unifiedKey", `elevenlabs:${lily.voice_id}`);
  document.getElementById("elDisconnected").hidden = true;
  document.getElementById("elKeyRow").hidden = true;
  document.getElementById("elConnected").hidden = false;
  document.querySelectorAll("input[name='elModel']").forEach(r => r.checked = (r.value === TTS.elModel));
  populateVoiceSelect();

  // Lily is the project's representative voice. ALWAYS default to her on
  // every connect/restore. Within-session dropdown changes still apply,
  // but the next reload resets to Lily.
  const pref = pickPreferredElVoice();
  const sel = document.getElementById("voiceSelect");
  if (pref) {
    sel.value = `elevenlabs:${pref.voice_id}`;
    applyVoiceSelection(sel.value);
  }
  await refreshElQuota();
}

async function elFetchVoices(key) {
  const resp = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key, "Accept": "application/json" },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  // sort: premade first, then user-cloned; alphabetical within each
  const list = (data.voices || []).slice().sort((a, b) => {
    const ka = a.category === "premade" ? 0 : 1;
    const kb = b.category === "premade" ? 0 : 1;
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name);
  });
  return list;
}
async function refreshElQuota() {
  if (!TTS.elKey) return;
  try {
    const resp = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": TTS.elKey, "Accept": "application/json" },
    });
    if (!resp.ok) return;
    const data = await resp.json();
    TTS.elQuota = { used: data.character_count, limit: data.character_limit };
    const el = document.getElementById("elQuota");
    if (el) {
      const remaining = data.character_limit - data.character_count;
      el.textContent = `${remaining.toLocaleString()} / ${data.character_limit.toLocaleString()} chars left`;
    }
  } catch (e) { /* non-fatal */ }
}

function ttsPreview() {
  startSpeech(
    "The library is open. Begin where curiosity invites you, and the rest will arrange itself.",
    document.getElementById("previewVoice")
  );
}

function bindTTSButtons() {
  document.querySelectorAll(".tts-btn[data-tts-source]").forEach(btn => {
    btn.addEventListener("click", () => handleTTSButtonClick(btn, () => {
      const entry = currentEntry();
      if (!entry) return null;
      return entryToReadable(entry, btn.dataset.ttsSource);
    }));
  });
  // stop buttons live next to the play buttons
  document.querySelectorAll("[data-tts-stop]").forEach(stopBtn => {
    stopBtn.addEventListener("click", () => stopSpeech());
  });
}

// Centralised click handler — same button cycles play → pause → resume.
function handleTTSButtonClick(btn, textProvider) {
  if (TTS.currentBtn === btn) {
    if (TTS.paused) { resumeSpeech(); return; }
    if (TTS.playing) { pauseSpeech(); return; }
  }
  const text = textProvider();
  if (!text) {
    console.warn("[TTS] textProvider returned empty — entry may be unloaded");
    return;
  }
  // Manual clicks always toast on failure and bypass any quota-skip flag.
  startSpeech(text, btn, { manual: true });
}

function setupSettingsPanel() {
  // open
  document.getElementById("btn-settings").addEventListener("click", () => {
    document.getElementById("modal-settings").hidden = false;
    refreshElQuota();
  });
  // unified voice picker — works within this session, but next reload still resets to Lily
  document.getElementById("voiceSelect").addEventListener("change", (e) => {
    applyVoiceSelection(e.target.value);
  });

  // ElevenLabs flow
  document.getElementById("elConnect").addEventListener("click", elConnectFlow);
  document.getElementById("elKeyCancel").addEventListener("click", elCancelConnect);
  document.getElementById("elKeySave").addEventListener("click", elSaveKey);
  document.getElementById("elDisconnect").addEventListener("click", elDisconnect);
  document.getElementById("elKey").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); elSaveKey(); }
  });
  document.querySelectorAll("input[name='elModel']").forEach(radio => {
    radio.checked = (radio.value === TTS.elModel);
    radio.addEventListener("change", () => {
      if (radio.checked) {
        TTS.elModel = radio.value;
        localStorage.setItem("motu.tts.elModel", radio.value);
      }
    });
  });

  // If an ElevenLabs key was persisted, restore the connected state
  if (TTS.elKey) {
    elRestoreConnected().catch(() => {
      // key may be stale — show as disconnected and let user re-enter
      TTS.elKey = "";
      localStorage.removeItem("motu.tts.elKey");
    });
  }
  // rate
  const rate = document.getElementById("rateRange");
  rate.value = TTS.rate;
  document.getElementById("rateValue").textContent = `${TTS.rate.toFixed(2)}×`;
  rate.addEventListener("input", (e) => {
    TTS.rate = parseFloat(e.target.value);
    document.getElementById("rateValue").textContent = `${TTS.rate.toFixed(2)}×`;
    localStorage.setItem("motu.tts.rate", String(TTS.rate));
    // live update if currently playing
    if (TTS.audio && TTS.engine === "elevenlabs") {
      TTS.audio.playbackRate = Math.max(0.5, Math.min(2.0, TTS.rate * TTS.pitch));
    }
  });
  // pitch
  const pitch = document.getElementById("pitchRange");
  pitch.value = TTS.pitch;
  document.getElementById("pitchValue").textContent = TTS.pitch.toFixed(2);
  pitch.addEventListener("input", (e) => {
    TTS.pitch = parseFloat(e.target.value);
    document.getElementById("pitchValue").textContent = TTS.pitch.toFixed(2);
    localStorage.setItem("motu.tts.pitch", String(TTS.pitch));
    // live update if currently playing
    if (TTS.audio && TTS.engine === "elevenlabs") {
      TTS.audio.playbackRate = Math.max(0.5, Math.min(2.0, TTS.rate * TTS.pitch));
    }
  });
  // preview & reset
  document.getElementById("previewVoice").addEventListener("click", ttsPreview);
  document.getElementById("resetWindows").addEventListener("click", () => {
    localStorage.removeItem("motu.win.guide");
    localStorage.removeItem("motu.win.planet");
    const guide = document.getElementById("guide");
    const planet = document.getElementById("planetPanel");
    if (guide) resetDragPos(guide);
    if (planet) resetDragPos(planet);
    toast("window positions reset");
  });

  document.getElementById("resetVoice").addEventListener("click", () => {
    TTS.rate = 1.0; TTS.pitch = 1.0;
    localStorage.removeItem("motu.tts.rate");
    localStorage.removeItem("motu.tts.pitch");
    localStorage.removeItem("motu.tts.voiceURI");
    rate.value = 1.0; pitch.value = 1.0;
    document.getElementById("rateValue").textContent = "1.00×";
    document.getElementById("pitchValue").textContent = "1.00";
    // reload voices and reselect default
    loadVoices();
  });
}

/* ============================================================
   Background music — IndexedDB-cached library
   ------------------------------------------------------------
   Up to 10 distinct ambient loops are composed once via the
   ElevenLabs Music API and cached as Blobs in IndexedDB. On
   subsequent visits, no API calls are made — a random track
   is selected and autoplay is attempted (gesture-fallback).
   The controller exposes prev/next/shuffle/compose + a track
   list with delete.
   ============================================================ */

const MUSIC_PROMPTS = [
  { name: "Mystical Drift",     prompt: "Mystical New Age ambient. Sustained ethereal pads, soft bell tones, distant choral hums, gentle cosmic atmosphere. Vast and loopy. No drums, no vocals with lyrics." },
  { name: "Cosmic Ocean",       prompt: "Vast cosmic ocean ambient. Watery synth pads drifting in slow waves, soft bell pings, distant low hum. Tranquil, hypnotic. No drums." },
  { name: "Sacred Geometry",    prompt: "Sacred geometry tones. Sine wave drones at low frequency, occasional crystal cluster chimes, slow breathing pad. Meditative." },
  { name: "Inner Cosmos",       prompt: "Inner cosmos meditation. Singing bowls, sustained drone, soft wind, distant gentle bells. Spacious and contemplative." },
  { name: "Star Nursery",       prompt: "Star nursery ambient. Twinkling harmonic chimes, low cello-like pad, gentle sweeping arpeggios. Dreamy and weightless." },
  { name: "Crystal Cave",       prompt: "Crystal cave reverb. Echoing bell tones, deep harmonic pad, occasional soft glissando, faint dripping water. Reflective." },
  { name: "Vapor Dream",        prompt: "Ethereal vapor dream. Floating wordless vocal pads, ambient bell harmonics, harp glissandos. Weightless and slow." },
  { name: "Slow Pulse",         prompt: "Slow ambient cosmic drone. Deep low pads, slow shimmering bell tones, atmospheric whoosh. Meditative pulse." },
  { name: "Aurora",             prompt: "Aurora flow. Synth pad sweeps in slow waves, gentle high glissando, sub-bass hum. Otherworldly cool color." },
  { name: "Third Eye",          prompt: "Third eye opening. Sine wave foundation, occasional crystal bell, faint choir distant, indigo mood. Deep meditation." },
];

const MUSIC = {
  audio: null,
  library: [],            // [{ id, name, prompt, blobUrl, createdAt }]
  currentIdx: -1,
  composing: false,
  volume: parseFloat(localStorage.getItem("motu.music.volume") || "0.40"),
  autoplayAttempted: false,
};

const DB_NAME = "motu-music";
const DB_STORE = "loops";

function openMusicDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function loadMusicLibrary() {
  try {
    const db = await openMusicDB();
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const records = await new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
    MUSIC.library = records.map(r => ({
      id: r.id, name: r.name, prompt: r.prompt,
      blobUrl: URL.createObjectURL(r.blob),
      createdAt: r.createdAt,
    })).sort((a, b) => a.createdAt - b.createdAt);
  } catch (e) {
    console.warn("[music] cannot open library:", e?.message || e);
  }
}
async function saveMusicLoop(record, blob) {
  try {
    const db = await openMusicDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({
      id: record.id, name: record.name, prompt: record.prompt,
      blob, createdAt: record.createdAt,
    });
    await new Promise(r => tx.oncomplete = r);
  } catch (e) {
    console.warn("[music] save failed:", e?.message || e);
  }
}
async function deleteMusicLoop(id) {
  try {
    const db = await openMusicDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    await new Promise(r => tx.oncomplete = r);
  } catch (e) {}
}

async function setupMusic() {
  document.getElementById("musicMini").addEventListener("click", () => {
    const exp = document.getElementById("musicExpand");
    exp.hidden = !exp.hidden;
  });
  document.getElementById("musicPlay").addEventListener("click", musicTogglePlay);
  document.getElementById("musicPrev").addEventListener("click", () => switchTrack(-1));
  document.getElementById("musicNext").addEventListener("click", () => switchTrack(+1));
  document.getElementById("musicCompose").addEventListener("click", composeMusic);
  document.getElementById("musicShuffle").addEventListener("click", () => pickRandomTrack(true));
  const vol = document.getElementById("musicVolume");
  vol.value = MUSIC.volume;
  vol.addEventListener("input", (e) => {
    MUSIC.volume = parseFloat(e.target.value);
    if (MUSIC.audio) MUSIC.audio.volume = MUSIC.volume;
    localStorage.setItem("motu.music.volume", String(MUSIC.volume));
  });

  await loadMusicLibrary();
  renderTrackList();

  if (MUSIC.library.length > 0) {
    // Pick a random loop and autoplay (subject to autoplay policy).
    pickRandomTrack(false);
    attemptAutoplay();
  } else {
    setMusicHint("click + compose to add your first loop · stays cached forever");
  }
}

function attemptAutoplay() {
  if (!MUSIC.audio || MUSIC.autoplayAttempted) return;
  MUSIC.autoplayAttempted = true;
  MUSIC.audio.play().then(() => {
    document.getElementById("musicMini").classList.add("playing");
    setMusicPlayIcon(false);
  }).catch(() => {
    // Autoplay blocked — wait for first user gesture
    setMusicHint("click anywhere to start the loop");
    const start = () => {
      if (!MUSIC.audio || MUSIC.userPaused) return;
      MUSIC.audio.play().then(() => {
        if (MUSIC.userPaused) { MUSIC.audio.pause(); return; }
        document.getElementById("musicMini").classList.add("playing");
        setMusicPlayIcon(false);
        setMusicHint("");
      }).catch(() => {});
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
  });
}

function pickRandomTrack(playImmediately) {
  if (MUSIC.library.length === 0) return;
  const newIdx = Math.floor(Math.random() * MUSIC.library.length);
  loadTrack(newIdx, playImmediately);
}
function switchTrack(delta) {
  if (MUSIC.library.length === 0) return;
  let idx = MUSIC.currentIdx + delta;
  if (idx < 0) idx = MUSIC.library.length - 1;
  if (idx >= MUSIC.library.length) idx = 0;
  loadTrack(idx, true);
}
function loadTrack(idx, playImmediately) {
  if (idx < 0 || idx >= MUSIC.library.length) return;
  // dispose previous
  if (MUSIC.audio) { try { MUSIC.audio.pause(); } catch (_) {} MUSIC.audio = null; }
  MUSIC.currentIdx = idx;
  const track = MUSIC.library[idx];
  MUSIC.audio = new Audio(track.blobUrl);
  MUSIC.audio.loop = true;
  MUSIC.audio.volume = MUSIC.volume;
  setMusicTrackName(track.name);
  renderTrackList();
  if (playImmediately && !MUSIC.userPaused) {
    MUSIC.audio.muted = false;
    MUSIC.audio.play().then(() => {
      document.getElementById("musicMini").classList.add("playing");
      setMusicPlayIcon(false);
      setMusicHint("");
    }).catch(() => setMusicHint("click anywhere to start"));
  } else if (MUSIC.userPaused) {
    setMusicPlayIcon(true);
  }
}

async function composeMusic() {
  if (!TTS.elKey) { toast("connect ElevenLabs in Settings first"); return; }
  if (MUSIC.composing) return;
  if (MUSIC.library.length >= MUSIC_PROMPTS.length) {
    toast(`library full (${MUSIC_PROMPTS.length} loops). delete one first.`);
    return;
  }
  // Pick the next unused prompt in order
  const used = new Set(MUSIC.library.map(t => t.name));
  const promptEntry = MUSIC_PROMPTS.find(p => !used.has(p.name)) || MUSIC_PROMPTS[0];
  MUSIC.composing = true;
  setMusicHint(`composing "${promptEntry.name}"… (~30s)`);
  document.getElementById("musicCompose").disabled = true;
  try {
    const resp = await fetch("https://api.elevenlabs.io/v1/music/compose", {
      method: "POST",
      headers: {
        "xi-api-key": TTS.elKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        prompt: promptEntry.prompt,
        music_length_ms: 120000,
        output_format: "mp3_44100_128",
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`API ${resp.status}: ${txt.slice(0, 140)}`);
    }
    const blob = await resp.blob();
    const record = {
      id: `loop-${Date.now().toString(36)}`,
      name: promptEntry.name,
      prompt: promptEntry.prompt,
      createdAt: Date.now(),
    };
    await saveMusicLoop(record, blob);
    const entry = {
      ...record,
      blobUrl: URL.createObjectURL(blob),
    };
    MUSIC.library.push(entry);
    renderTrackList();
    loadTrack(MUSIC.library.length - 1, true);
    setMusicHint(`✦ added "${entry.name}" (${MUSIC.library.length}/${MUSIC_PROMPTS.length})`);
  } catch (err) {
    console.warn("[music] compose failed", err);
    setMusicHint(`failed: ${err.message?.slice(0,40) || "unknown"}`);
    toast(`music: ${err.message?.slice(0,80) || "compose failed"}`);
  } finally {
    MUSIC.composing = false;
    document.getElementById("musicCompose").disabled = false;
  }
}

function musicPlay() {
  MUSIC.userPaused = false;
  if (!MUSIC.audio) {
    // No live audio element (either never created, or torn down by pause).
    // Recreate from the last-known track index; if none, pick at random.
    if (MUSIC.library.length === 0) { toast("compose a loop first (+)"); return; }
    const idx = (MUSIC.currentIdx >= 0 && MUSIC.currentIdx < MUSIC.library.length)
      ? MUSIC.currentIdx
      : Math.floor(Math.random() * MUSIC.library.length);
    loadTrack(idx, true);
    return;
  }
  MUSIC.audio.muted = false;
  if (MUSIC.audio.paused) {
    MUSIC.audio.play().catch(() => {});
  }
  setMusicPlayIcon(false);
  document.getElementById("musicMini").classList.add("playing");
}
function musicPause() {
  // Nuclear pause: tear down the audio element entirely so no buffered
  // playback or racing .play() promise can keep producing sound.
  MUSIC.userPaused = true;
  if (MUSIC.audio) {
    try { MUSIC.audio.pause(); } catch (_) {}
    try { MUSIC.audio.muted = true; } catch (_) {}
    try { MUSIC.audio.src = ""; } catch (_) {}
    try { MUSIC.audio.load(); } catch (_) {}
    MUSIC.audio = null;
  }
  setMusicPlayIcon(true);
  document.getElementById("musicMini").classList.remove("playing");
}
function musicTogglePlay() {
  if (MUSIC.audio && !MUSIC.audio.paused) musicPause();
  else musicPlay();
}

function renderTrackList() {
  const list = document.getElementById("musicTracksList");
  const count = document.getElementById("musicTracksCount");
  if (!list || !count) return;
  list.innerHTML = "";
  count.textContent = `${MUSIC.library.length}/${MUSIC_PROMPTS.length} tracks`;
  MUSIC.library.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = i === MUSIC.currentIdx ? "active" : "";
    li.innerHTML = `<span style="flex:1">${escapeHtml(track.name)}</span><button class="track-delete" title="remove">✕</button>`;
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("track-delete")) return;
      loadTrack(i, true);
    });
    li.querySelector(".track-delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteMusicLoop(track.id);
      try { URL.revokeObjectURL(track.blobUrl); } catch (_) {}
      MUSIC.library.splice(i, 1);
      if (MUSIC.currentIdx === i) {
        if (MUSIC.audio) { try { MUSIC.audio.pause(); } catch (_) {} MUSIC.audio = null; }
        MUSIC.currentIdx = -1;
        setMusicTrackName("no track");
      } else if (MUSIC.currentIdx > i) {
        MUSIC.currentIdx -= 1;
      }
      renderTrackList();
    });
    list.appendChild(li);
  });
}

function setMusicPlayIcon(paused) {
  // Single toggle button: shows ❚❚ when playing (click to pause),
  // shows ▶ when paused (click to play).
  const playI  = document.querySelector("#musicPlay .music-icon-play");
  const pauseI = document.querySelector("#musicPlay .music-icon-pause");
  if (!playI || !pauseI) return;
  if (paused) { playI.hidden = false; pauseI.hidden = true; }
  else        { playI.hidden = true;  pauseI.hidden = false; }
}
function setMusicTrackName(name) {
  const el = document.getElementById("musicTrackName");
  if (el) el.textContent = name || "—";
}
function setMusicHint(s) {
  const el = document.getElementById("musicHint");
  if (el) el.textContent = s || "";
}

/* ============================================================
   Dictionary — hover any word to define it, with audio
   ------------------------------------------------------------
   Uses dictionaryapi.dev (free, CORS-open). On toggle, mousemove
   over text triggers word-at-cursor detection via caret APIs;
   after a short dwell, fetch and show a popup with phonetic,
   audio MP3, and brief definition. Caches per-session in memory.
   ============================================================ */
const DICT = {
  enabled: localStorage.getItem("motu.dictionaryOn") === "true",
  cache: new Map(),
  currentWord: null,
  dwellTimer: null,
  stopwords: new Set([
    "the","a","an","and","or","but","of","in","on","at","to","for","with","by",
    "is","are","was","were","be","been","being","have","has","had","do","does","did",
    "will","would","could","should","may","might","must","can","this","that","these","those",
    "it","its","they","them","their","we","us","our","you","your","he","him","his","she","her",
    "i","me","my","as","if","so","than","then","when","while","also","into","from","not","no","yes",
  ]),
};

function setupDictionary() {
  const btn = document.getElementById("btn-dictionary");
  btn.addEventListener("click", toggleDictionary);
  applyDictionaryState();

  // mousemove with dwell detection — only when enabled
  document.addEventListener("mousemove", onDictMove);
  document.addEventListener("mouseleave", hideDictPopup);

  // close popup when user moves to a different area
  document.getElementById("dictAudioBtn").addEventListener("click", () => {
    if (DICT.lastAudio) { try { new Audio(DICT.lastAudio).play(); } catch (e) {} }
  });
}

function toggleDictionary() {
  DICT.enabled = !DICT.enabled;
  localStorage.setItem("motu.dictionaryOn", String(DICT.enabled));
  applyDictionaryState();
  toast(DICT.enabled ? "dictionary on — hover any word" : "dictionary off");
}

function applyDictionaryState() {
  const btn = document.getElementById("btn-dictionary");
  if (DICT.enabled) {
    document.body.classList.add("dictionary-on");
    btn.classList.add("active");
    btn.style.background = "rgba(167,139,250,0.28)";
    btn.style.borderColor = "var(--accent)";
  } else {
    document.body.classList.remove("dictionary-on");
    btn.classList.remove("active");
    btn.style.background = "";
    btn.style.borderColor = "";
    hideDictPopup();
  }
}

function onDictMove(e) {
  if (!DICT.enabled) return;
  // skip while inside the popup itself (so user can click audio)
  if (e.target.closest("#dictPopup")) return;
  clearTimeout(DICT.dwellTimer);
  DICT.dwellTimer = setTimeout(() => {
    const found = wordAtPoint(e.clientX, e.clientY);
    if (!found) { hideDictPopup(); return; }
    const word = sanitizeWord(found.word);
    if (!word || word.length < 3 || DICT.stopwords.has(word)) { hideDictPopup(); return; }
    if (word === DICT.currentWord) return;   // unchanged
    DICT.currentWord = word;
    showDictPopup(word, found.rect, e.clientX, e.clientY);
  }, 380);
}

function wordAtPoint(x, y) {
  let range;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
  }
  if (!range) return null;
  const node = range.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  // skip text inside interactive elements (buttons, inputs) — distracting
  const el = node.parentElement;
  if (!el || el.closest("button, input, textarea, select, .star-label, .tts-btn")) return null;
  const text = node.textContent;
  let start = range.startOffset, end = range.startOffset;
  // include letters, hyphens, apostrophes
  const isWord = (c) => /[\p{L}\p{N}'-]/u.test(c);
  while (start > 0 && isWord(text[start - 1])) start--;
  while (end < text.length && isWord(text[end])) end++;
  if (start === end) return null;
  const word = text.slice(start, end);
  // get bounding rect of the word so popup can position above it
  const r = document.createRange();
  r.setStart(node, start);
  r.setEnd(node, end);
  const rect = r.getBoundingClientRect();
  return { word, rect };
}

function sanitizeWord(w) {
  return w.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
}

function hideDictPopup() {
  const pop = document.getElementById("dictPopup");
  if (pop) pop.hidden = true;
  DICT.currentWord = null;
}

async function showDictPopup(word, wordRect, mouseX, mouseY) {
  const pop = document.getElementById("dictPopup");
  document.getElementById("dictWord").textContent = word;
  document.getElementById("dictPhonetic").textContent = "";
  document.getElementById("dictAudioBtn").hidden = true;
  document.getElementById("dictBody").textContent = "looking up…";
  pop.hidden = false;
  positionDictPopup(pop, wordRect, mouseX, mouseY);

  // fetch or return cached — only cache successful lookups so transient
  // failures (rate limits, network) can retry later instead of poisoning the cache.
  let data;
  if (DICT.cache.has(word)) {
    data = DICT.cache.get(word);
  } else {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!r.ok) { data = { error: r.status === 404 ? "no definition found" : `api ${r.status}` }; }
      else { data = await r.json(); }
    } catch (e) { data = { error: "lookup failed" }; }
    if (!data?.error) DICT.cache.set(word, data);
  }

  // race: if user moved on already, don't overwrite the now-hidden popup
  if (DICT.currentWord !== word) return;

  if (data?.error) {
    document.getElementById("dictBody").innerHTML = `<span class="dict-error">${escapeHtml(data.error)}</span>`;
    return;
  }
  renderDictEntry(data);
}

function renderDictEntry(data) {
  const entry = Array.isArray(data) ? data[0] : data;
  if (!entry) return;
  // phonetic + audio
  const phonetic = entry.phonetic || (entry.phonetics || []).find(p => p.text)?.text || "";
  const audio = (entry.phonetics || []).find(p => p.audio)?.audio || null;
  document.getElementById("dictPhonetic").textContent = phonetic;
  const audioBtn = document.getElementById("dictAudioBtn");
  if (audio) {
    audioBtn.hidden = false;
    DICT.lastAudio = audio;
  } else {
    audioBtn.hidden = true;
    DICT.lastAudio = null;
  }
  // up to 2 meanings, first 1 definition each
  const meanings = (entry.meanings || []).slice(0, 2);
  const body = document.getElementById("dictBody");
  body.innerHTML = "";
  for (const m of meanings) {
    const def = (m.definitions || [])[0];
    if (!def) continue;
    const wrap = document.createElement("div");
    wrap.className = "dict-meaning";
    wrap.innerHTML = `<span class="dict-pos">${escapeHtml(m.partOfSpeech || "")}</span>${escapeHtml(def.definition || "")}${def.example ? `<div class="dict-example">"${escapeHtml(def.example)}"</div>` : ""}`;
    body.appendChild(wrap);
  }
}

function positionDictPopup(pop, wordRect, mouseX, mouseY) {
  pop.style.left = "0px"; pop.style.top = "0px";
  // measure
  const w = pop.offsetWidth, h = pop.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  // prefer above the word
  let x = (wordRect.left + wordRect.right) / 2 - w / 2;
  let y = wordRect.top - h - 8;
  if (y < 8) y = wordRect.bottom + 8;   // flip below if no room above
  x = Math.max(8, Math.min(vw - w - 8, x));
  y = Math.max(8, Math.min(vh - h - 8, y));
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
}

/* ============================================================
   "Did you know" — incidental knowledge surfacing
   ------------------------------------------------------------
   Every ~45s of idle galaxy time, a card surfaces a short fact
   drawn from a random topic's findings or conclusion-list items.
   Click "another" to cycle, "→ visit" to warp, "✕" to dismiss.
   ============================================================ */

const DYK = {
  shownThisSession: new Set(),
  current: null,         // { topic, fact }
  nextScheduledAt: 0,
  visible: false,
  autoHideTimer: null,
};

function setupDidYouKnow() {
  document.getElementById("dykClose").addEventListener("click", () => hideDYK(true));
  document.getElementById("dykNext").addEventListener("click", () => surfaceDYK());
  document.getElementById("dykVisit").addEventListener("click", () => {
    if (!DYK.current) return;
    const id = DYK.current.topic.id;
    hideDYK(false);
    navigateToHit({ id, kind: "topic", name: DYK.current.topic.name });
  });

  // first card after 30s; subsequent every ~45-90s
  DYK.nextScheduledAt = performance.now() + 30_000;
  setInterval(maybeTickDYK, 2500);
}

function maybeTickDYK() {
  if (state.mode !== "galaxy") return;
  if (DYK.visible) return;
  // Don't fire while user is actively interacting (drag, scroll)
  if (performance.now() - state.lastInteract < 3000) return;
  if (performance.now() < DYK.nextScheduledAt) return;
  surfaceDYK();
}

function surfaceDYK() {
  const pick = pickRandomFact();
  if (!pick) return;
  DYK.current = pick;
  document.getElementById("dykTopic").textContent = pick.topic.name;
  document.getElementById("dykBody").textContent = pick.fact;
  const card = document.getElementById("didYouKnow");
  card.hidden = false;
  DYK.visible = true;
  // accent the topic-color on the eyebrow dot via inline border
  card.style.borderColor = pick.topic.color;
  clearTimeout(DYK.autoHideTimer);
  DYK.autoHideTimer = setTimeout(() => hideDYK(true), 22_000);
}

function hideDYK(rescheduleSoon) {
  const card = document.getElementById("didYouKnow");
  if (card) card.hidden = true;
  DYK.visible = false;
  clearTimeout(DYK.autoHideTimer);
  // schedule the next surface: 45-90s away, slightly randomized
  DYK.nextScheduledAt = performance.now() + (rescheduleSoon ? 45_000 : 60_000) + Math.random() * 30_000;
}

function pickRandomFact() {
  // shuffle a candidate pool of all (topic, fact) tuples and find the first unseen one
  const pool = [];
  for (const t of TOPICS) {
    for (const f of factsFor(t)) pool.push({ topic: t, fact: f });
  }
  if (pool.length === 0) return null;
  // shuffle in place using fisher-yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // skip ones already shown this session unless pool is exhausted
  for (const candidate of pool) {
    const key = candidate.topic.id + "::" + candidate.fact.slice(0, 40);
    if (!DYK.shownThisSession.has(key)) {
      DYK.shownThisSession.add(key);
      return candidate;
    }
  }
  // exhausted — reset and re-pick
  DYK.shownThisSession.clear();
  return pool[0];
}

/* Harvest a topic's short surprising lines from its existing content. */
function factsFor(topic) {
  const facts = [];
  for (const node of topic.conclusionBody || []) {
    if (node.type === "ul") {
      for (const item of node.items) {
        if (item && item.length >= 40 && item.length <= 260) facts.push(item);
      }
    }
  }
  for (const doc of topic.documents || []) {
    for (const f of (doc.findings || [])) {
      if (f && f.length >= 40 && f.length <= 260) facts.push(f);
    }
  }
  return facts;
}

function attachUI() {
  // Inline rename: click the planet title to edit. Enter or blur commits; Esc cancels.
  setupTitleRename();

  // Surface mode — click planet to descend
  setupSurfaceMode();

  document.getElementById("btn-return-galaxy").addEventListener("click", () => {
    // dynamic: in moon → planet; in planet → galaxy
    if (state.currentMoon) returnToPlanet();
    else returnToGalaxy();
  });
  document.getElementById("btn-about").addEventListener("click", () => document.getElementById("modal-about").hidden = false);
  document.getElementById("btn-keys").addEventListener("click", () => document.getElementById("modal-keys").hidden = false);
  document.getElementById("btn-wander").addEventListener("click", () => {
    // wander — warp to a random topic for serendipitous discovery
    const pool = TOPICS.filter(t => t && !t.parentId);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (state.mode === "planet" || state.mode === "moon") {
      returnToGalaxy();
      setTimeout(() => enterPlanet(pick.id), 700);
    } else {
      enterPlanet(pick.id);
    }
    toast(`wandering to ${pick.name}`);
  });
  document.getElementById("btn-reset-view").addEventListener("click", () => {
    state.cameraTargetPos = new THREE.Vector3(0, 6, 36);
    state.cameraTargetLook = new THREE.Vector3(0, 0, 0);
    state.mode = "transit";
    state.afterTransit = "galaxy";
  });
  // multi-star fusion HUD
  document.getElementById("selectionClear").addEventListener("click", clearStarSelection);
  document.getElementById("selectionFuse").addEventListener("click", fireMultiFusion);
  document.getElementById("customTitleBtn").addEventListener("click", () => {
    const v = document.getElementById("customTitleInput").value.trim();
    if (v) commitTitleChoice(v);
  });
  document.getElementById("customTitleInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = e.target.value.trim();
      if (v) commitTitleChoice(v);
    }
  });
  document.getElementById("titleDeclineBtn").addEventListener("click", declineGeneration);
  // setup the delete button too
  setupDeleteEntry();

  document.getElementById("btn-collide").addEventListener("click", () => {
    if (state.mode !== "galaxy") {
      toast("collide from the galaxy view");
      return;
    }
    if (state.collideMode) { exitCollideMode(); }
    else { enterCollideMode(); }
  });
  document.getElementById("btn-toggle-edges").addEventListener("click", () => {
    state.edgesVisible = !state.edgesVisible;
    state.edgeLines.visible = state.edgesVisible && state.mode === "galaxy";
  });

  // planet menu — pass either topic or focused moon
  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const entry = currentEntry();
      if (!entry) return;
      if (action === "conclusion") openConclusion(entry);
      else if (action === "documents") openDocuments(entry);
      else if (action === "connections") openConnections(entry);
      else if (action === "ask-guide") {
        openGuide();
        // pre-seed an open question so the user has a productive starting point
        const input = document.getElementById("guideInput");
        if (input && !input.value) {
          input.value = `What's most worth knowing about ${entry.name}?`;
          input.focus();
          input.setSelectionRange(0, input.value.length);
        }
      }
      else if (action === "regenerate") regenerateEntry(entry);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(b => {
    b.addEventListener("click", closeAllModals);
  });
  // ESC closes modals AND clears multi-star selection
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
      if (state.selectedStars.size > 0) clearStarSelection();
    }
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      e.preventDefault();
      openGuide();
    }
    // Enter triggers fuse if 2+ selected
    if (e.key === "Enter" && state.selectedStars.size >= 2 && state.mode === "galaxy" && !e.target.matches("input, textarea")) {
      fireMultiFusion();
    }
  });

  // click outside modal closes
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => { if (e.target === m) closeAllModals(); });
  });

  // librarian
  setupLibrarianVoice();
  document.getElementById("guide-toggle").addEventListener("click", openGuide);
  document.getElementById("guide-close").addEventListener("click", closeGuide);
  document.getElementById("guideForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("guideInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendGuide(text);
  });
  document.getElementById("guideKeySave").addEventListener("click", () => {
    const key = document.getElementById("guideKey").value.trim();
    if (!key) return;
    state.guideKey = key;
    localStorage.setItem("motu.guideKey", key);
    document.getElementById("guideKeyRow").classList.add("hidden");
    addGuideMessage("bot", "Key saved locally. Ask me anything — the library is open.");
    toast("API key saved");
  });

  // initialize guide-key visibility
  if (state.guideKey) document.getElementById("guideKeyRow").classList.add("hidden");
  else document.getElementById("guideKeyRow").classList.remove("hidden");

  // search
  setupSearch();

  // incidental knowledge
  setupDidYouKnow();

  // dictionary hover
  setupDictionary();

  // background music
  setupMusic();

  // draggable windows
  setupDraggable(document.getElementById("guide"), document.getElementById("guideDragHandle"), "motu.win.guide");
  setupDraggable(document.getElementById("planetPanel"), document.getElementById("planetDragHandle"), "motu.win.planet");
}

/**
 * Make a window draggable. Position persists in localStorage.
 * Drag zones: the explicit header handle, plus a ~24px border around
 * the panel (every edge and corner). Interior is left alone for text
 * selection and button presses. Auto-recovers if a saved position
 * pushes the panel off-screen.
 */
const DRAG_EDGE = 24;

function setupDraggable(panel, handle, storageKey) {
  if (!panel) return;

  // Restore persisted position — but only if it's still on-screen.
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    const safeTop  = saved.top  >= -8 && saved.top  <= window.innerHeight - 30;
    const safeLeft = saved.left >= -400 && saved.left <= window.innerWidth - 80;
    if (safeTop && safeLeft) {
      applyDragPos(panel, saved.left, saved.top);
    } else {
      // stuck offscreen — drop the bad position so CSS defaults apply
      localStorage.removeItem(storageKey);
      resetDragPos(panel);
    }
  }

  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  let pid = null;

  function inExplicitHandle(target) {
    return handle && handle.contains(target);
  }
  function nearEdge(rect, e) {
    const x = e.clientX, y = e.clientY;
    return (x - rect.left) < DRAG_EDGE
        || (rect.right - x) < DRAG_EDGE
        || (y - rect.top) < DRAG_EDGE
        || (rect.bottom - y) < DRAG_EDGE;
  }
  function isInteractive(target) {
    return target.closest("button, input, textarea, select, a, label");
  }

  panel.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = panel.getBoundingClientRect();
    const inHandle = inExplicitHandle(e.target);
    const onEdge = nearEdge(rect, e);
    if (!inHandle && !onEdge) return;          // interior → don't drag
    if (isInteractive(e.target)) return;       // button / input anywhere → let it click, never drag
    dragging = true;
    pid = e.pointerId;
    panel.setPointerCapture(pid);
    panel.classList.add("dragging");
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    applyDragPos(panel, startLeft, startTop);
    e.preventDefault();
  });

  panel.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let nx = startLeft + dx;
    let ny = startTop + dy;
    const rect = panel.getBoundingClientRect();
    const w = rect.width;
    // clamp generously — at least 80px of width and 30px of height remain reachable
    nx = Math.max(-w + 80, Math.min(window.innerWidth - 80, nx));
    ny = Math.max(0, Math.min(window.innerHeight - 30, ny));
    applyDragPos(panel, nx, ny);
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { panel.releasePointerCapture(pid); } catch (_) {}
    pid = null;
    panel.classList.remove("dragging");
    const rect = panel.getBoundingClientRect();
    localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
  };
  panel.addEventListener("pointerup", endDrag);
  panel.addEventListener("pointercancel", endDrag);
}

function resetDragPos(panel) {
  panel.style.left = "";
  panel.style.top = "";
  panel.style.right = "";
  panel.style.bottom = "";
  panel.style.transform = "";
}

function applyDragPos(panel, left, top) {
  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.transform = "none";
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 2200);
}

/* ============================================================
   AI Guide
   ============================================================ */
function openGuide() {
  document.getElementById("guide").hidden = false;
  document.getElementById("guide-toggle").classList.add("hidden");
  document.getElementById("guideInput").focus();
}
function closeGuide() {
  document.getElementById("guide").hidden = true;
  document.getElementById("guide-toggle").classList.remove("hidden");
}
function updateGuideContext(label) {
  const el = document.getElementById("guideContext");
  if (el) el.textContent = label;
}

function addGuideMessage(role, content, opts = {}) {
  const body = document.getElementById("guideBody");
  const msg = document.createElement("div");
  msg.className = "guide-msg guide-msg-" + (role === "user" ? "user" : "bot");
  const glyph = document.createElement("div");
  glyph.className = "guide-msg-glyph";
  glyph.textContent = role === "user" ? "·" : "✦";
  const c = document.createElement("div");
  c.className = "guide-msg-content";
  c.innerHTML = role === "bot" ? renderGuideMarkdown(content) : `<p>${escapeHtml(content)}</p>`;
  // attach nav suggestion clicks
  if (opts.navId) {
    const btn = document.createElement("button");
    btn.className = "nav-suggest";
    btn.textContent = `→ navigate to ${opts.navName ?? opts.navId}`;
    btn.addEventListener("click", () => {
      closeGuide();
      const r = resolveById(opts.navId);
      if (!r) return;
      setTimeout(() => {
        if (r.kind === "topic") {
          navigateToHit({ id: r.entry.id, kind: "topic", name: r.entry.name });
        } else {
          navigateToHit({ id: r.entry.id, kind: "moon", name: r.entry.name, parentId: r.parent.id });
        }
      }, 200);
    });
    c.appendChild(btn);
  }
  msg.appendChild(glyph);
  msg.appendChild(c);
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
  return msg;
}

function renderGuideMarkdown(text) {
  // tiny markdown: paragraphs, **bold**, *italic*
  const esc = escapeHtml(text);
  const inline = esc
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return inline.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

async function sendGuide(text, opts = {}) {
  addGuideMessage("user", text);
  state.guideHistory.push({ role: "user", content: text });
  persistGuideHistory();

  // After the reply is spoken, if voice mode is on, re-open the mic
  // so the conversation continues without a click.
  const continueVoiceTurn = () => {
    if (VOICE.voiceMode && !VOICE.listening) {
      setTimeout(() => startListening(), 300);
    }
  };
  const speak = (msg) => {
    if (opts.speakReply) speakLibrarianReply(msg, continueVoiceTurn);
    else continueVoiceTurn();
  };

  // try simple intent first — "take me to X"
  const navMatch = matchNavIntent(text);
  if (navMatch) {
    const tip = `Taking you to ${navMatch.name}. ${navMatch.summary}`;
    addGuideMessage("bot", tip, { navId: navMatch.id, navName: navMatch.name });
    speak(tip);
    return;
  }

  if (!state.guideKey) {
    const msg = "I need a Claude API key to answer freely. Paste one above — it stays in this browser only. Or ask me to take you to a specific topic and I'll navigate without an API.";
    addGuideMessage("bot", msg);
    speak(msg);
    return;
  }

  const typingEl = addTyping();
  try {
    const reply = await callClaude(text);
    typingEl.remove();
    const navTopic = detectReplyNav(reply);
    addGuideMessage("bot", reply, navTopic ? { navId: navTopic.id, navName: navTopic.name } : {});
    state.guideHistory.push({ role: "assistant", content: reply });
    persistGuideHistory();
    speak(reply);
  } catch (err) {
    typingEl.remove();
    const errMsg = `the line went quiet. ${err.message || "unknown error"}`;
    addGuideMessage("bot", errMsg);
    speak(errMsg);
  }
}

/* Strip the [[navigate:id]] markers and any markdown before speaking.
   onEnd fires only when the reply finishes naturally (not when interrupted). */
function speakLibrarianReply(text, onEnd) {
  const clean = text
    .replace(/\[\[navigate:[a-z0-9-]+\]\]/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
  if (!clean) { if (onEnd) onEnd(); return; }
  TTS.onComplete = onEnd || null;
  startSpeech(clean, null);
}

/* ============================================================
   Voice input (Speech Recognition) for The Librarian.
   Web Speech API — works in Chrome/Edge; gracefully disabled elsewhere.
   ============================================================ */
const VOICE = {
  recognition: null,
  listening: false,
  voiceMode: localStorage.getItem("motu.voiceMode") === "1",
};

function setupLibrarianVoice() {
  const btn = document.getElementById("guideMic");
  if (!btn) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btn.classList.add("unavailable");
    btn.title = "Voice input not supported in this browser (try Chrome or Edge)";
    btn.addEventListener("click", () => toast("Voice input requires Chrome or Edge"));
    return;
  }

  VOICE.recognition = new SR();
  VOICE.recognition.continuous = false;
  VOICE.recognition.interimResults = true;
  VOICE.recognition.lang = "en-US";

  const input = document.getElementById("guideInput");
  let finalText = "";

  VOICE.recognition.onresult = (e) => {
    let interim = "";
    finalText = "";
    for (const result of e.results) {
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    input.value = (finalText + " " + interim).trim();
  };

  VOICE.recognition.onerror = (e) => {
    console.warn("[STT] error", e.error);
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      toast("Microphone permission denied");
    }
    stopListening();
  };

  VOICE.recognition.onend = () => {
    const wasListening = VOICE.listening;
    stopListening();
    if (wasListening) {
      const text = input.value.trim();
      if (text) {
        input.value = "";
        sendGuide(text, { speakReply: true });
      } else if (VOICE.voiceMode) {
        // Silence in continuous voice mode — keep listening for the next turn
        setTimeout(() => startListening(), 250);
      }
    }
  };

  btn.addEventListener("click", () => {
    if (VOICE.listening) {
      VOICE.recognition.stop();
      return;
    }
    startListening();
  });

  // Voice mode toggle — continuous back-and-forth conversation
  const vmBtn = document.getElementById("guideVoiceMode");
  if (vmBtn) {
    if (VOICE.voiceMode) vmBtn.classList.add("active");
    vmBtn.addEventListener("click", () => {
      VOICE.voiceMode = !VOICE.voiceMode;
      localStorage.setItem("motu.voiceMode", VOICE.voiceMode ? "1" : "");
      vmBtn.classList.toggle("active", VOICE.voiceMode);
      if (VOICE.voiceMode) {
        toast("voice mode on — I'll listen after each reply");
        openGuide();
        startListening();
      } else {
        toast("voice mode off");
        if (VOICE.listening) VOICE.recognition.stop();
      }
    });
  }
}

function startListening() {
  if (VOICE.listening || !VOICE.recognition) return;
  openGuide();
  stopSpeech();                    // don't talk over the user
  try {
    VOICE.recognition.start();
    VOICE.listening = true;
    const btn = document.getElementById("guideMic");
    const input = document.getElementById("guideInput");
    if (btn) btn.classList.add("listening");
    if (input) { input.value = ""; input.placeholder = "listening…"; }
  } catch (e) {
    console.warn("[STT] start failed", e);
  }
}

function stopListening() {
  const btn = document.getElementById("guideMic");
  const input = document.getElementById("guideInput");
  VOICE.listening = false;
  if (btn) btn.classList.remove("listening");
  if (input) input.placeholder = "ask The Librarian…";
}

function addTyping() {
  const body = document.getElementById("guideBody");
  const el = document.createElement("div");
  el.className = "guide-typing";
  el.textContent = "the guide is consulting the archive";
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
}

function matchNavIntent(text) {
  const t = text.toLowerCase();
  const triggers = /(take me|go to|navigate|warp|jump|show|open)/i;
  if (!triggers.test(text)) return null;
  for (const item of allSearchable()) {
    if (t.includes(item.name.toLowerCase()) || t.includes(item.id)) return item.ref;
  }
  for (const item of allSearchable()) {
    for (const tag of (item.tags || [])) {
      if (t.includes(tag.toLowerCase())) return item.ref;
    }
  }
  return null;
}

function detectReplyNav(reply) {
  const m = reply.match(/\[\[navigate:([a-z0-9-]+)\]\]/i);
  if (!m) return null;
  const r = resolveById(m[1]);
  return r ? r.entry : null;
}

function buildGuideSystem() {
  const topicLines = TOPICS.map(t => `- ${t.id} — ${t.name}: ${t.summary}`).join("\n");
  const moonLines = Object.entries(SUB_TOPICS)
    .flatMap(([p, arr]) => arr.map(s => `  · ${s.id} (moon of ${p}) — ${s.name}: ${s.summary}`))
    .join("\n");
  return `You are "The Librarian" of "The Meaning of the Universe", a 3D research library organized as a galaxy. You help visitors navigate, summarize, and decide what to read next. Keep replies short (2-5 sentences), warm, and substantive — your voice will often be spoken aloud, so write prose suited for the ear, not just the eye. Avoid bullet points and markdown formatting in spoken sections.

When you recommend the user visit a specific topic or moon in the library, append a navigation cue on its own line: [[navigate:id]] — the front-end will turn that into a clickable warp button.

TOP-LEVEL TOPICS (stars):
${topicLines}

MOONS (orbit a parent star, accessible from inside that star):
${moonLines}

If the visitor's question is well-served by an existing entry, point them there. If it's outside the library's catalogue, say so plainly and mention they can use the search bar in the galaxy view — it will generate a new entry on the fly. Speak as a steward of a serious library, not a hype merchant.`;
}
/* Rebuilt at call time so the guide sees user-generated entries created during the session. */

/* ============================================================
   Search & AI generation
   ============================================================ */

function setupSearch() {
  // bind every .search form on the page (galaxy HUD + planet HUD)
  for (const form of document.querySelectorAll("form.search")) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector(".search-input");
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      // clear sibling inputs too so the next visible bar starts clean
      document.querySelectorAll(".search-input").forEach(el => { el.value = ""; });
      await handleSearch(q);
    });
  }
  document.getElementById("generationCancel").addEventListener("click", () => {
    state.generatingNow = false;
    document.getElementById("generation-overlay").hidden = true;
  });
}

async function handleSearch(query) {
  const hit = findLocalMatch(query);
  if (hit) {
    navigateToHit(hit);
    return;
  }
  if (!state.guideKey) {
    toast("No match found — connect The Librarian to generate new topics");
    openGuide();
    return;
  }
  await generateAndAddEntity(query);
}

function findLocalMatch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const qSlug = q.replace(/\s+/g, "-");
  const qWords = wordsOf(q);
  const items = allSearchable();
  let best = null, bestScore = 0;
  for (const item of items) {
    const name = item.name.toLowerCase();
    const id = item.id.toLowerCase();
    const nameWords = wordsOf(name);
    let score = 0;
    if (id === q || id === qSlug || name === q) score = 100;
    else if ((item.tags || []).some(t => t.toLowerCase() === q)) score = 80;
    // word-overlap with stemmed plurals — "world religion" matches "World Religions"
    // but "physics" does NOT match "astrophysics" (different stems entirely)
    else if (qWords.length > 0 && qWords.every(qw => nameWords.includes(qw))) score = 70;
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return bestScore >= 70 ? best : null;
}

function wordsOf(s) {
  const stem = (w) => w.replace(/(ies|es|s)$/i, "");
  return s.toLowerCase().split(/[\s\-_]+/).filter(Boolean).map(stem);
}

function navigateToHit(hit) {
  const goMoon = () => setTimeout(() => {
    const rec = state.moonMeshes.find(m => m.id === hit.id);
    if (rec) enterMoon(rec);
  }, 1400);

  if (hit.kind === "topic") {
    if (state.mode === "planet" || state.mode === "moon") {
      returnToGalaxy();
      setTimeout(() => enterPlanet(hit.id), 700);
    } else {
      enterPlanet(hit.id);
    }
  } else if (hit.kind === "moon") {
    if (state.currentTopic?.id === hit.parentId) {
      if (state.currentMoon) returnToPlanet();
      setTimeout(() => {
        const rec = state.moonMeshes.find(m => m.id === hit.id);
        if (rec) enterMoon(rec);
      }, 200);
    } else if (state.mode === "planet" || state.mode === "moon") {
      returnToGalaxy();
      setTimeout(() => { enterPlanet(hit.parentId); goMoon(); }, 700);
    } else {
      enterPlanet(hit.parentId);
      goMoon();
    }
  }
  toast(`→ ${hit.name}`);
}

async function generateAndAddEntity(query) {
  const token = ++state.genToken;   // drop stale results from rapid double-searches
  showGenerationOverlay(`searching for "${query}"`, "Consulting The Librarian");
  state.generatingNow = true;
  try {
    const result = await callClaudeForGeneration(query);
    if (token !== state.genToken) { hideGenerationOverlay(); return; }
    if (!state.generatingNow) return;

    if (result.parent) {
      // new moon under existing parent
      result.entity.parentId = result.parent;
      registerGeneratedMoon(result.entity);
      persistMoon(result.entity);
      showGenerationOverlay(`Navigating to ${result.entity.name}`, "arriving at a new moon…");
      setTimeout(() => {
        hideGenerationOverlay();
        if (state.currentTopic?.id === result.parent) {
          if (state.currentMoon) returnToPlanet();
          setTimeout(() => {
            buildMoons(state.currentTopic);
            setTimeout(() => {
              const rec = state.moonMeshes.find(m => m.id === result.entity.id);
              if (rec) { state.autoNarrateOnArrival = true; enterMoon(rec); }
            }, 100);
          }, 200);
        } else {
          if (state.mode === "planet" || state.mode === "moon") returnToGalaxy();
          setTimeout(() => {
            enterPlanet(result.parent);
            setTimeout(() => {
              const rec = state.moonMeshes.find(m => m.id === result.entity.id);
              if (rec) { state.autoNarrateOnArrival = true; enterMoon(rec); }
            }, 1500);
          }, state.mode === "galaxy" ? 0 : 700);
        }
      }, 900);
    } else {
      // new top-level topic
      const topic = result.entity;
      topic.position = findEmptyPosition();
      topic.size = topic.size || 0.9;
      registerGeneratedTopic(topic);
      persistTopic(topic);
      addTopicNode(topic);
      document.getElementById("topicCount").textContent = TOPICS.length;
      const docCount = TOPICS.reduce((a, t) => a + (t.documents?.length || 0), 0);
      document.getElementById("docCount").textContent = docCount;

      // Auto-apply the connections Opus suggested — no review interrupt.
      const suggested = (result.entity.connections || [])
        .filter(cid => topicById(cid) && cid !== topic.id);
      let added = 0;
      for (const cid of suggested) {
        if (registerGeneratedEdge(topic.id, cid)) {
          persistEdge(topic.id, cid);
          added++;
        }
      }
      if (added > 0) rebuildEdges();

      showGenerationOverlay(`Navigating to ${topic.name}`, "warping toward a new star…");
      setTimeout(() => {
        hideGenerationOverlay();
        if (state.mode === "planet" || state.mode === "moon") returnToGalaxy();
        state.autoNarrateOnArrival = true;  // narrate the new star on arrival
        setTimeout(() => enterPlanet(topic.id), state.mode === "galaxy" ? 100 : 800);
      }, 900);
    }
  } catch (err) {
    // brief inline error before dismissing the overlay so user sees the failure
    showGenerationOverlay("generation failed", err.message?.slice(0, 100) || "unknown error");
    setTimeout(() => hideGenerationOverlay(), 2200);
    addGuideMessage("bot", `Generation failed: *${escapeHtml(err.message?.slice(0,140) || "unknown")}*\n\nThe model may have produced malformed JSON. Try a slightly different phrasing, or open the guide and ask there.`);
    openGuide();
  } finally {
    state.generatingNow = false;
  }
}

function showGenerationOverlay(title, sub) {
  document.getElementById("generationTitle").textContent = title;
  document.getElementById("generationSub").textContent = sub;
  document.getElementById("generation-overlay").hidden = false;
}
function hideGenerationOverlay() {
  document.getElementById("generation-overlay").hidden = true;
}

function buildGenerationSystem() {
  return `You expand a 3D research library called "The Meaning of the Universe". A visitor has searched for a topic that does not yet exist in the library. Generate one substantive new entry.

The library is organized at top level by clusters: metaphysics, physical, systems, humanity. Each top-level topic is a star. Stars may have orbiting moons (sub-topics).

EXISTING TOP-LEVEL TOPICS — use one of these ids as "parent" if the query is plausibly a sub-topic of it:
${TOPICS.map(t => `- ${t.id} — ${t.name}: ${t.summary}`).join("\n")}

EXISTING MOONS (do not regenerate — pick a new angle if the user query is too close):
${Object.entries(SUB_TOPICS).flatMap(([p, arr]) => arr.map(s => `- ${s.id} (moon of ${p})`)).join("\n")}

Decide:
(A) Query is clearly a sub-topic of one existing star → set "parent" to that star's id.
(B) Query is a new top-level area → set "parent" to null.

Available planet themes: grid (cyan wireframe), plasma (orange flares), mandala (gold sacred geometry), flow (green currents), crystal (purple faceted), gas (banded gas giant), cmb (cosmic web), circuit (electric).

Reply ONLY with valid JSON in this exact shape — no markdown fences, no prose:

{
  "parent": "existing-id-or-null",
  "entity": {
    "id": "kebab-case-id",
    "name": "Display Name",
    "color": "#hexcolor",
    "cluster": "metaphysics|physical|systems|humanity",
    "tags": ["tag1","tag2","tag3","tag4"],
    "summary": "one-sentence summary",
    "conclusion": "one-line distillation that is itself substantive",
    "conclusionBody": [
      {"type":"p","text":"opening paragraph framing the topic"},
      {"type":"h4","text":"what the field accepts"},
      {"type":"ul","items":["claim 1","claim 2","claim 3"]},
      {"type":"h4","text":"what is contested"},
      {"type":"ul","items":["open 1","open 2"]},
      {"type":"p","text":"closing honest distillation"}
    ],
    "planetTheme": {"type":"theme-name","params":{"hue":0.0,"accent":0.0,"density":1.0}},
    "connections": ["topic-id","topic-id"],
    "card": {
      "punchline": "One sharp sentence that lodges in memory. Italicized in the UI.",
      "propositions": [
        "3-5 dense declarative claims. Each its own load-bearing thought.",
        "Substance, not summary. Compressed. Specific.",
        "Earn the reader's next click.",
        "Each line scannable in 2-3 seconds."
      ],
      "hypotheses": [
        "2-3 if-then or open conjectures. 'If X, then Y' or 'What if X?'",
        "These should provoke, not declare."
      ],
      "facts": [
        "2-3 short surprising facts. Specific, named, dated where possible.",
        "Calibrated — not hyperbole, but the kind of fact a smart friend mentions in passing."
      ],
      "openQuestions": [
        "3-4 SHORT questions (8-15 words) about what scientists / scholars still don't fully understand in this domain.",
        "These are the rabbit holes — clickable in the UI, each one a doorway.",
        "Phrased like a curious friend asking — 'Why do octopus arms have their own neurons?' not 'On the question of peripheral neural decentralization in cephalopods'.",
        "Mix near-term empirical puzzles and deeper conceptual mysteries."
      ],
      "seeAlso": [
        {"id": "existing-topic-id", "name": "Topic Name", "why": "one-phrase reason this beckons"},
        {"id": "another-existing-id", "name": "Another", "why": "different angle on the same question"}
      ]
    },
    "sources": [
      {"label":"Author Year — Title (Venue)","url":"https://arxiv.org/abs/..."},
      {"label":"Author — Encyclopedia entry","url":"https://plato.stanford.edu/entries/..."}
    ],
    "documents": [
      {
        "id":"slug",
        "type":"survey|foundational|frontier|theoretical|historical|empirical|philosophical",
        "title":"Document Title",
        "author":"synthesis · 2026",
        "summary":"1-2 sentences",
        "findings":["finding","finding","finding"],
        "prose":["paragraph one","paragraph two","paragraph three","paragraph four"],
        "sources":[
          {"label":"Author Year — Title","url":"https://..."},
          {"label":"...","url":"https://..."}
        ]
      },
      {"id":"slug2","type":"...","title":"...","author":"...","summary":"...","findings":["..."],"prose":["...","...","..."],"sources":[{"label":"...","url":"..."}]}
    ]
  }
}

CRITICAL — CONNECTIONS:
For new TOP-LEVEL topics (parent = null), you MUST include a "connections" array with 2-4 ids of existing top-level topics this new topic genuinely connects to. Choose topics with real intellectual adjacency, not superficial keyword overlap. Empty array is acceptable only if the topic is truly isolated, which should be very rare. Moons (parent != null) do not need a "connections" array.

CRITICAL — SOURCES:
Every entity AND every document MUST include a "sources" array of real URLs. Use the papers provided in the user message AND any additional sources you find via web_search. Each source is { "label": "...", "url": "https://..." } where label is a short human-readable citation (Author Year — Title, or Encyclopedia entry, or Lecture/Talk title). URLs must be real, working, and direct — prefer arXiv abstract pages, journal/PubMed pages with open-access PDF, Stanford Encyclopedia of Philosophy entries, IEP entries, university course pages, established institutional publications. Avoid Wikipedia as a primary source (it can be one entry but not the only one). 3-6 sources per document, 4-8 at the topic level. Do not invent URLs — only use URLs from the provided papers or from your web_search results.

CRITICAL — INDEX CARD (the "card" field, the user's primary view):
The card is the user's main interface to this topic — what they see when they land on the planet. Treat it as notes on a 3x5 index card written by a brilliant older sibling explaining the subject at the dinner table. Maximum delivery, minimum filler.

- "punchline" — ONE sharp sentence that captures the topic's essential bite. Should lodge in memory.
- "propositions" — 4-5 declarative claims. Each load-bearing. Compressed. Specific. NOT a summary of the conclusion; each is its own dense thought.
- "hypotheses" — 2-3 open conjectures. "If X, then Y" or "What if X?" These should provoke a 'huh' from the reader and make them want to read more.
- "facts" — 2-3 short surprising facts. Specific, dated where possible (e.g. "In 1956, Shannon proved..."), named, calibrated. Not hyperbole — the kind of fact a smart friend mentions in passing.
- "seeAlso" — 4-6 navigation pills to OTHER existing topic ids. Each {id, name, why} where 'why' is a one-phrase tease ('the substrate problem', 'where this becomes empirical', etc.). USE THE USER LISTENING HISTORY IF PROVIDED — at least 2 of the seeAlso ids should be topics they've already listened to (familiar anchor), and 1-2 should be ones they have NOT yet (discovery). Only use ids of topics that ALREADY EXIST in the library (listed above). Do not invent ids.

The card is what persuades the user to dig deeper. It should feel like the library OFFERING ITSELF — there is more behind every line, and the see-also pills are doors.

═══════════════════════════════════════════════════════════════════
WRITING LEVEL — important:
═══════════════════════════════════════════════════════════════════
Write for a curious high-school sophomore (grade 10). The whole entry — every field, every document — should read this way.

- Plain words. Short sentences. Aim for an average of 12-18 words per sentence; mix short punchy ones with longer ones for rhythm.
- Avoid academic jargon unless you define it inline in plain English the first time. ("Anti-de Sitter space — a kind of curved geometry physicists use as a math sandbox.") No bare Latin. Replace "epistemological" with "about how we know things", "putative" with "claimed", "ontological" with "about what really exists".
- Concrete > abstract. Name people. Cite dates. Give one concrete example before generalizing.
- Research stays real — same names, dates, citation URLs, calibrated claims. Accessibility is in the WORDS, not the rigor.

═══════════════════════════════════════════════════════════════════
TONE — important:
═══════════════════════════════════════════════════════════════════
Less philosophy seminar, more curious science explainer. Think Bill Nye if he had a graduate degree — enthusiastic, factual, dialed back from campy. Add a sneaky, mysterious edge so the reader keeps thinking "wait, what?" and clicks deeper.

- Open with a SCENE or a STRIKING FACT, not a definition. "In 1956, Claude Shannon walked into a Bell Labs meeting with a chessboard…" beats "Information theory was founded in 1948 by…"
- Drop specific numbers, dated events, named experiments. They are the hooks.
- Tease mysteries you don't fully resolve: "Here's what nobody expected…" "But there's a twist…" "And this is where it gets weird…"
- Be sneaky: hint that there's more depth than this card can show. Leave doors ajar so the next click feels rewarded.
- Avoid "the philosophical question of…" "the nature of…" "the discourse around…" — wave those away. Lead with what HAPPENS, what's MEASURED, what's STILL UNKNOWN.
- "Substantive" and "accessible" are not opposites. Be both.

The library should feel like a friend who keeps saying "wait, you have to hear about this one" — and means it.

LENGTH:
Brief is better. Documents: 2-3 paragraphs each, 3-5 sentences per paragraph. Don't pad.

Two documents per entry. Real sources still required.`;
}

/* Pre-fetch papers from Semantic Scholar to ground Opus's generation in real sources. */
async function fetchSemanticScholar(query) {
  try {
    const fields = "title,abstract,authors.name,year,url,openAccessPdf,venue";
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=8&fields=${fields}`;
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.data || []).filter(p => p && p.title);
  } catch (e) {
    return [];
  }
}

function formatPapersForPrompt(papers) {
  if (!papers || papers.length === 0) return "";
  const lines = papers.slice(0, 8).map((p, i) => {
    const authors = (p.authors || []).slice(0, 3).map(a => a.name).join(", ");
    const more = (p.authors || []).length > 3 ? " et al." : "";
    const url = p.openAccessPdf?.url || p.url || "";
    const venue = p.venue ? ` · ${p.venue}` : "";
    const yr = p.year ? ` (${p.year})` : "";
    const abs = (p.abstract || "").trim().slice(0, 500);
    return `[P${i+1}] "${p.title}" — ${authors}${more}${yr}${venue}\nURL: ${url}${abs ? "\nAbstract: " + abs : ""}`;
  });
  return "Real papers fetched from Semantic Scholar (use these as grounding; cite them in the 'sources' fields):\n\n" + lines.join("\n\n");
}

async function callClaudeForGeneration(query) {
  // Pre-fetch real papers in parallel with no-op (so we don't block long if rate-limited)
  const papers = await Promise.race([
    fetchSemanticScholar(query),
    new Promise(r => setTimeout(() => r([]), 6000)),
  ]);
  const paperContext = formatPapersForPrompt(papers);
  const listenContext = listenContextForPrompt();
  const parts = [`Search query: "${query}"`];
  if (paperContext) parts.push(paperContext);
  if (listenContext) parts.push(listenContext);
  parts.push("Now use web_search if you need additional sources, then output the full JSON entry. The 'card' field is the load-bearing user surface — give it maximum delivery. Every document MUST include a 'sources' array of 3-6 real URLs.");
  const userMessage = parts.join("\n\n");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 12000,
      system: buildGenerationSystem(),
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`API ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  // multi-block response: filter to text blocks only and concatenate
  let text = (data.content || [])
    .filter(b => b.type === "text" && typeof b.text === "string")
    .map(b => b.text)
    .join("\n")
    .trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  // robustness: extract the largest {...} block
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) text = text.slice(first, last + 1);
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) {
    console.error("[generation] could not parse JSON. Raw text follows:\n", text);
    throw new Error("AI returned malformed JSON");
  }
  if (!parsed.entity?.id || !parsed.entity?.name) throw new Error("AI returned incomplete entry");
  if (parsed.parent && !topicById(parsed.parent)) parsed.parent = null;
  if (parsed.parent && !parsed.entity.orbit) {
    parsed.entity.orbit = {
      radius: 7 + Math.random() * 3,
      speed: 0.10 + Math.random() * 0.10,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.4,
    };
  }
  return parsed;
}

function findEmptyPosition() {
  let best = null, bestMinDist = -Infinity;
  for (let i = 0; i < 60; i++) {
    const r = 12 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const p = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.7,
      r * Math.cos(phi),
    ];
    let minD = Infinity;
    for (const t of TOPICS) {
      const dx = p[0] - t.position[0], dy = p[1] - t.position[1], dz = p[2] - t.position[2];
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < minD) minD = d;
    }
    if (minD > bestMinDist) { bestMinDist = minD; best = p; }
  }
  return best;
}

function addTopicNode(topic) {
  const node = makeTopicNode(topic);
  state.topicGroup.add(node);
  state.topicMeshes.set(topic.id, node);
  if (state.hitTargets) state.hitTargets.push(node.userData.hit);
  addStarLabel(topic);

  // bloom-in animation
  let s = 0.001;
  node.scale.setScalar(s);
  const tick = () => {
    s = Math.min(1, s + 0.05);
    node.scale.setScalar(s);
    if (s < 1) requestAnimationFrame(tick);
  };
  tick();
}

/* ============================================================
   Cannonball collision system — fire ideas at each other.
   Two stars collide, a poetic synthesis is born as a new star.
   ============================================================ */

function enterCollideMode() {
  state.collideMode = true;
  state.collideFirst = null;
  document.getElementById("btn-collide").classList.add("active");
  showCollideBanner("select the first idea");
  document.body.style.cursor = "crosshair";
}
function exitCollideMode() {
  state.collideMode = false;
  if (state.collideFirst) {
    const node = state.topicMeshes.get(state.collideFirst);
    if (node) node.userData.corona?.scale.set(node.userData.size * 10, node.userData.size * 10, 1);
  }
  state.collideFirst = null;
  document.getElementById("btn-collide").classList.remove("active");
  hideCollideBanner();
  document.body.style.cursor = "";
}
function showCollideBanner(text) {
  let b = document.getElementById("collideBanner");
  if (!b) {
    b = document.createElement("div");
    b.id = "collideBanner";
    b.className = "collide-banner";
    document.body.appendChild(b);
  }
  b.textContent = text;
  b.classList.remove("hidden");
}
function hideCollideBanner() {
  const b = document.getElementById("collideBanner");
  if (b) b.classList.add("hidden");
}

function showInsight(title, text, optsOrMs = {}) {
  // backwards compat: third arg used to be just durationMs (a number)
  const opts = (typeof optsOrMs === "number") ? { durationMs: optsOrMs } : (optsOrMs || {});
  const { durationMs = 13000, tags = [], permanent = false } = opts;

  let label = document.getElementById("insightLabel");
  if (!label) {
    label = document.createElement("div");
    label.id = "insightLabel";
    label.className = "insight-label";
    document.body.appendChild(label);
  }
  const tagButtons = (tags && tags.length > 0) ? `
    <div class="insight-tags">
      <span class="insight-tags-label">explore further</span>
      ${tags.slice(0, 5).map(t => `<button class="insight-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}
    </div>` : "";
  label.innerHTML = `<button class="insight-close" aria-label="close">✕</button><span class="insight-title">${escapeHtml(title)}</span>${escapeHtml(text)}${tagButtons}`;
  void label.offsetWidth;
  label.classList.remove("locked");
  label.classList.add("show");
  if (permanent) label.classList.add("locked");

  clearTimeout(state._insightTimer);
  if (!permanent) {
    state._insightTimer = setTimeout(() => {
      if (!label.classList.contains("locked")) label.classList.remove("show");
    }, durationMs);
  }
  // close button explicitly dismisses
  label.querySelector(".insight-close").addEventListener("click", (e) => {
    e.stopPropagation();
    label.classList.remove("show", "locked");
    clearTimeout(state._insightTimer);
  });
  // click body locks the insight open until user closes it with X
  label.addEventListener("click", (e) => {
    if (e.target.closest(".insight-close, .insight-tag")) return;
    label.classList.add("locked");
    clearTimeout(state._insightTimer);
  });
  // Tag buttons: dismiss the insight and trigger generation/navigation for that term
  for (const btn of label.querySelectorAll(".insight-tag")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      if (!tag) return;
      label.classList.remove("show", "locked");
      clearTimeout(state._insightTimer);
      // The tag-click logic already handles "match existing? warp : generate".
      handleTagClick(tag);
    });
  }
}

async function fireCollision(firstId, secondId) {
  const a = topicById(firstId), b = topicById(secondId);
  if (!a || !b) return;

  // start launching projectile visually
  const start = new THREE.Vector3(...a.position);
  const end = new THREE.Vector3(...b.position);
  const mesh = makeProjectile();
  mesh.position.copy(start);
  state.scene.add(mesh);

  // promise that resolves on arrival
  let onArrive;
  const arrived = new Promise(r => { onArrive = r; });
  state.projectiles.push({ mesh, start, end, progress: 0, duration: 1.6, onArrive });

  // kick off synthesis fetch in parallel
  const synthFetch = state.guideKey
    ? generateSynthesis(a, b).catch(e => ({ error: e }))
    : Promise.resolve({ error: new Error("Connect The Librarian to forge insights") });

  // wait for projectile arrival
  await arrived;
  state.scene.remove(mesh);
  spawnImpactFlash(end, a.color, b.color);

  // wait for synthesis to complete
  showCollideBanner("forging insight…");
  const result = await synthFetch;
  hideCollideBanner();

  if (result?.error) {
    toast(`collision dissipated: ${result.error.message?.slice(0,80) || "no synthesis"}`);
    return;
  }

  // Don't auto-create — let the learner choose whether to commit, and which title.
  showCollisionTitleChooser(a, b, result);
}

function showCollisionTitleChooser(a, b, result) {
  state.pendingCollision = { a, b, result };
  state.pendingFusion = null;

  document.getElementById("titleIntro").textContent =
    `A synthesis from ${a.name} × ${b.name}. Generate a new entry, or decline.`;

  const optsEl = document.getElementById("titleOptions");
  optsEl.innerHTML = "";
  const options = (Array.isArray(result.name_options) && result.name_options.length > 0)
    ? result.name_options.slice(0, 4)
    : (result.name ? [result.name] : [`${a.name} × ${b.name}`]);
  for (const name of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "title-option-btn";
    btn.textContent = name;
    btn.addEventListener("click", () => commitTitleChoice(name));
    optsEl.appendChild(btn);
  }
  document.getElementById("customTitleInput").value = "";

  // preview the synthesis
  document.getElementById("synthPunchline").textContent = result.summary || "";
  const propsUl = document.getElementById("synthPropositions");
  propsUl.innerHTML = "";
  for (const f of (result.findings || []).slice(0, 4)) {
    const li = document.createElement("li");
    li.textContent = f;
    propsUl.appendChild(li);
  }

  document.getElementById("modal-titleChooser").hidden = false;
}

function commitTitleChoice(chosenName) {
  if (state.pendingCollision) finalizeCollision(chosenName);
  else if (state.pendingFusion) finalizeFusion(chosenName);
}

function declineGeneration() {
  state.pendingCollision = null;
  state.pendingFusion = null;
  document.getElementById("modal-titleChooser").hidden = true;
  toast("declined — no entry generated");
}

function finalizeCollision(chosenName) {
  const pending = state.pendingCollision;
  state.pendingCollision = null;
  if (!pending) return;
  const { a, b, result } = pending;
  document.getElementById("modal-titleChooser").hidden = true;

  const midPos = [
    (a.position[0] + b.position[0]) / 2,
    (a.position[1] + b.position[1]) / 2 + 0.8,
    (a.position[2] + b.position[2]) / 2,
  ];

  const insightId = `insight-${a.id}-${b.id}-${Date.now().toString(36)}`;
  const insight = {
    id: insightId,
    name: chosenName,
    cluster: "metaphysics",
    color: blendColors(a.color, b.color),
    position: midPos,
    size: 0.75,
    tags: ["synthesis", a.name.toLowerCase(), b.name.toLowerCase()],
    summary: result.summary,
    conclusion: result.summary,
    conclusionBody: [
      { type: "p", text: result.summary },
      { type: "h4", text: "born of collision" },
      { type: "ul", items: [a.name, b.name] },
      { type: "p", text: result.expansion || "" },
    ],
    planetTheme: { type: "crystal", params: { hue: 0.78, accent: 0.92, facets: 7.0 } },
    documents: result.expansion ? [{
      id: `${insightId}-syn`,
      type: "synthesis",
      title: `${chosenName} — synthesis`,
      author: `forged from ${a.name} × ${b.name}`,
      summary: result.summary,
      findings: result.findings || [],
      prose: [result.expansion],
    }] : [],
    isSynthesis: true,
  };

  registerGeneratedTopic(insight);
  persistTopic(insight);
  addTopicNode(insight);

  if (registerGeneratedEdge(insight.id, a.id)) persistEdge(insight.id, a.id);
  if (registerGeneratedEdge(insight.id, b.id)) persistEdge(insight.id, b.id);
  rebuildEdges();

  document.getElementById("topicCount").textContent = TOPICS.length;
  const exploreTags = (Array.isArray(result.explore) && result.explore.length > 0)
    ? result.explore.slice(0, 5)
    : (insight.tags || []).filter(t => t && t.length >= 3 && t.length <= 28).slice(0, 5);
  showInsight(chosenName, result.summary, {
    permanent: true,
    tags: exploreTags,
  });
  state.autoNarrateOnArrival = true;
  setTimeout(() => enterPlanet(insight.id), 900);
}

function makeProjectile() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const haloMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(new THREE.Color("#ffffff")),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(1.8, 1.8, 1);
  group.add(core, halo);
  return group;
}

function advanceProjectiles(dt, t) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.progress += dt / p.duration;
    if (p.progress >= 1) {
      p.mesh.position.copy(p.end);
      if (p.onArrive) p.onArrive();
      state.projectiles.splice(i, 1);
      continue;
    }
    const e = p.progress * p.progress * (3 - 2 * p.progress);
    p.mesh.position.lerpVectors(p.start, p.end, e);
    // small slerp arc: lift slightly off the direct line
    const arc = Math.sin(p.progress * Math.PI) * 0.6;
    p.mesh.position.y += arc;
  }
}

function spawnImpactFlash(pos, colorA, colorB) {
  const flashColor = new THREE.Color(blendColors(colorA, colorB));
  const mat = new THREE.SpriteMaterial({
    map: makeGlowTexture(flashColor),
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.position.copy(pos);
  s.scale.set(0.5, 0.5, 1);
  state.scene.add(s);
  let p = 0;
  const tick = () => {
    p += 0.035;
    s.scale.setScalar(0.5 + p * 22);
    s.material.opacity = Math.max(0, 1 - p);
    if (p < 1) requestAnimationFrame(tick);
    else { state.scene.remove(s); s.material.dispose(); s.material.map.dispose(); }
  };
  tick();
}

function blendColors(a, b) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  const out = ca.clone().lerp(cb, 0.5);
  // brighten a touch so insights stand out
  out.r = Math.min(1, out.r * 1.15);
  out.g = Math.min(1, out.g * 1.15);
  out.b = Math.min(1, out.b * 1.15);
  return "#" + out.getHexString();
}

/* ============================================================
   Delete entry — remove from library with two-step confirmation
   ------------------------------------------------------------
   First click → "are you sure?" pulse. Second click within 6s
   commits. Confirmation auto-cancels after timeout. Persisted in
   localStorage motu.deletedTopics / motu.deletedMoons; applied
   on every boot via applyDeletions before visuals build.
   ============================================================ */
function setupDeleteEntry() {
  const btn = document.getElementById("planetDeleteBtn");
  if (!btn) return;
  let confirmTimer = null;
  btn.addEventListener("click", () => {
    const entry = currentEntry();
    if (!entry) return;
    if (btn.classList.contains("confirming")) {
      // committed
      clearTimeout(confirmTimer);
      btn.classList.remove("confirming");
      btn.textContent = "delete this entry";
      deleteEntry(entry);
    } else {
      // ask for confirmation
      btn.classList.add("confirming");
      btn.textContent = "are you sure? click again to confirm";
      confirmTimer = setTimeout(() => {
        btn.classList.remove("confirming");
        btn.textContent = "delete this entry";
      }, 6000);
    }
  });
}

/* Reset the delete button's state — called when a new entry is shown. */
function resetDeleteButton() {
  const btn = document.getElementById("planetDeleteBtn");
  if (!btn) return;
  btn.classList.remove("confirming");
  btn.textContent = "delete this entry";
}

function deleteEntry(entry) {
  persistDeletion(entry);

  if (entry.parentId) {
    // moon — remove from SUB_TOPICS
    const arr = SUB_TOPICS[entry.parentId];
    if (arr) {
      const idx = arr.findIndex(m => m.id === entry.id);
      if (idx >= 0) arr.splice(idx, 1);
    }
    // also dispose its moon mesh if currently rendered
    const recIdx = state.moonMeshes.findIndex(m => m.id === entry.id);
    if (recIdx >= 0) {
      const rec = state.moonMeshes[recIdx];
      state.scene.remove(rec.group);
      state.planetGroup.remove(rec.trail);
      try { rec.body.geometry.dispose(); rec.body.material.dispose(); } catch (_) {}
      try { rec.trail.geometry.dispose(); rec.trail.material.dispose(); } catch (_) {}
      try { rec.halo.material.map?.dispose(); rec.halo.material.dispose(); } catch (_) {}
      state.moonMeshes.splice(recIdx, 1);
    }
  } else {
    // top-level — remove from TOPICS
    const idx = TOPICS.findIndex(t => t.id === entry.id);
    if (idx >= 0) TOPICS.splice(idx, 1);
    // remove visual
    const node = state.topicMeshes.get(entry.id);
    if (node) {
      state.topicGroup.remove(node);
      state.topicMeshes.delete(entry.id);
      if (state.hitTargets) {
        const hi = state.hitTargets.indexOf(node.userData.hit);
        if (hi >= 0) state.hitTargets.splice(hi, 1);
      }
    }
    removeStarLabel(entry.id);
    // remove edges referencing this id
    for (let i = EDGES.length - 1; i >= 0; i--) {
      if (EDGES[i][0] === entry.id || EDGES[i][1] === entry.id) EDGES.splice(i, 1);
    }
    rebuildEdges();
    document.getElementById("topicCount").textContent = TOPICS.length;
  }

  toast(`"${entry.name}" deleted`);

  // Bounce out of the deleted entry
  if (state.currentMoon?.id === entry.id) {
    returnToPlanet();
  } else if (state.currentTopic?.id === entry.id) {
    returnToGalaxy();
  }
}

function persistDeletion(entry) {
  try {
    const key = entry.parentId ? "motu.deletedMoons" : "motu.deletedTopics";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    if (!arr.includes(entry.id)) arr.push(entry.id);
    localStorage.setItem(key, JSON.stringify(arr));

    // Also clean up: remove from user-generated lists if present
    const userKey = entry.parentId ? "motu.userMoons" : "motu.userTopics";
    const userArr = JSON.parse(localStorage.getItem(userKey) || "[]");
    const filteredUserArr = userArr.filter(t => t.id !== entry.id);
    if (filteredUserArr.length !== userArr.length) {
      localStorage.setItem(userKey, JSON.stringify(filteredUserArr));
    }

    // Remove any per-entry override
    localStorage.removeItem(`motu.override.${entry.id}`);

    // Remove edges from userEdges
    const edges = JSON.parse(localStorage.getItem("motu.userEdges") || "[]");
    const filteredEdges = edges.filter(([a, b]) => a !== entry.id && b !== entry.id);
    if (filteredEdges.length !== edges.length) {
      localStorage.setItem("motu.userEdges", JSON.stringify(filteredEdges));
    }
  } catch (e) { handleQuotaError(e); }
}

/* Apply deletions to in-memory data BEFORE buildTopicNodes runs. */
function applyDeletions() {
  let deletedTopics = new Set();
  let deletedMoons = new Set();
  try {
    deletedTopics = new Set(JSON.parse(localStorage.getItem("motu.deletedTopics") || "[]"));
    deletedMoons  = new Set(JSON.parse(localStorage.getItem("motu.deletedMoons")  || "[]"));
  } catch (e) {}
  // Filter top-level
  for (let i = TOPICS.length - 1; i >= 0; i--) {
    if (deletedTopics.has(TOPICS[i].id)) TOPICS.splice(i, 1);
  }
  // Filter moons
  for (const parentId of Object.keys(SUB_TOPICS)) {
    const arr = SUB_TOPICS[parentId];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (deletedMoons.has(arr[i].id)) arr.splice(i, 1);
    }
  }
  // Filter edges referencing any deleted topic
  for (let i = EDGES.length - 1; i >= 0; i--) {
    const [a, b] = EDGES[i];
    if (deletedTopics.has(a) || deletedTopics.has(b)) EDGES.splice(i, 1);
  }
}

/* ============================================================
   Rebuild this entry — regenerate a topic to current schema
   ------------------------------------------------------------
   Calls Opus with web search + Semantic Scholar grounding to
   produce a complete entry: card, sources, conclusionBody,
   2 full documents. Preserves visual identity (name, position,
   color, planetTheme) and overwrites content fields. Persists
   as a localStorage override keyed by topic id.
   ============================================================ */
async function regenerateEntry(entry) {
  if (!state.guideKey) {
    toast("connect The Librarian to rebuild entries (paste API key in guide)");
    openGuide();
    return;
  }
  const ok = window.confirm(`Rebuild "${entry.name}" with current standards — index card, real source citations, polished documents?\n\nThis calls Opus 4.7 with web search; typical cost ~$0.30 per topic.`);
  if (!ok) return;

  showGenerationOverlay(`rebuilding ${entry.name}`, "Consulting The Librarian");
  state.generatingNow = true;
  try {
    const updated = await callClaudeForRegen(entry);
    if (!state.generatingNow) return;
    // merge non-visual fields (preserve id, position, size, planetTheme, color, cluster, parentId)
    Object.assign(entry, {
      summary:        updated.summary        ?? entry.summary,
      conclusion:     updated.conclusion     ?? entry.conclusion,
      conclusionBody: updated.conclusionBody ?? entry.conclusionBody,
      tags:           updated.tags           ?? entry.tags,
      card:           updated.card           ?? entry.card,
      sources:        updated.sources        ?? entry.sources,
      documents:      updated.documents      ?? entry.documents,
    });
    persistOverride(entry);
    hideGenerationOverlay();
    populatePlanetHud(entry);
    toast(`✦ ${entry.name} rebuilt`);
  } catch (err) {
    hideGenerationOverlay();
    console.warn("[regenerate]", err);
    toast(`rebuild failed: ${err.message?.slice(0, 80) || "unknown"}`);
  } finally {
    state.generatingNow = false;
  }
}

async function callClaudeForRegen(entry) {
  const papers = await Promise.race([
    fetchSemanticScholar(entry.name),
    new Promise(r => setTimeout(() => r([]), 6000)),
  ]);
  const paperContext = formatPapersForPrompt(papers);
  const listenCtx = listenContextForPrompt();
  const parts = [
    `Rebuild this existing topic entry to current library standards. PRESERVE the topic's name and intellectual focus — but produce a complete, polished entry that includes everything the current schema expects (card, sources, full conclusionBody, two documents with their own sources).`,
    `EXISTING TOPIC:\n- name: ${entry.name}\n- summary: ${entry.summary}\n- current conclusion: ${entry.conclusion}`,
  ];
  if (paperContext) parts.push(paperContext);
  if (listenCtx) parts.push(listenCtx);
  parts.push(`Use web_search to find real, working source URLs. Cite them in the 'sources' arrays.

Reply ONLY with JSON (no markdown fences):
{
  "summary": "one-sentence summary",
  "conclusion": "one-line distillation that lodges",
  "tags": ["4-6 tags"],
  "conclusionBody": [
    {"type":"p","text":"opening"},
    {"type":"h4","text":"section heading"},
    {"type":"ul","items":["claim","claim","claim"]},
    {"type":"h4","text":"contested"},
    {"type":"ul","items":["open","open"]},
    {"type":"p","text":"closing honest distillation"}
  ],
  "card": {
    "punchline": "sharp central sentence",
    "propositions": ["4-5 dense load-bearing claims"],
    "hypotheses": ["2-3 if-then or what-if conjectures"],
    "facts": ["2-3 specific dated facts"],
    "seeAlso": [{"id":"existing-topic-id","name":"Name","why":"one-phrase tease"}]
  },
  "sources": [
    {"label":"Author Year — Title","url":"https://..."}
  ],
  "documents": [
    {"id":"slug","type":"...","title":"...","author":"synthesis · 2026","summary":"...","findings":["..."],"prose":["paragraph","paragraph","paragraph","paragraph"],"sources":[{"label":"...","url":"..."}]},
    {"id":"slug2","type":"...","title":"...","author":"...","summary":"...","findings":["..."],"prose":["...","...","...","..."],"sources":[{"label":"...","url":"..."}]}
  ]
}`);

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 12000,
      system: buildGenerationSystem(),
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [{ role: "user", content: parts.join("\n\n") }],
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  let text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) text = text.slice(first, last + 1);
  return JSON.parse(text);
}

function persistGuideHistory() {
  try { localStorage.setItem("motu.guideHistory", JSON.stringify(state.guideHistory.slice(-30))); }
  catch (e) { handleQuotaError(e); }
}

function handleQuotaError(e) {
  if (e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014)) {
    if (state._quotaToasted) return;
    state._quotaToasted = true;
    toast("storage is full — older entries may not survive a refresh");
  }
}

function persistOverride(entry) {
  try {
    const data = {
      summary: entry.summary,
      conclusion: entry.conclusion,
      conclusionBody: entry.conclusionBody,
      tags: entry.tags,
      card: entry.card,
      sources: entry.sources,
      documents: entry.documents,
    };
    localStorage.setItem(`motu.override.${entry.id}`, JSON.stringify(data));
  } catch (e) { /* quota — non-fatal */ }
}

function loadOverrides() {
  for (const t of TOPICS) {
    try {
      const raw = localStorage.getItem(`motu.override.${t.id}`);
      if (!raw) continue;
      Object.assign(t, JSON.parse(raw));
    } catch (e) { /* skip corrupted */ }
  }
  // moons too
  for (const arr of Object.values(SUB_TOPICS)) {
    for (const m of arr) {
      try {
        const raw = localStorage.getItem(`motu.override.${m.id}`);
        if (!raw) continue;
        Object.assign(m, JSON.parse(raw));
      } catch (e) {}
    }
  }
}

/* ============================================================
   Multi-star fusion — shift-select 2+ stars, then "fuse"
   The Librarian generates a synthesis + 3-4 title options; the
   user picks one (or writes their own) to branch a new star.
   ============================================================ */

async function fireMultiFusion() {
  if (state.selectedStars.size < 2) return;
  if (!state.guideKey) {
    toast("connect The Librarian to fuse ideas (paste API key in guide chat)");
    openGuide();
    return;
  }
  const topics = [...state.selectedStars].map(id => topicById(id)).filter(Boolean);
  if (topics.length < 2) { clearStarSelection(); return; }

  showGenerationOverlay(`fusing ${topics.length} ideas`, "Consulting The Librarian");
  state.generatingNow = true;
  try {
    const fusion = await generateFusion(topics);
    state.pendingFusion = { topics, fusion };
    hideGenerationOverlay();
    showTitleChooser(topics, fusion);
  } catch (err) {
    hideGenerationOverlay();
    toast(`fusion failed: ${err.message?.slice(0, 80) || "unknown"}`);
  } finally {
    state.generatingNow = false;
  }
}

async function generateFusion(topics) {
  const parts = [
    `${topics.length} ideas from the library are being fused into a new star. Forge their genuine synthesis.`,
    topics.map((t, i) => `${i+1}. ${t.name}\n   summary: ${t.summary}\n   conclusion: ${t.conclusion}`).join("\n\n"),
    `Write the synthesis as a brand-new top-level entry. The new entry should:
- Find the genuine intellectual intersection of ALL ${topics.length} parents
- Open new territory at the meeting point — not a summary, sum, or recap
- Be intellectually serious AND accessible

WRITING LEVEL: Write for a curious high school sophomore (grade 10). Plain words. Short sentences (avg 12-18 words). Avoid jargon — when you must use a technical term, define it inline in plain English. Lead with concrete examples and named people/dates, not abstract definitions. Keep the research rigor (real names, dates, sources) but make the prose itself an easy read. Brief is better — documents should be 2-3 paragraphs each, no padding.`,
  ];
  const listenCtx = listenContextForPrompt();
  if (listenCtx) parts.push(listenCtx);
  parts.push(`Reply ONLY with JSON in this exact shape:
{
  "name_options": ["3-4 candidate titles, ranging from descriptive to poetic"],
  "summary": "one sentence summary",
  "conclusion": "one-line distillation",
  "color": "#hexcolor blended from the parents",
  "cluster": "metaphysics|physical|systems|humanity",
  "tags": ["3-5 tags"],
  "explore": ["3-5 short novel tag-like terms (1-3 words each) the user could click to spawn further entries. Each should be an adjacent territory the synthesis opens, not just a parent's name."],
  "planetTheme": {"type":"crystal|grid|plasma|mandala|flow|gas|cmb|circuit","params":{"hue":0.5,"accent":0.7,"density":1.0}},
  "card": {
    "punchline": "the sharp central sentence",
    "propositions": ["4-5 dense, load-bearing claims"],
    "hypotheses": ["2-3 if-then or open conjectures"],
    "facts": ["2-3 specific facts"],
    "seeAlso": [{"id":"existing-topic-id","name":"Name","why":"reason"}]
  },
  "conclusionBody": [{"type":"p","text":"opening"},{"type":"h4","text":"section"},{"type":"ul","items":["bullet"]},{"type":"p","text":"closing"}],
  "documents": [{
    "id":"doc-slug","type":"synthesis","title":"Doc Title","author":"forged · 2026",
    "summary":"1-2 sentences","findings":["finding","finding"],
    "prose":["paragraph","paragraph"],
    "sources":[{"label":"...","url":"https://..."}]
  }]
}`);

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 8000,
      messages: [{ role: "user", content: parts.join("\n\n") }],
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0,200)}`);
  const data = await resp.json();
  let text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) text = text.slice(first, last + 1);
  return JSON.parse(text);
}

function showTitleChooser(topics, fusion) {
  const names = topics.map(t => t.name).join(", ");
  document.getElementById("titleIntro").textContent = `A synthesis born of ${names}. Pick a title — or write your own.`;
  const optsEl = document.getElementById("titleOptions");
  optsEl.innerHTML = "";
  const options = (fusion.name_options || []).slice(0, 4);
  for (const name of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "title-option-btn";
    btn.textContent = name;
    btn.addEventListener("click", () => commitTitleChoice(name));
    optsEl.appendChild(btn);
  }
  document.getElementById("customTitleInput").value = "";
  // preview
  document.getElementById("synthPunchline").textContent = fusion.card?.punchline || fusion.conclusion || fusion.summary || "";
  const propsUl = document.getElementById("synthPropositions");
  propsUl.innerHTML = "";
  for (const p of (fusion.card?.propositions || []).slice(0, 4)) {
    const li = document.createElement("li");
    li.textContent = p;
    propsUl.appendChild(li);
  }
  document.getElementById("modal-titleChooser").hidden = false;
}

function finalizeFusion(chosenName) {
  if (!state.pendingFusion) return;
  const { topics, fusion } = state.pendingFusion;
  state.pendingFusion = null;
  document.getElementById("modal-titleChooser").hidden = true;

  // centroid position with a small vertical lift so it doesn't sit on existing edges
  const pos = [0, 0, 0];
  for (const t of topics) {
    pos[0] += t.position[0]; pos[1] += t.position[1]; pos[2] += t.position[2];
  }
  pos[0] /= topics.length; pos[1] /= topics.length; pos[2] /= topics.length;
  pos[1] += 1.0;
  // nudge if too close to an existing star
  for (const t of TOPICS) {
    const dx = pos[0]-t.position[0], dy = pos[1]-t.position[1], dz = pos[2]-t.position[2];
    if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 3) {
      pos[0] += 1.5; pos[1] += 1.5; pos[2] += 1.5;
      break;
    }
  }

  // blended color from parents
  const tmp = new THREE.Color(0,0,0);
  for (const t of topics) tmp.add(new THREE.Color(t.color));
  tmp.multiplyScalar(1 / topics.length);
  // brighten slightly so syntheses stand out
  tmp.r = Math.min(1, tmp.r * 1.12);
  tmp.g = Math.min(1, tmp.g * 1.12);
  tmp.b = Math.min(1, tmp.b * 1.12);
  const blendedColor = "#" + tmp.getHexString();

  const id = `fusion-${chosenName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36).slice(-4)}`;
  const newTopic = {
    id,
    name: chosenName,
    cluster: fusion.cluster || "metaphysics",
    color: fusion.color || blendedColor,
    position: pos,
    size: 0.9,
    tags: fusion.tags || ["synthesis", ...topics.map(t => t.name.toLowerCase()).slice(0, 3)],
    summary: fusion.summary || "",
    conclusion: fusion.conclusion || fusion.summary || "",
    conclusionBody: fusion.conclusionBody || [{ type: "p", text: fusion.summary || "" }],
    planetTheme: fusion.planetTheme || { type: "crystal", params: { hue: 0.78, accent: 0.85, facets: 6.0 } },
    card: fusion.card || null,
    documents: fusion.documents || [],
    isSynthesis: true,
    parents: topics.map(t => t.id),
  };

  registerGeneratedTopic(newTopic);
  persistTopic(newTopic);
  addTopicNode(newTopic);
  // wire edges to every parent
  for (const parent of topics) {
    if (registerGeneratedEdge(newTopic.id, parent.id)) persistEdge(newTopic.id, parent.id);
  }
  rebuildEdges();

  document.getElementById("topicCount").textContent = TOPICS.length;
  clearStarSelection();
  const exploreTags = (Array.isArray(fusion.explore) && fusion.explore.length > 0)
    ? fusion.explore.slice(0, 5)
    : (newTopic.tags || []).filter(t => t && t.length >= 3 && t.length <= 28).slice(0, 5);
  showInsight(chosenName, newTopic.summary || "a new branch has formed", {
    permanent: true,
    tags: exploreTags,
  });
  // warp in shortly after — user can dismiss the insight to explore the new star directly
  state.autoNarrateOnArrival = true;
  setTimeout(() => enterPlanet(newTopic.id), 1100);
}

async function generateSynthesis(a, b) {
  const prompt = `Two ideas from the library have collided. Forge their synthesis.

A: ${a.name}
  ${a.summary}
  conclusion: ${a.conclusion}

B: ${b.name}
  ${b.summary}
  conclusion: ${b.conclusion}

WRITING LEVEL: Write for a curious high school sophomore. Plain language. Short sentences. No jargon you don't immediately define. Lead with the concrete, not the abstract. Be intriguing — open with a hook, not a definition.

Write a short synthesis (2-3 sentences) that captures the genuine insight where these meet — not a sum of the parts, the spark between them. Provide 3-4 candidate title options (1-4 words each). The expansion paragraph develops the idea further but stays HS-readable.

Reply ONLY with valid JSON, no fences:
{
  "name_options": ["3-4 candidate titles for the synthesis, 1-4 words each, ranging from descriptive to poetic"],
  "summary": "2-3 sentence poetic synthesis. The spoken kind.",
  "expansion": "One paragraph that develops the insight in more substantive language.",
  "findings": ["one short insight", "another short insight"],
  "explore": ["3-5 short tag-like terms or phrases (1-3 words each) that the user could click to explore further. Each should be a NOVEL adjacent territory the synthesis opens up — not just restating the parents. Make them tantalizing."]
}`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).slice(0,150)}`);
  const data = await resp.json();
  let text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) text = text.slice(first, last + 1);
  return JSON.parse(text);
}

function persistEdge(a, b) {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userEdges") || "[]");
    arr.push([a, b]);
    localStorage.setItem("motu.userEdges", JSON.stringify(arr));
  } catch (e) { /* non-fatal */ }
}
function loadPersistedEdges() {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userEdges") || "[]");
    for (const [a, b] of arr) registerGeneratedEdge(a, b);
  } catch (e) { /* non-fatal */ }
}

function rebuildEdges() {
  if (state.edgeLines) {
    state.scene.remove(state.edgeLines);
    state.edgeLines.geometry.dispose();
    state.edgeLines.material.dispose();
    state.edgeLines = null;
  }
  buildEdges();
  if (state.mode !== "galaxy") state.edgeLines.visible = false;
  else state.edgeLines.visible = state.edgesVisible;
}

function persistTopic(topic) {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userTopics") || "[]");
    arr.push(topic);
    localStorage.setItem("motu.userTopics", JSON.stringify(arr));
  } catch (e) { handleQuotaError(e); }
}
function persistMoon(moon) {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userMoons") || "[]");
    arr.push(moon);
    localStorage.setItem("motu.userMoons", JSON.stringify(arr));
  } catch (e) { handleQuotaError(e); }
}
function loadPersistedEntities() {
  try {
    const topics = JSON.parse(localStorage.getItem("motu.userTopics") || "[]");
    for (const t of topics) registerGeneratedTopic(t);
    const moons = JSON.parse(localStorage.getItem("motu.userMoons") || "[]");
    for (const m of moons) registerGeneratedMoon(m);
  } catch (e) { /* corrupted localStorage — non-fatal */ }
  loadPersistedEdges();
  loadOverrides();
  applyDeletions();   // hide deleted entries before any visual builds
}

async function callClaude(userText) {
  const context = state.currentTopic
    ? `The user is currently inside the "${state.currentTopic.name}" research environment. Topic conclusion: ${state.currentTopic.conclusion}`
    : "The user is in the galactic overview, looking at all topics at once.";

  // last few turns
  const turns = state.guideHistory.slice(-10).filter(m => m.role !== "system");
  const messages = [...turns];

  // Conversational chat uses Haiku — fast, cheap, and good enough for the
  // 2-5 sentence replies the Librarian prefers. Heavier tasks (topic
  // generation, rebuild-this-entry, fusion) still use Opus.
  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: buildGuideSystem() + "\n\n" + context,
    messages: messages,
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`API ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data.content || []).map(b => b.text).join("\n\n").trim();
}
