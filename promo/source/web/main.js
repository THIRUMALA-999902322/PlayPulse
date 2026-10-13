import { THREE, scene, camera, composer, finalPass, bloom, loadFonts, skyDome, makeDust, el, CUES } from "./engine.js";
import { buildScenes, fx } from "./scenes.js";
import { clamp, smooth, prog, ease, bump, hit } from "./util.js";

const timeline = await (await fetch("timeline.json")).json();
const seg = await (await fetch("/vo/segments.json")).json();
const S = { timeline, vo: timeline.vo, seg };

await loadFonts();

const sky = skyDome(); scene.add(sky);
const dust = makeDust(); scene.add(dust);
const scenes = buildScenes(S);

// ───────────── global overlay: step header, progress rail, subtitles ─────────────

const stepEl = el("div", "step");
const numEl = el("div", "num", stepEl);
const wrapEl = el("div", "ttlwrap", stepEl);
const kickEl = el("div", "kicker", wrapEl);
const ttlEl = el("div", "ttl", wrapEl);
const subEl = el("div", "sub", wrapEl);

const steps = timeline.scenes.filter((s) => s.step);
const rail = el("div", "rail");
const railItems = steps.map((s, i) => {
  if (i) el("div", "sep", rail);
  return el("div", "it", rail, `<b>0${s.step}</b>${s.title.toUpperCase()}`);
});
const railSeps = [...rail.querySelectorAll(".sep")];

const subsWrap = el("div", "subs");
const subSpan = el("span", "", subsWrap);
const subs = [];
for (const [id, groups] of Object.entries(timeline.subtitles)) {
  for (const [a, b, text] of groups) subs.push({ start: S.vo[id] + seg[id][a][0] - 0.1, end: S.vo[id] + seg[id][b][1] + 0.3, text });
}
subs.sort((x, y) => x.start - y.start);
for (let i = 0; i < subs.length - 1; i++) subs[i].end = Math.min(subs[i].end, subs[i + 1].start - 0.04);

function overlay(t, active) {
  const def = active.def;
  if (def.step) {
    const lt = t - def.start, D = def.end - def.start;
    const inA = prog(0.15, 0.7, lt, ease.outExpo), out = prog(D - 0.55, D - 0.15, lt, ease.inCubic);
    stepEl.style.display = "flex";
    numEl.textContent = String(def.step).padStart(2, "0");
    kickEl.innerHTML = `<i style="width:${44 * prog(0.1, 0.6, lt)}px"></i>STEP 0${def.step} OF 06`;
    ttlEl.textContent = def.title.toUpperCase();
    subEl.textContent = def.sub;
    numEl.style.opacity = inA * (1 - out);
    numEl.style.transform = `translateX(${(1 - inA) * -50 - out * 30}px)`;
    ttlEl.style.transform = `translateY(${(1 - prog(0.22, 0.75, lt, ease.outExpo)) * 105 + out * -105}%)`;
    kickEl.style.opacity = prog(0.2, 0.6, lt) * (1 - out);
    subEl.style.opacity = prog(0.45, 0.95, lt) * (1 - out);
    subEl.style.transform = `translateY(${(1 - prog(0.45, 0.95, lt, ease.outCubic)) * 14}px)`;
  } else stepEl.style.display = "none";

  const railA = smooth(14.2, 14.8, t) * (1 - smooth(75.4, 75.9, t));
  rail.style.opacity = railA;
  rail.style.display = railA > 0 ? "flex" : "none";
  const cur = def.step || 0;
  railItems.forEach((it, i) => { it.className = `it ${i + 1 < cur ? "done" : i + 1 === cur ? "on" : ""}`; });
  railSeps.forEach((s, i) => { s.className = `sep ${i + 1 < cur ? "done" : ""}`; });

  const sub = subs.find((s) => t >= s.start && t < s.end);
  if (sub) {
    const a = Math.min(smooth(sub.start, sub.start + 0.14, t), 1 - smooth(sub.end - 0.12, sub.end, t));
    subSpan.textContent = sub.text;
    subsWrap.style.opacity = a;
    subsWrap.style.transform = `translateY(${(1 - a) * 8}px)`;
  } else subsWrap.style.opacity = 0;
}

// ───────────── transitions ─────────────

function transitions(t) {
  for (const tr of timeline.transitions) {
    const d = t - tr.at;
    if (Math.abs(d) > 0.6) continue;
    const b = bump(tr.at, 0.13, t);
    if (tr.kind === "flash") { fx.flash += d < 0 ? smooth(-0.12, 0, d) * 0.85 : hit(0, 0.11, d) * 0.85; fx.ca += b * 0.01; }
    if (tr.kind === "zoom") { fx.zoom += b * 1.1; fx.ca += b * 0.014; fx.flash += hit(0, 0.12, d) * 0.12; }
    if (tr.kind === "whip") { finalPass.uniforms.uWhip.value.x += b * 0.16; fx.ca += b * 0.008; }
    if (tr.kind === "whipv") { finalPass.uniforms.uWhip.value.y += b * 0.16; fx.ca += b * 0.008; }
    if (tr.kind === "glitch") { fx.glitch += bump(tr.at, 0.09, t) * 1.1; fx.ca += b * 0.016; fx.flash += hit(0, 0.06, d) * 0.15; }
  }
}

// ───────────── frame entry point ─────────────

const FPS = timeline.fps;
window.__cues = CUES.slice().sort((a, b) => a.t - b.t);
window.__frames = Math.round(timeline.duration * FPS);

window.__render = (frame) => {
  const t = frame / FPS;
  for (const k in fx) fx[k] = 0;
  finalPass.uniforms.uWhip.value.set(0, 0);
  const active = scenes.find((s) => t >= s.start && t < s.end) || scenes[scenes.length - 1];
  for (const s of scenes) {
    const on = s === active;
    for (const o of s.objects) o.visible = on;
    for (const d of s.dom) d.style.display = on ? "" : "none";
  }
  active.update(t, t - active.start);
  sky.position.copy(camera.position);
  dust.userData.update(t, camera.position);
  scene.updateMatrixWorld(true);
  overlay(t, active);
  transitions(t);

  const u = finalPass.uniforms;
  u.uZoom.value = Math.min(fx.zoom, 1.6);
  u.uCA.value = 0.0018 + Math.min(fx.ca, 0.04);
  u.uGlitch.value = Math.min(fx.glitch, 1.2);
  u.uFlash.value = Math.min(fx.flash, 1);
  u.uFlashColor.value.setRGB(0.85, 1, 0.93);
  u.uFade.value = clamp(fx.fade + (1 - smooth(0, 0.35, t)));
  u.uSeed.value = (frame * 0.6180339) % 1 * 100;
  bloom.strength = 0.5 + Math.min(fx.bloom, 1.0) * 0.8;
  composer.render();
  return t;
};

window.__ready = true;
