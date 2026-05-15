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

import { TOPICS, EDGES, CLUSTERS, topicById, connectionsOf } from "./data.js";

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
  mode: "galaxy",           // "galaxy" | "transit" | "planet"
  currentTopic: null,       // topic object when in planet mode
  topicMeshes: new Map(),   // id -> mesh
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
  initScene();
  buildStarfield();
  buildTopicNodes();
  buildEdges();
  buildPlanet();
  attachUI();
  startLoop();
  setTimeout(() => {
    document.getElementById("boot").classList.add("fade");
    setTimeout(() => document.getElementById("boot").remove(), 1400);
  }, 700);
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
  if (state.mode !== "galaxy") return;
  if (state.hovered) enterPlanet(state.hovered);
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

    // planet rotation & shader time
    if (state.planetGroup.visible) {
      state.planetGroup.rotation.y += dt * 0.08;
      state.planetMesh.material.uniforms.uTime.value = t;
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
        if (state.afterTransit === "planet") onArriveAtPlanet();
        else if (state.afterTransit === "galaxy") onArriveAtGalaxy();
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

  updateGuideContext(`planet — ${topic.name}`);
}

function onArriveAtPlanet() { /* hook */ }

function returnToGalaxy() {
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
function openConclusion(topic) {
  document.getElementById("conclusionTitle").textContent = topic.name;
  document.getElementById("conclusionLead").textContent = topic.conclusion;
  const body = document.getElementById("conclusionBody");
  body.innerHTML = "";
  for (const node of topic.conclusionBody) {
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

function openDocuments(topic) {
  document.getElementById("docsTitle").textContent = topic.name;
  const list = document.getElementById("docList");
  list.innerHTML = "";
  topic.documents.forEach((doc, idx) => {
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
  const reader = document.getElementById("docReader");
  reader.innerHTML = `
    <h4>${escapeHtml(doc.title)}</h4>
    <div class="doc-meta">${escapeHtml(doc.author)} · ${escapeHtml(doc.type)}</div>
    <div class="doc-summary">${escapeHtml(doc.summary)}</div>
    <div class="doc-findings">
      <h5>key findings</h5>
      <ul>${doc.findings.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    </div>
    <div class="doc-prose">${doc.prose.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</div>
  `;
  reader.scrollTop = 0;
}

function openConnections(topic) {
  document.getElementById("connTitle").textContent = topic.name;
  const grid = document.getElementById("connGrid");
  grid.innerHTML = "";
  for (const c of connectionsOf(topic.id)) {
    const card = document.createElement("button");
    card.className = "conn-card";
    card.innerHTML = `<span class="conn-name">${c.name}</span><span class="conn-cluster">${c.cluster}</span>`;
    card.style.borderLeft = `3px solid ${c.color}`;
    card.addEventListener("click", () => {
      closeAllModals();
      // smooth re-navigation from one planet to another
      state.planetGroup.visible = false;
      setTimeout(() => enterPlanet(c.id), 50);
    });
    grid.appendChild(card);
  }
  document.getElementById("modal-connections").hidden = false;
}

function closeAllModals() {
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
function attachUI() {
  document.getElementById("btn-return-galaxy").addEventListener("click", returnToGalaxy);
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

  // planet menu
  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (!state.currentTopic) return;
      if (action === "conclusion") openConclusion(state.currentTopic);
      else if (action === "documents") openDocuments(state.currentTopic);
      else if (action === "connections") openConnections(state.currentTopic);
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
      if (state.mode === "planet") returnToGalaxy();
      setTimeout(() => enterPlanet(opts.navId), 600);
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
  // find any topic name or keyword
  for (const topic of TOPICS) {
    if (t.includes(topic.name.toLowerCase())) return topic;
    if (t.includes(topic.id)) return topic;
  }
  // also tag-based
  for (const topic of TOPICS) {
    for (const tag of topic.tags) {
      if (t.includes(tag.toLowerCase())) return topic;
    }
  }
  return null;
}

function detectReplyNav(reply) {
  // look for an explicit cue we'll ask Claude to use: [[navigate:id]]
  const m = reply.match(/\[\[navigate:([a-z-]+)\]\]/i);
  if (m) return topicById(m[1]);
  return null;
}

const GUIDE_SYSTEM = `You are the AI Guide of "The Meaning of the Universe", a 3D research library organized as a galaxy. You help visitors navigate, summarize, and decide what to read next. Keep replies short (2-5 sentences), warm, and substantive. Quote sparingly. When you recommend the user visit a specific topic in the library, append a navigation cue on its own line in this exact form: [[navigate:topic-id]] — the front-end will turn that into a clickable warp button. Topic ids are:

` + TOPICS.map(t => `- ${t.id} — ${t.name}: ${t.summary}`).join("\n") + `

Speak as a steward of a serious library, not a hype merchant. If a question is outside the library's scope, say so plainly and suggest the closest adjacent topic.`;

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
    system: GUIDE_SYSTEM + "\n\n" + context,
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
