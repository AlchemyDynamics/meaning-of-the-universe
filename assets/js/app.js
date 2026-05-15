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
  registerGeneratedTopic, registerGeneratedMoon,
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
  mode: "galaxy",           // "galaxy" | "transit" | "planet" | "moon"
  currentTopic: null,       // topic object when in planet mode
  currentMoon: null,        // moon object when in moon mode
  topicMeshes: new Map(),   // id -> mesh
  moonMeshes: [],           // [{ id, group, mesh, orbit, hoverHalo }]
  generatingNow: false,
  edgeLines: null,
  starfield: null,
  planetMesh: null,
  planetGroup: null,
  cameraTargetPos: null,
  cameraTargetLook: new THREE.Vector3(0, 0, 0),
  clock: new THREE.Clock(),
  edgesVisible: true,
  // remembered camera pose to restore on return
  savedCam: { pos: new THREE.Vector3(), look: new THREE.Vector3() },
  // guide
  guideKey: localStorage.getItem("motu.guideKey") || "",
  guideHistory: [],
};

window.__motu = state; // debug handle

/* ============================================================
   Boot
   ============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  setBootStatus("constructing the starfield…");
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
  setTimeout(() => {
    document.getElementById("boot").classList.add("fade");
    setTimeout(() => document.getElementById("boot").remove(), 1400);
  }, 4000);
  document.getElementById("topicCount").textContent = TOPICS.length;
  document.getElementById("docCount").textContent = TOPICS.reduce((a, t) => a + t.documents.length, 0);
});

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
    0.7,  // strength
    0.6,  // radius
    0.15  // threshold
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

  // ambient
  state.scene.add(new THREE.AmbientLight(0x404466, 0.6));
  const key = new THREE.DirectionalLight(0xaabaff, 0.4);
  key.position.set(20, 30, 20);
  state.scene.add(key);

  window.addEventListener("resize", onResize);
  state.renderer.domElement.addEventListener("pointermove", onPointerMove);
  state.renderer.domElement.addEventListener("click", onPointerClick);
  state.renderer.domElement.addEventListener("touchstart", (e) => {
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

function onPointerClick() {
  if (state.mode === "galaxy") {
    if (state.hovered) enterPlanet(state.hovered);
  } else if (state.mode === "planet" && state.hoveredMoon) {
    const rec = state.moonMeshes.find(m => m.id === state.hoveredMoon);
    if (rec) enterMoon(rec);
  }
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
function buildTopicNodes() {
  setBootStatus("placing the topic-stars…");
  const group = new THREE.Group();

  for (const topic of TOPICS) {
    const colorObj = new THREE.Color(topic.color);

    // glow halo (sprite)
    const haloMat = new THREE.SpriteMaterial({
      map: makeGlowTexture(colorObj),
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(6 * topic.size, 6 * topic.size, 1);

    // core sphere
    const coreGeo = new THREE.SphereGeometry(0.6 * topic.size, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({ color: colorObj });
    const core = new THREE.Mesh(coreGeo, coreMat);

    // pulse ring
    const ringGeo = new THREE.RingGeometry(1.0 * topic.size, 1.05 * topic.size, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorObj, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);

    const node = new THREE.Group();
    node.add(halo, core, ring);
    node.position.set(...topic.position);
    node.userData.topicId = topic.id;
    node.userData.core = core;
    node.userData.halo = halo;
    node.userData.ring = ring;
    node.userData.baseColor = colorObj.clone();
    node.userData.size = topic.size;

    group.add(node);
    state.topicMeshes.set(topic.id, node);
  }

  state.scene.add(group);
  state.topicGroup = group;
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

  // ─── theme colorers ──────────────────────────────────────────────
  vec3 theme_grid(vec3 p) {
    // simulation theory — wireframe cubes with glitch
    vec3 q = p * 4.0;
    vec3 g = abs(fract(q + uTime * 0.02) - 0.5);
    float line = step(0.46, max(max(g.x, g.y), g.z));
    float glitch = step(0.97, hash(floor(q) + floor(uTime * 6.0)));
    vec3 base = hsv2rgb(vec3(uHue, 0.4, 0.06));
    vec3 grid = hsv2rgb(vec3(uHue, 0.6, 0.9));
    vec3 hot  = hsv2rgb(vec3(uAccent, 0.8, 1.2));
    return base + line * grid * (0.5 + 0.5 * fbm(q*0.3)) + glitch * hot * 0.6;
  }
  vec3 theme_plasma(vec3 p) {
    vec3 q = p * 2.3;
    float n = fbm(q + vec3(0.0, uTime * 0.18, 0.0));
    float flare = pow(fbm(q*2.2 + vec3(uTime*0.5)), 3.0);
    vec3 cool = hsv2rgb(vec3(0.04, 0.85, 0.5));
    vec3 hot  = hsv2rgb(vec3(0.12, 0.9, 1.4));
    vec3 white = vec3(1.0, 0.95, 0.85);
    vec3 col = mix(cool, hot, n);
    col += white * flare * 0.6;
    return col;
  }
  vec3 theme_mandala(vec3 p) {
    // radial sacred geometry — based on spherical coords
    float theta = atan(p.z, p.x);
    float phi = acos(p.y / max(length(p), 0.001));
    float r1 = cos(theta * 6.0 + uTime * 0.15) * 0.5 + 0.5;
    float r2 = cos(phi * 8.0) * 0.5 + 0.5;
    float r3 = cos(theta * 12.0 + phi * 4.0) * 0.5 + 0.5;
    float patt = pow(r1 * r2 * r3, 1.5);
    vec3 deep  = hsv2rgb(vec3(0.74, 0.7, 0.15));
    vec3 gold  = hsv2rgb(vec3(uHue, 0.85, 1.1));
    vec3 ivory = hsv2rgb(vec3(0.12, 0.25, 1.2));
    return mix(deep, gold, patt) + ivory * pow(patt, 6.0) * 0.4;
  }
  vec3 theme_flow(vec3 p) {
    // economics — particle streams / current
    vec3 q = p * 3.0;
    float streamA = sin(q.x * 5.0 + q.y * 3.0 + uTime * 0.6);
    float streamB = sin(q.z * 4.0 - q.y * 5.0 + uTime * 0.5);
    float lines = smoothstep(0.94, 1.0, max(streamA, streamB));
    float pulse = fbm(q + uTime * 0.2);
    vec3 base = hsv2rgb(vec3(uHue, 0.6, 0.1 + 0.3 * pulse));
    vec3 stream = hsv2rgb(vec3(uAccent, 0.7, 1.4));
    return base + stream * lines;
  }
  vec3 theme_crystal(vec3 p) {
    // esoterica — faceted with sigil glow
    vec3 q = p * 2.4;
    vec3 fl = floor(q + 0.5);
    float facet = vnoise(fl);
    float edges = 1.0 - smoothstep(0.0, 0.05, abs(fract(q.x) - 0.5) + abs(fract(q.y) - 0.5) + abs(fract(q.z) - 0.5) - 0.4);
    float sigil = pow(0.5 + 0.5 * sin(fbm(p*1.2)*15.0 + uTime*0.3), 6.0);
    vec3 deep = hsv2rgb(vec3(uHue, 0.7, 0.08 + 0.18 * facet));
    vec3 silver = vec3(0.85, 0.82, 1.0);
    vec3 violet = hsv2rgb(vec3(uHue, 0.9, 1.3));
    return deep + silver * edges * 0.4 + violet * sigil * 0.7;
  }
  vec3 theme_gas(vec3 p) {
    // astrophysics — banded gas giant
    float band = sin(p.y * uParamA + fbm(p * 1.8 + uTime * 0.05) * 1.5);
    float fine = fbm(p * 6.0 + uTime * 0.1) * 0.3;
    vec3 deep = hsv2rgb(vec3(uHue, 0.6, 0.25));
    vec3 light = hsv2rgb(vec3(uHue + 0.05, 0.3, 1.0));
    vec3 storm = hsv2rgb(vec3(uAccent, 0.7, 0.9));
    float storms = smoothstep(0.7, 0.95, fbm(p*3.0 - uTime*0.07));
    return mix(deep, light, smoothstep(-0.4, 0.4, band) + fine) + storm * storms * 0.4;
  }
  vec3 theme_cmb(vec3 p) {
    // cosmology — cosmic web noise
    float web = fbm(p * 4.0);
    float net = pow(fbm(p * 8.0 + 7.3), 2.5);
    float voids = smoothstep(0.3, 0.5, web);
    vec3 cold = hsv2rgb(vec3(0.63, 0.7, 0.04));
    vec3 warm = hsv2rgb(vec3(0.03, 0.7, 0.45));
    vec3 nodes = hsv2rgb(vec3(uHue, 0.6, 1.1));
    return mix(cold, warm, voids) + nodes * net * 0.5;
  }
  vec3 theme_circuit(vec3 p) {
    // computation — circuit-board, data pulses
    vec3 q = p * 5.0;
    float gridX = step(0.45, abs(fract(q.x) - 0.5));
    float gridY = step(0.45, abs(fract(q.y) - 0.5));
    float gridZ = step(0.45, abs(fract(q.z) - 0.5));
    float lines = max(gridX * gridY, gridY * gridZ);
    float pulse = step(0.97, hash(floor(q) + floor(uTime * 4.0)));
    vec3 base  = hsv2rgb(vec3(0.55, 0.7, 0.05));
    vec3 trace = hsv2rgb(vec3(uHue, 0.7, 0.9));
    vec3 spark = hsv2rgb(vec3(uAccent, 0.5, 1.5));
    return base + trace * lines * 0.6 + spark * pulse * 0.8;
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

    group.add(body, halo);

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
    state.moonMeshes.push({
      id: sub.id,
      sub,
      group,
      body,
      halo,
      trail,
      mat,
      orbit,
      paused: false,
      size,
      color,
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
  const m = moonRecord;
  m.paused = true;
  state.currentMoon = m.sub;
  state.mode = "transit";
  state.afterTransit = "moon";

  // camera target: a position near the moon, with the planet in the background
  const moonPos = m.group.position.clone();
  const fromOrigin = moonPos.clone().normalize();
  const cameraOffset = fromOrigin.multiplyScalar(2.0).add(new THREE.Vector3(0, 0.6, 0));
  state.cameraTargetPos = moonPos.clone().add(cameraOffset);
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
  // unfocus moon; resume orbits
  for (const m of state.moonMeshes) {
    m.paused = false;
    m.halo.scale.set(m.size * 4, m.size * 4, 1);
  }
  state.currentMoon = null;

  // re-center on planet
  const dir = new THREE.Vector3(1, 0.3, 1.6).normalize();
  state.cameraTargetPos = dir.multiplyScalar(11);
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

  const tags = document.getElementById("planetTags");
  tags.innerHTML = "";
  for (const tag of (moon.tags || [])) {
    const span = document.createElement("span");
    span.className = "planet-tag";
    span.textContent = tag;
    tags.appendChild(span);
  }
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

    // node pulsing
    for (const [, node] of state.topicMeshes) {
      const phase = t * 0.6 + node.position.x * 0.3;
      const s = 1 + 0.06 * Math.sin(phase);
      node.userData.ring.scale.setScalar(s);
      node.userData.ring.material.opacity = 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(phase));
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
        else if (state.afterTransit === "moon") { state.mode = "moon"; }
      }
    }

    state.controls.update();
    state.composer.render();
  }
  frame();
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
  const targets = state.moonMeshes.map(m => m.body);
  const hits = state.raycaster.intersectObjects(targets, false);
  const tooltip = document.getElementById("tooltip");

  if (hits.length > 0) {
    const body = hits[0].object;
    const rec = state.moonMeshes.find(m => m.body === body);
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
  const targets = [];
  for (const [, node] of state.topicMeshes) targets.push(node.userData.core);
  const hits = state.raycaster.intersectObjects(targets, false);
  const tooltip = document.getElementById("tooltip");

  if (hits.length > 0) {
    const node = hits[0].object.parent;
    const id = node.userData.topicId;
    if (id !== state.hovered) {
      state.hovered = id;
      const topic = topicById(id);
      tooltip.innerHTML = `${topic.name}<span class="tt-sub">${topic.cluster} · ${topic.documents.length} documents</span>`;
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
  state.cameraTargetPos = dir.multiplyScalar(11);
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

function onArriveAtPlanet() { /* hook */ }

function returnToGalaxy() {
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

/* ============================================================
   Planet HUD population
   ============================================================ */
function populatePlanetHud(topic) {
  document.getElementById("planetCluster").textContent = topic.cluster + " · " + (CLUSTERS[topic.cluster]?.label ?? "");
  document.getElementById("planetTitle").textContent = topic.name;
  document.getElementById("planetSummary").textContent = topic.summary;
  document.getElementById("planetDocCount").textContent = `${topic.documents.length} entries`;
  document.getElementById("planetConnCount").textContent = `${connectionsOf(topic.id).length} links`;

  const tags = document.getElementById("planetTags");
  tags.innerHTML = "";
  for (const tag of topic.tags) {
    const span = document.createElement("span");
    span.className = "planet-tag";
    span.textContent = tag;
    tags.appendChild(span);
  }
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
  document.getElementById("modal-conclusion").hidden = false;
}

function openDocuments(entry) {
  document.getElementById("docsTitle").textContent = entry.name;
  const list = document.getElementById("docList");
  list.innerHTML = "";
  (entry.documents || []).forEach((doc, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="doc-type">${doc.type}</span>
      <span class="doc-title">${doc.title}</span>
      <span class="doc-author">${doc.author}</span>
    `;
    li.addEventListener("click", () => {
      [...list.children].forEach(c => c.classList.remove("active"));
      li.classList.add("active");
      renderDocument(doc);
    });
    list.appendChild(li);
    if (idx === 0) {
      li.classList.add("active");
      renderDocument(doc);
    }
  });
  document.getElementById("modal-documents").hidden = false;
}

function renderDocument(doc) {
  // any previous reading should stop when switching docs
  stopSpeech();
  const reader = document.getElementById("docReader");
  reader.innerHTML = `
    <div class="doc-head-row">
      <h4>${escapeHtml(doc.title)}</h4>
      <button class="tts-btn" data-tts-doc title="Read aloud">
        <svg class="tts-icon-play" viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        <svg class="tts-icon-stop" viewBox="0 0 24 24" width="14" height="14" hidden><path d="M6 6h12v12H6z" fill="currentColor"/></svg>
        <span class="tts-label">listen</span>
      </button>
    </div>
    <div class="doc-meta">${escapeHtml(doc.author)} · ${escapeHtml(doc.type)}</div>
    <div class="doc-summary">${escapeHtml(doc.summary)}</div>
    <div class="doc-findings">
      <h5>key findings</h5>
      <ul>${doc.findings.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    </div>
    <div class="doc-prose">${doc.prose.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</div>
  `;
  reader.scrollTop = 0;
  // wire the dynamically-rendered button
  const btn = reader.querySelector("[data-tts-doc]");
  if (btn) {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("playing")) { stopSpeech(); return; }
      startSpeech(entryToReadable(doc, "document"), btn);
    });
  }
}

function openConnections(entry) {
  document.getElementById("connTitle").textContent = entry.name;
  const grid = document.getElementById("connGrid");
  grid.innerHTML = "";

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

  document.getElementById("modal-connections").hidden = false;
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
   Text-to-speech
   ------------------------------------------------------------
   Uses the browser's Web Speech API — no API key required.
   Voices are paragraph-chunked into a queue to (a) sidestep
   Chrome's 15-second per-utterance bug and (b) allow stop/skip.
   Settings persist in localStorage.
   ============================================================ */

const TTS = {
  voices: [],
  selected: null,
  rate: parseFloat(localStorage.getItem("motu.tts.rate") || "1.0"),
  pitch: parseFloat(localStorage.getItem("motu.tts.pitch") || "1.0"),
  queue: [],
  index: 0,
  playing: false,
  currentBtn: null,
  keepAliveTimer: null,
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
  sel.innerHTML = "";
  if (TTS.voices.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "no voices available";
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  for (const v of TTS.voices) {
    const opt = document.createElement("option");
    opt.value = v.voice.voiceURI;
    opt.textContent = `${qualityStars(v.score)}  ${v.label}`;
    if (v.voice === TTS.selected) opt.selected = true;
    sel.appendChild(opt);
  }
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

function startSpeech(text, btn) {
  if (!("speechSynthesis" in window)) {
    toast("speech synthesis not supported in this browser");
    return;
  }
  // late-load voices in case they weren't ready at init
  if (TTS.voices.length === 0) loadVoices();
  stopSpeech();
  const chunks = chunkForSpeech(text);
  if (chunks.length === 0) return;
  TTS.queue = chunks.map(c => {
    const u = new SpeechSynthesisUtterance(c);
    if (TTS.selected) u.voice = TTS.selected;   // else: use browser default
    u.rate = TTS.rate;
    u.pitch = TTS.pitch;
    u.volume = 1.0;
    u.lang = TTS.selected?.lang || "en-US";
    return u;
  });
  TTS.index = 0;
  TTS.playing = true;
  TTS.currentBtn = btn;
  if (btn) btn.classList.add("playing");
  // tell the user which voice is active (helps when nothing seems to happen)
  if (!TTS.selected) {
    console.warn("[TTS] No voice selected — using browser default");
  }
  playNextChunk();
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

function stopSpeech() {
  TTS.playing = false;
  TTS.queue = [];
  TTS.index = 0;
  speechSynthesis.cancel();
  if (TTS.currentBtn) TTS.currentBtn.classList.remove("playing");
  TTS.currentBtn = null;
}

function ttsPreview() {
  startSpeech(
    "The library is open. Begin where curiosity invites you, and the rest will arrange itself.",
    document.getElementById("previewVoice")
  );
}

function bindTTSButtons() {
  document.querySelectorAll(".tts-btn[data-tts-source]").forEach(btn => {
    btn.addEventListener("click", () => {
      const source = btn.dataset.ttsSource;
      // toggle off if already playing this button
      if (btn.classList.contains("playing")) { stopSpeech(); return; }
      const entry = currentEntry();
      if (!entry) return;
      if (source === "conclusion") startSpeech(entryToReadable(entry, "conclusion"), btn);
    });
  });
}

function setupSettingsPanel() {
  // open
  document.getElementById("btn-settings").addEventListener("click", () => {
    document.getElementById("modal-settings").hidden = false;
  });
  // voice
  document.getElementById("voiceSelect").addEventListener("change", (e) => {
    const uri = e.target.value;
    const pick = TTS.voices.find(v => v.voice.voiceURI === uri);
    if (pick) {
      TTS.selected = pick.voice;
      localStorage.setItem("motu.tts.voiceURI", uri);
    }
  });
  // rate
  const rate = document.getElementById("rateRange");
  rate.value = TTS.rate;
  document.getElementById("rateValue").textContent = `${TTS.rate.toFixed(2)}×`;
  rate.addEventListener("input", (e) => {
    TTS.rate = parseFloat(e.target.value);
    document.getElementById("rateValue").textContent = `${TTS.rate.toFixed(2)}×`;
    localStorage.setItem("motu.tts.rate", String(TTS.rate));
  });
  // pitch
  const pitch = document.getElementById("pitchRange");
  pitch.value = TTS.pitch;
  document.getElementById("pitchValue").textContent = TTS.pitch.toFixed(2);
  pitch.addEventListener("input", (e) => {
    TTS.pitch = parseFloat(e.target.value);
    document.getElementById("pitchValue").textContent = TTS.pitch.toFixed(2);
    localStorage.setItem("motu.tts.pitch", String(TTS.pitch));
  });
  // preview & reset
  document.getElementById("previewVoice").addEventListener("click", ttsPreview);
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

function attachUI() {
  document.getElementById("btn-return-galaxy").addEventListener("click", () => {
    // dynamic: in moon → planet; in planet → galaxy
    if (state.currentMoon) returnToPlanet();
    else returnToGalaxy();
  });
  document.getElementById("btn-about").addEventListener("click", () => document.getElementById("modal-about").hidden = false);
  document.getElementById("btn-reset-view").addEventListener("click", () => {
    state.cameraTargetPos = new THREE.Vector3(0, 6, 36);
    state.cameraTargetLook = new THREE.Vector3(0, 0, 0);
    state.mode = "transit";
    state.afterTransit = "galaxy";
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
      else if (action === "ask-guide") openGuide();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(b => {
    b.addEventListener("click", closeAllModals);
  });
  // ESC closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      e.preventDefault();
      openGuide();
    }
  });

  // click outside modal closes
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => { if (e.target === m) closeAllModals(); });
  });

  // guide
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

async function sendGuide(text) {
  addGuideMessage("user", text);
  state.guideHistory.push({ role: "user", content: text });

  // try simple intent first — "take me to X"
  const navMatch = matchNavIntent(text);
  if (navMatch) {
    const tip = `Taking you to **${navMatch.name}**. ${navMatch.summary}`;
    addGuideMessage("bot", tip, { navId: navMatch.id, navName: navMatch.name });
    return;
  }

  if (!state.guideKey) {
    addGuideMessage("bot", "I need a Claude API key to answer freely. Paste one above — it stays in this browser only. Or ask me to *take you to* a specific topic and I'll navigate without an API.");
    return;
  }

  const typingEl = addTyping();
  try {
    const reply = await callClaude(text);
    typingEl.remove();
    // detect navigation intent in reply
    const navTopic = detectReplyNav(reply);
    addGuideMessage("bot", reply, navTopic ? { navId: navTopic.id, navName: navTopic.name } : {});
    state.guideHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    typingEl.remove();
    addGuideMessage("bot", `the line went quiet. *${escapeHtml(err.message || "unknown error")}*`);
  }
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
  return `You are the AI Guide of "The Meaning of the Universe", a 3D research library organized as a galaxy. You help visitors navigate, summarize, and decide what to read next. Keep replies short (2-5 sentences), warm, and substantive. Quote sparingly.

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
  const form = document.getElementById("searchForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    if (!q) return;
    await handleSearch(q);
  });
  document.getElementById("generationCancel").addEventListener("click", () => {
    state.generatingNow = false;
    document.getElementById("generation-overlay").hidden = true;
  });
}

async function handleSearch(query) {
  const hit = findLocalMatch(query);
  if (hit) {
    navigateToHit(hit);
    document.getElementById("searchInput").value = "";
    return;
  }
  if (!state.guideKey) {
    toast("No match found — connect the AI Guide to generate new topics");
    openGuide();
    return;
  }
  await generateAndAddEntity(query);
}

function findLocalMatch(query) {
  const q = query.toLowerCase().trim();
  const qSlug = q.replace(/\s+/g, "-");
  const items = allSearchable();
  let best = null, bestScore = 0;
  for (const item of items) {
    const name = item.name.toLowerCase();
    const id = item.id.toLowerCase();
    let score = 0;
    if (id === q || id === qSlug || name === q) score = 100;
    else if (name.includes(q) || q.includes(name)) score = 70;
    else if (id.includes(qSlug)) score = 65;
    else if ((item.tags || []).some(t => t.toLowerCase() === q)) score = 60;
    else if (name.split(/\s+/).some(w => w === q)) score = 55;
    else if ((item.tags || []).some(t => t.toLowerCase().includes(q))) score = 35;
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return bestScore >= 50 ? best : null;
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
  showGenerationOverlay(`searching for "${query}"`, "consulting the AI Guide…");
  state.generatingNow = true;
  try {
    const result = await callClaudeForGeneration(query);
    if (!state.generatingNow) return;
    document.getElementById("searchInput").value = "";

    if (result.parent) {
      // new moon under existing parent
      result.entity.parentId = result.parent;
      registerGeneratedMoon(result.entity);
      persistMoon(result.entity);
      showGenerationOverlay(`a new moon: ${result.entity.name}`, "arriving…");
      setTimeout(() => {
        hideGenerationOverlay();
        if (state.currentTopic?.id === result.parent) {
          if (state.currentMoon) returnToPlanet();
          setTimeout(() => {
            buildMoons(state.currentTopic);
            setTimeout(() => {
              const rec = state.moonMeshes.find(m => m.id === result.entity.id);
              if (rec) enterMoon(rec);
            }, 100);
          }, 200);
        } else {
          if (state.mode === "planet" || state.mode === "moon") returnToGalaxy();
          setTimeout(() => {
            enterPlanet(result.parent);
            setTimeout(() => {
              const rec = state.moonMeshes.find(m => m.id === result.entity.id);
              if (rec) enterMoon(rec);
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
      showGenerationOverlay(`a new star: ${topic.name}`, "warping in…");
      setTimeout(() => {
        hideGenerationOverlay();
        if (state.mode === "planet" || state.mode === "moon") returnToGalaxy();
        setTimeout(() => enterPlanet(topic.id), state.mode === "galaxy" ? 100 : 800);
      }, 900);
    }
  } catch (err) {
    hideGenerationOverlay();
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
    "documents": [
      {
        "id":"slug",
        "type":"survey|foundational|frontier|theoretical|historical|empirical|philosophical",
        "title":"Document Title",
        "author":"synthesis · 2026",
        "summary":"1-2 sentences",
        "findings":["finding","finding","finding"],
        "prose":["paragraph one","paragraph two","paragraph three","paragraph four"]
      },
      {"id":"slug2","type":"...","title":"...","author":"...","summary":"...","findings":["..."],"prose":["...","...","..."]}
    ]
  }
}

Make it substantive, intellectually serious, calibrated. Match the library's tone: distillation-focused, neither breathless nor dismissive. Two documents. 3-4 paragraphs each in prose.`;
}

async function callClaudeForGeneration(query) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.guideKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: buildGenerationSystem(),
      messages: [{ role: "user", content: `Search query: "${query}"\n\nGenerate the JSON now.` }],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`API ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  let text = (data.content || []).map(b => b.text).join("\n").trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  // robustness: extract the first {...} block
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) text = text.slice(first, last + 1);
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { throw new Error("AI returned malformed JSON"); }
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
  const colorObj = new THREE.Color(topic.color);
  const haloMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(colorObj),
    color: 0xffffff, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  const size = topic.size || 1.0;
  halo.scale.set(6 * size, 6 * size, 1);
  const coreGeo = new THREE.SphereGeometry(0.6 * size, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({ color: colorObj });
  const core = new THREE.Mesh(coreGeo, coreMat);
  const ringGeo = new THREE.RingGeometry(1.0 * size, 1.05 * size, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorObj, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  const node = new THREE.Group();
  node.add(halo, core, ring);
  node.position.set(...topic.position);
  node.userData = { topicId: topic.id, core, halo, ring, baseColor: colorObj.clone(), size };
  state.topicGroup.add(node);
  state.topicMeshes.set(topic.id, node);

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

function persistTopic(topic) {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userTopics") || "[]");
    arr.push(topic);
    localStorage.setItem("motu.userTopics", JSON.stringify(arr));
  } catch (e) { /* quota or json error — non-fatal */ }
}
function persistMoon(moon) {
  try {
    const arr = JSON.parse(localStorage.getItem("motu.userMoons") || "[]");
    arr.push(moon);
    localStorage.setItem("motu.userMoons", JSON.stringify(arr));
  } catch (e) { /* non-fatal */ }
}
function loadPersistedEntities() {
  try {
    const topics = JSON.parse(localStorage.getItem("motu.userTopics") || "[]");
    for (const t of topics) registerGeneratedTopic(t);
    const moons = JSON.parse(localStorage.getItem("motu.userMoons") || "[]");
    for (const m of moons) registerGeneratedMoon(m);
  } catch (e) { /* corrupted localStorage — non-fatal */ }
}

async function callClaude(userText) {
  const context = state.currentTopic
    ? `The user is currently inside the "${state.currentTopic.name}" research environment. Topic conclusion: ${state.currentTopic.conclusion}`
    : "The user is in the galactic overview, looking at all topics at once.";

  // last few turns
  const turns = state.guideHistory.slice(-10).filter(m => m.role !== "system");
  const messages = [...turns];

  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
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
