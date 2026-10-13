// Renderer, post-processing and the shared building blocks every scene uses.

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { TTFLoader } from "three/addons/loaders/TTFLoader.js";
import { Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import * as UI from "./ui.js";
import { clamp, mulberry32 } from "./util.js";

export { THREE };
export const WIDTH = 1920, HEIGHT = 1080;
export const C = {
  accent: new THREE.Color("#00F5A0"), purple: new THREE.Color("#7B5EA7"), blue: new THREE.Color("#4A9EFF"),
  danger: new THREE.Color("#FF4757"), warning: new THREE.Color("#FFB800"), white: new THREE.Color("#F0F4FF"),
  bg: new THREE.Color("#060910"),
};

// ───────────────────────────── renderer ─────────────────────────────

export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("stage").appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = C.bg.clone();
scene.fog = new THREE.FogExp2("#060910", 0.035);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

export const camera = new THREE.PerspectiveCamera(35, WIDTH / HEIGHT, 0.05, 400);
scene.add(camera);

scene.add(new THREE.AmbientLight("#8090c0", 0.25));
export const keyLight = new THREE.DirectionalLight("#dfe8ff", 1.6);
keyLight.position.set(4, 8, 6);
scene.add(keyLight);
export const rimA = new THREE.PointLight("#00F5A0", 30, 30, 2);
export const rimB = new THREE.PointLight("#7B5EA7", 30, 30, 2);
scene.add(rimA, rimB);

// ───────────────────────────── post ─────────────────────────────

const rt = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { type: THREE.HalfFloatType, samples: 4 });
export const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(WIDTH, HEIGHT), 0.55, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

export const finalPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(WIDTH, HEIGHT) },
    uZoom: { value: 0 }, uWhip: { value: new THREE.Vector2() }, uGlitch: { value: 0 },
    uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) }, uCA: { value: 0.002 },
    uVig: { value: 0.55 }, uGrain: { value: 0.035 }, uFade: { value: 0 }, uSeed: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 uRes, uWhip; uniform vec3 uFlashColor;
    uniform float uZoom, uGlitch, uFlash, uCA, uVig, uGrain, uFade, uSeed;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed * 0.731) * 43758.5453); }
    vec3 samp(vec2 uv){
      vec2 d = uv - 0.5; vec2 o = d * uCA * (0.6 + dot(d, d) * 3.0);
      return vec3(texture2D(tDiffuse, uv + o).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - o).b);
    }
    void main(){
      vec2 uv = vUv;
      if (uGlitch > 0.001) {
        float band = floor(uv.y * 18.0 + floor(uSeed * 3.0));
        float r = hash(vec2(band, floor(uSeed * 11.0)));
        if (r < uGlitch * 0.7) uv.x += (hash(vec2(band, 7.3)) - 0.5) * 0.22 * uGlitch;
        float fine = floor(uv.y * 120.0);
        if (hash(vec2(fine, uSeed)) < uGlitch * 0.15) uv.x += (hash(vec2(fine, 1.7)) - 0.5) * 0.05;
      }
      vec3 col;
      if (uZoom > 0.002 || dot(uWhip, uWhip) > 0.000004) {
        col = vec3(0.0);
        for (int i = 0; i < 18; i++) {
          float t = float(i) / 17.0 - 0.5;
          vec2 off = (uv - 0.5) * uZoom * t * 0.42 + uWhip * t;
          col += samp(uv - off);
        }
        col /= 18.0;
      } else col = samp(uv);
      if (uGlitch > 0.001) {
        float s = 0.018 * uGlitch;
        col.r = mix(col.r, texture2D(tDiffuse, uv + vec2(s, 0.0)).r, 0.8);
        col.b = mix(col.b, texture2D(tDiffuse, uv - vec2(s, 0.0)).b, 0.8);
      }
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.82);
      col *= 1.0 - uVig * dot(d, d) * 2.4;
      col += uFlashColor * uFlash;
      col *= 1.0 - uFade;
      col += (hash(vUv * uRes) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(finalPass);

// ───────────────────────────── textures ─────────────────────────────

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const glowTex = canvasTex(256, 256, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.18, "rgba(255,255,255,.55)");
  r.addColorStop(0.5, "rgba(255,255,255,.12)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
export const dotTex = canvasTex(64, 64, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
export const ringTex = canvasTex(256, 256, (g, w) => {
  g.strokeStyle = "#fff"; g.lineWidth = 10; g.shadowColor = "#fff"; g.shadowBlur = 16;
  g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 20, 0, Math.PI * 2); g.stroke();
});
export const streakTex = canvasTex(256, 16, (g, w, h) => {
  const r = g.createLinearGradient(0, 0, w, 0);
  r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.85, "rgba(255,255,255,.9)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, h * 0.3, w, h * 0.4);
});

/** Wraps a ui.js canvas as a texture. */
export function uiTexture(ctx, mip = true) {
  const t = new THREE.CanvasTexture(ctx.c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}

// ───────────────────────────── factories ─────────────────────────────

export function sprite(tex, color = 0xffffff, scale = 1, additive = true, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !additive });
  const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s;
}

/** Flat textured card. `px` is the canvas logical width mapped to `width` world units. */
export function card(ctx, width, opts = {}) {
  const tex = uiTexture(ctx, opts.mip !== false);
  const h = width * (ctx.h / ctx.w);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: opts.depthWrite ?? false,
    side: THREE.DoubleSide, color: new THREE.Color(opts.tint ?? 0.92, opts.tint ?? 0.92, opts.tint ?? 0.92) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, h), mat);
  mesh.userData = { ctx, tex, h };
  return mesh;
}

export function labelSprite(text, opts = {}, worldH = 0.3) {
  const ctx = UI.drawLabel(text, opts);
  const tex = uiTexture(ctx);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.scale.set(worldH * ctx.w / ctx.h, worldH, 1);
  return s;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function roundedPlane(w, h, r) {
  const geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 12);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return geo;
}

const phoneBodyMat = new THREE.MeshStandardMaterial({ color: "#151a26", metalness: 0.92, roughness: 0.28 });
const phoneFrameMat = new THREE.MeshStandardMaterial({ color: "#3a4256", metalness: 1, roughness: 0.22 });
const glassMat = new THREE.MeshBasicMaterial({ color: "#000", toneMapped: false });

/**
 * A phone with a live canvas screen. `phone.draw(state)` repaints it.
 * Screen space is the 390x844 ui.js coordinate system.
 */
export function makePhone(drawFn) {
  const group = new THREE.Group();
  const SW = 0.78, SH = SW * (UI.H / UI.W);
  const body = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.07, SH + 0.07, 0.085, 6, 0.1), phoneBodyMat);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.085, SH + 0.085, 0.07, 6, 0.1), phoneFrameMat);
  const glass = new THREE.Mesh(roundedPlane(SW + 0.03, SH + 0.03, 0.1), glassMat);
  glass.position.z = 0.0435;
  const ctx = UI.makeCanvas();
  const tex = uiTexture(ctx);
  const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.98, 0.98, 0.98) });
  const screen = new THREE.Mesh(roundedPlane(SW, SH, 0.085), screenMat);
  screen.position.z = 0.0445;
  // Faint glass sheen so the screen reads as a surface when the camera moves.
  const sheen = new THREE.Mesh(roundedPlane(SW, SH, 0.085), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uShift: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uShift;
      void main(){ float b = vUv.x * 0.8 + vUv.y * 0.6 + uShift; float s = smoothstep(0.0, 0.08, b - 0.9) * smoothstep(0.3, 0.1, b - 0.9);
      gl_FragColor = vec4(vec3(1.0), s * 0.10); }`,
  }));
  sheen.position.z = 0.046;
  for (const [y, h] of [[0.42, 0.16], [0.2, 0.1], [0.05, 0.1]]) {
    const btn = new THREE.Mesh(new RoundedBoxGeometry(0.02, h, 0.03, 2, 0.008), phoneFrameMat);
    btn.position.set(-(SW + 0.085) / 2 - 0.006, y, 0); group.add(btn);
  }
  group.add(frame, body, glass, screen, sheen);
  const phone = {
    group, ctx, tex, screen, SW, SH, sheen,
    draw(state) { drawFn(ctx, state); tex.needsUpdate = true; },
    /** Screen pixel (ui.js coords) → world position. */
    uiToWorld(x, y, out = new THREE.Vector3()) {
      out.set((x / UI.W - 0.5) * SW, (0.5 - y / UI.H) * SH, 0.05);
      return group.localToWorld(out);
    },
  };
  return phone;
}

/** Soft glow card that sits behind a phone. */
export function halo(color = C.accent, size = 3.2, opacity = 0.35) {
  return sprite(glowTex, color, size, true, opacity);
}

// ───────────────────────────── brand ─────────────────────────────

export let bebas = null;
export async function loadFonts() {
  const fams = ['400 20px "Bebas Neue"', "400 20px Outfit", "500 20px Outfit", "600 20px Outfit", "700 20px Outfit", "800 20px Outfit", '20px "Noto Color Emoji"'];
  await Promise.all(fams.map((f) => document.fonts.load(f, "A🏏⚽")));
  await document.fonts.ready;
  const json = await new TTFLoader().loadAsync("/node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff");
  bebas = new Font(json);
}

export function text3D(str, size, opts = {}) {
  const geo = new TextGeometry(str, {
    font: bebas, size, depth: opts.depth ?? size * 0.18, curveSegments: 8,
    bevelEnabled: true, bevelThickness: size * 0.025, bevelSize: size * 0.018, bevelSegments: 3,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (opts.center !== false) geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2);
  return geo;
}

export const chromeMat = new THREE.MeshStandardMaterial({ color: "#e8eeff", metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });
export const accentMat = new THREE.MeshStandardMaterial({ color: "#00F5A0", emissive: "#00F5A0", emissiveIntensity: 0.75, metalness: 0.3, roughness: 0.3 });

/** The PlayPulse bolt from public/icon.svg, extruded. */
export function boltGeometry(height = 2, depth = 0.32) {
  const pts = [[295, 72], [148, 272], [236, 272], [210, 440], [374, 228], [272, 228]];
  const k = height / (440 - 72);
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => { const px = (x - 261) * k, py = -(y - 256) * k; i ? s.lineTo(px, py) : s.moveTo(px, py); });
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** Bolt + PLAYPULSE lockup, shared by the reveal and the end card. */
export function makeLockup() {
  const g = new THREE.Group();
  const bolt = new THREE.Group();
  const boltMesh = new THREE.Mesh(boltGeometry(2.3, 0.36), accentMat);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boltGeometry(2.3, 0.36), 30),
    new THREE.LineBasicMaterial({ color: "#c8fff0", transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
  bolt.add(boltMesh, edges);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.035, 12, 120),
    new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.6), transparent: true, opacity: 0.5, toneMapped: false }));
  bolt.add(ring);
  const play = new THREE.Mesh(text3D("PLAY", 2, { center: false }), chromeMat);
  const pulse = new THREE.Mesh(text3D("PULSE", 2, { center: false }), accentMat);
  const pb = play.geometry.boundingBox, ub = pulse.geometry.boundingBox;
  // Scale the wordmark so its cap height matches 70% of the bolt.
  const capH = pb.max.y - pb.min.y;
  const k = (2.3 * 0.7) / capH;
  pulse.position.x = pb.max.x + 0.08 / k;
  const word = new THREE.Group(); word.add(play, pulse);
  word.scale.setScalar(k);
  const wordW = (pulse.position.x + ub.max.x) * k;
  const boltW = 1.45, gap = 0.55, total = boltW + gap + wordW;
  bolt.position.x = -total / 2 + boltW / 2;
  word.position.set(-total / 2 + boltW + gap, -(pb.min.y + capH / 2) * k, 0);
  g.add(bolt, word);
  const glow = halo(C.accent, 6, 0.22); glow.position.set(bolt.position.x, 0, -0.6); g.add(glow);
  return { group: g, bolt, ring, word, play, pulse, glow, wordWidth: wordW, total };
}

// ───────────────────────────── environment pieces ─────────────────────────────

export function gridFloor(y = -1.6, color = "#1E2a48", accent = "#00F5A0") {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uAccent: { value: new THREE.Color(accent) }, uFade: { value: 1 }, uScroll: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uColor, uAccent, uCam; uniform float uFade, uScroll; varying vec3 vW;
      float line(vec2 p, float s){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y), 1.0); }
      void main(){
        vec2 p = vW.xz + vec2(0.0, uScroll);
        float minor = line(p, 0.5) * 0.35, major = line(p, 2.5);
        float d = length(vW.xz - uCam.xz);
        float fade = exp(-d * 0.09) * uFade;
        vec3 col = uColor * minor + mix(uColor * 1.6, uAccent, 0.35) * major;
        gl_FragColor = vec4(col * 1.4, (minor + major) * fade);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y;
  m.renderOrder = -1;
  return m;
}

/** Drifting dust around the camera; positions are a pure function of time. */
export function makeDust(n = 1400, extent = 24) {
  const rnd = mulberry32(7);
  const base = new Float32Array(n * 3), vel = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    base[i * 3] = (rnd() - 0.5) * extent; base[i * 3 + 1] = (rnd() - 0.5) * extent * 0.6; base[i * 3 + 2] = (rnd() - 0.5) * extent;
    vel[i * 3] = (rnd() - 0.5) * 0.08; vel[i * 3 + 1] = rnd() * 0.06 + 0.01; vel[i * 3 + 2] = (rnd() - 0.5) * 0.08;
    const c = rnd() < 0.55 ? C.accent : rnd() < 0.5 ? C.blue : C.white;
    const k = 0.25 + rnd() * 0.5;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, map: dotTex, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  pts.frustumCulled = false;
  const wrapv = (v, c, e) => c + ((((v - c) % e) + e * 1.5) % e) - e / 2;
  pts.userData.update = (t, cam) => {
    for (let i = 0; i < n; i++) {
      pos[i * 3] = wrapv(base[i * 3] + vel[i * 3] * t, cam.x, extent);
      pos[i * 3 + 1] = wrapv(base[i * 3 + 1] + vel[i * 3 + 1] * t, cam.y, extent * 0.6);
      pos[i * 3 + 2] = wrapv(base[i * 3 + 2] + vel[i * 3 + 2] * t, cam.z, extent);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

/** Burst of sparks; `update(dt)` places them `dt` seconds after the burst. */
export function makeBurst(n, opts = {}) {
  const rnd = mulberry32(opts.seed ?? 3);
  const dir = new Float32Array(n * 3), speed = new Float32Array(n), col = new Float32Array(n * 3), pos = new Float32Array(n * 3);
  const palette = opts.palette || [C.accent, C.white, C.accent, C.purple];
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    const flat = opts.flat ?? 0.35;
    dir[i * 3] = Math.sin(ph) * Math.cos(th); dir[i * 3 + 1] = Math.cos(ph) * (1 - flat) + (opts.up ?? 0); dir[i * 3 + 2] = Math.sin(ph) * Math.sin(th);
    speed[i] = (opts.speed ?? 6) * (0.35 + rnd() * 0.9);
    const c = palette[Math.floor(rnd() * palette.length)];
    const k = 1.2 + rnd() * 1.6;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col.slice(), 3));
  const mat = new THREE.PointsMaterial({ size: opts.size ?? 0.09, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const drag = opts.drag ?? 2.6, grav = opts.gravity ?? 1.2, life = opts.life ?? 1.6;
  pts.userData.update = (dt) => {
    pts.visible = dt >= 0 && dt < life;
    if (!pts.visible) return;
    const travel = (1 - Math.exp(-drag * dt)) / drag;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = dir[i * 3] * speed[i] * travel;
      pos[i * 3 + 1] = dir[i * 3 + 1] * speed[i] * travel - 0.5 * grav * dt * dt;
      pos[i * 3 + 2] = dir[i * 3 + 2] * speed[i] * travel;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = clamp(1 - dt / life) ** 1.5;
  };
  return pts;
}

export function shockRing(color = C.accent) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 128),
    new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.userData.update = (dt, maxR = 8, life = 0.9) => {
    m.visible = dt >= 0 && dt < life;
    if (!m.visible) return;
    const p = 1 - Math.pow(1 - dt / life, 3);
    m.scale.setScalar(0.2 + p * maxR);
    m.material.opacity = (1 - dt / life) ** 1.2;
  };
  return m;
}

/** Sky dome with soft colour pools, following the camera. */
export function skyDome() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uA: { value: new THREE.Color("#0c1a2c") }, uB: { value: new THREE.Color("#140c26") }, uK: { value: 1 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vD; uniform vec3 uA, uB; uniform float uK;
      void main(){ vec3 base = vec3(0.016, 0.022, 0.04);
        float a = pow(max(dot(vD, normalize(vec3(-0.6, 0.25, -0.75))), 0.0), 4.0);
        float b = pow(max(dot(vD, normalize(vec3(0.7, 0.1, -0.7))), 0.0), 5.0);
        float h = smoothstep(-0.3, 0.6, vD.y);
        gl_FragColor = vec4((base + uA * a * 0.9 + uB * b * 1.1) * uK * (0.7 + 0.3 * h), 1.0); }`,
  }));
  m.renderOrder = -2;
  return m;
}

// ───────────────────────────── overlay (DOM) ─────────────────────────────

const ov = document.getElementById("ov");
export function el(tag, cls, parent = ov, html = "") {
  const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; parent.appendChild(e); return e;
}
export function style(e, s) { for (const k in s) e.style[k] = s[k]; }

const svg = document.getElementById("lines");
const tmpV = new THREE.Vector3();
export function project(v) {
  tmpV.copy(v).project(camera);
  return { x: (tmpV.x * 0.5 + 0.5) * WIDTH, y: (-tmpV.y * 0.5 + 0.5) * HEIGHT, behind: tmpV.z > 1 };
}

/** Callout: dot on a 3D anchor, elbow line, and a label box. */
export function makeCallout(html, cls = "") {
  const box = el("div", `callout ${cls}`, ov, html);
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  line.setAttribute("class", "cl-line"); dot.setAttribute("class", "cl-dot"); dot.setAttribute("r", "6");
  svg.appendChild(line); svg.appendChild(dot);
  return {
    box,
    set(anchor, dx, dy, a, color = "#00F5A0") {
      if (a <= 0.001) { box.style.opacity = 0; line.style.opacity = 0; dot.style.opacity = 0; return; }
      const p = project(anchor);
      const lx = p.x + dx, ly = p.y + dy;
      const grow = clamp(a * 1.6);
      const ex = p.x + (lx - p.x) * grow, ey = p.y + (ly - p.y) * grow;
      const midX = p.x + (ex - p.x) * 0.35;
      line.setAttribute("points", `${p.x},${p.y} ${midX},${ey} ${ex},${ey}`);
      line.style.opacity = a; line.style.stroke = color;
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.style.opacity = a; dot.style.fill = color;
      const ba = clamp(a * 2 - 0.6);
      box.style.opacity = ba;
      box.style.borderColor = color;
      const w = box.offsetWidth;
      box.style.transform = `translate(${dx >= 0 ? lx : lx - w}px, ${ly - 24}px) translateX(${(1 - ba) * (dx >= 0 ? -16 : 16)}px)`;
    },
  };
}

/** Straight projected line between two 3D points, drawn crisp in SVG. */
export function makeLink() {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  line.setAttribute("class", "cl-line"); dot.setAttribute("r", "5");
  svg.appendChild(line); svg.appendChild(dot);
  return {
    set(a3, b3, a, color = "#00F5A0", dash = false) {
      if (a <= 0.001) { line.style.opacity = 0; dot.style.opacity = 0; return; }
      const p = project(a3), q = project(b3);
      line.setAttribute("x1", p.x); line.setAttribute("y1", p.y);
      line.setAttribute("x2", p.x + (q.x - p.x) * clamp(a * 1.4)); line.setAttribute("y2", p.y + (q.y - p.y) * clamp(a * 1.4));
      line.style.opacity = a * 0.85; line.style.stroke = color; line.style.strokeDasharray = dash ? "6 6" : "none";
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.style.opacity = a; dot.style.fill = color;
    },
  };
}

// ───────────────────────────── sound cues ─────────────────────────────

/** Every sound effect is registered here so the mix lines up with the picture. */
export const CUES = [];
export const cue = (t, type, gain = 1, idx = 0) => { CUES.push({ t: +t.toFixed(3), type, gain, idx }); return t; };
