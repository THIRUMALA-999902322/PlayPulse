// The nine scenes of the film. Each returns { id, start, end, objects, update(t, lt), fx }.
// Timing comes from timeline.json and the narration's measured phrase boundaries,
// so on-screen events land on the spoken words they illustrate.

import {
  THREE, C, camera, rimA, rimB, keyLight, scene, glowTex, dotTex, streakTex, uiTexture, sprite, card, labelSprite,
  makePhone, halo, makeLockup, text3D, gridFloor, makeBurst, shockRing, el, style, makeCallout, makeLink, cue,
} from "./engine.js";
import * as UI from "./ui.js";
import { clamp, lerp, inv, smooth, ease, prog, win, bump, hit, mulberry32, noise1 } from "./util.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));

export function setCam(pos, target, fov = 35, roll = 0) {
  camera.position.copy(pos);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(target);
  if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/** Hold-and-move camera keys: [[time, pos[3], target[3]], ...] eased between neighbours. */
function camKeys(list, lt, fn = ease.inOutCubic) {
  if (lt <= list[0][0]) return [V(...list[0][1]), V(...list[0][2])];
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, p0, q0] = list[i], [t1, p1, q1] = list[i + 1];
    if (lt <= t1) { const k = fn((lt - t0) / (t1 - t0)); return [lerpV(p0, p1, k), lerpV(q0, q1, k)]; }
  }
  const l = list[list.length - 1];
  return [V(...l[1]), V(...l[2])];
}

function drift(t, amt = 0.06, seed = 1) {
  return V(noise1(t * 0.35, seed) * amt, noise1(t * 0.3, seed + 5) * amt * 0.7, noise1(t * 0.25, seed + 9) * amt * 0.5);
}
function shake(t, amt, seed = 3) {
  return V(noise1(t * 22, seed) * amt, noise1(t * 24, seed + 2) * amt, 0);
}

/** Group visibility & fx accumulators shared with main.js. */
export const fx = { zoom: 0, ca: 0, flash: 0, glitch: 0, fade: 0, bloom: 0 };

// ═════════════════════════════ 0. HOOK ═════════════════════════════

function hook(ctx) {
  const { S } = ctx;
  const g = new THREE.Group();
  const msgs = [
    ["anyone free saturday??", "Rahul", "#FF6B6B"], ["who's in for footy tmrw", "Priya", "#FFB800"],
    ["need 2 more players!!", "Sam", "#4ECDC4"], ["where's the ground again?", "Meera", "#A29BFE"],
    ["is it still on? 🤔", "Kabir", "#FD79A8"], ["sorry can't make it 😕", "Dev", "#74B9FF"],
    ["what time??", "Aisha", "#55EFC4"], ["did anyone book the court?", "Arjun", "#FFB800"],
    ["pls reply 🙏", "Zoe", "#FF6B6B"], ["count me in... maybe", "Rahul", "#4ECDC4"],
    ["which group is this lol", "Sam", "#A29BFE"], ["???", "Priya", "#FD79A8"],
    ["bringing the ball?", "Kabir", "#74B9FF"], ["moved to 6pm. no wait, 7", "Meera", "#55EFC4"],
  ];
  const mats = msgs.map(([s, who, c]) => {
    const w = Math.max(230, Math.min(400, 96 + s.length * 9.2));
    const cx = UI.drawBubble(s, who, c, w);
    return { mat: new THREE.MeshBasicMaterial({ map: uiTexture(cx), transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(0.9, 0.9, 0.9) }), w, h: cx.h };
  });
  const N = 38, rnd = mulberry32(11);
  const bubbles = [];
  for (let i = 0; i < N; i++) {
    const m = mats[i % mats.length];
    const wu = (m.w / 300) * 2.3;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wu, wu * m.h / m.w), m.mat);
    // Spread on a shell so the centre stays clear for the type.
    let x, y, z; do { x = (rnd() - 0.5) * 15; y = (rnd() - 0.5) * 8.2; z = -rnd() * 7 + 1.6; } while (Math.abs(x) < 4.4 + z * 0.3 && Math.abs(y) < 2.1 + z * 0.15);
    const home = V(x, y, z);
    const rot = V((rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.25);
    const t0 = 0.2 + 3.7 * Math.sqrt(i / (N - 1));
    bubbles.push({ mesh, home, rot, t0, seed: rnd() * 100 });
    g.add(mesh);
    cue(t0, "notif", i < 8 ? 1 : 0.55);
  }
  // unread badge
  const badgeCx = UI.makeCanvas(200, 200, 2); const badgeTex = uiTexture(badgeCx);
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true, toneMapped: false, depthWrite: false }));
  badge.scale.setScalar(1.4); badge.position.set(3.3, 1.8, 1.0); g.add(badge);
  let lastCount = -1;
  const drawBadge = (n) => {
    const { g: b } = badgeCx; b.clearRect(0, 0, 200, 200);
    b.save(); b.shadowColor = "#FF4757"; b.shadowBlur = 30; b.beginPath(); b.arc(100, 100, 74, 0, Math.PI * 2); b.fillStyle = "#FF4757"; b.fill(); b.restore();
    b.lineWidth = 6; b.strokeStyle = "#080B14"; b.stroke();
    UI.txt(b, n >= 50 ? "50+" : String(n), 100, 104, UI.F(800, n >= 50 ? 52 : 64), "#fff", "center", 0, "middle");
    badgeTex.needsUpdate = true;
  };

  // kinetic type
  const lines = [
    el("div", "kin", undefined, "<span>FINDING A GAME</span>"),
    el("div", "kin", undefined, "<span>SHOULDN'T TAKE</span>"),
    el("div", "kin", undefined, '<span class="red">50 MESSAGES.</span>'),
  ];
  style(lines[0], { top: "345px", fontSize: "118px" });
  style(lines[1], { top: "468px", fontSize: "118px" });
  style(lines[2], { top: "585px", fontSize: "168px" });
  const wordT = [S.vo.hook + 0.08, S.vo.hook + 0.86, S.vo.hook + 1.5];
  wordT.forEach((t) => cue(t, "type_hit", 0.8));
  cue(4.35, "glitch"); cue(4.95, "glitch", 0.8); cue(5.25, "glitch", 1); cue(5.3, "implode"); cue(6.0, "boom");

  const halo1 = halo(C.danger, 9, 0.12); halo1.position.set(0, 0, -6); g.add(halo1);

  return {
    id: "hook", objects: [g],
    update(t) {
      const chaos = smooth(4.2, 5.3, t), implode = prog(5.3, 5.85, t, ease.inExpo);
      bubbles.forEach((b, i) => {
        const a = prog(b.t0, b.t0 + 0.35, t, ease.outBack);
        const s = a * (1 - implode);
        b.mesh.visible = s > 0.001;
        const j = chaos * 0.35;
        const p = V(b.home.x + noise1(t * 9 + b.seed, i) * j, b.home.y + Math.sin(t * 1.3 + b.seed) * 0.08 + noise1(t * 8 + b.seed, i + 3) * j, b.home.z);
        p.lerp(V(0, 0, -2), implode);
        b.mesh.position.copy(p);
        b.mesh.rotation.set(b.rot.x + noise1(t * 6, i) * chaos * 0.4, b.rot.y + noise1(t * 5, i + 1) * chaos * 0.5, b.rot.z + (1 - a) * 0.6);
        b.mesh.scale.setScalar(Math.max(s, 0.0001));
      });
      const popped = bubbles.filter((b) => t >= b.t0).length;
      const n = Math.min(50, Math.round(popped * 1.4));
      if (n !== lastCount) { drawBadge(n); lastCount = n; }
      const lastPop = Math.max(...bubbles.filter((b) => t >= b.t0).map((b) => b.t0), -9);
      badge.visible = popped > 0 && implode < 1;
      badge.scale.setScalar((1.25 + 0.35 * hit(lastPop, 0.12, t)) * (1 - implode));
      badge.position.lerp(V(0, 0, -2), implode);
      halo1.material.opacity = 0.08 + 0.18 * chaos;

      const cpos = V(Math.sin(t * 0.4) * 0.35, 0.15, 9.2 - t * 0.35).add(shake(t, chaos * 0.06)).add(drift(t, 0.1));
      setCam(cpos, V(0, 0, -2), 35, Math.sin(t * 0.5) * 0.02 + noise1(t * 14, 4) * chaos * 0.02);

      lines.forEach((ln, i) => {
        const a = prog(wordT[i], wordT[i] + 0.32, t, ease.outExpo);
        const out = smooth(4.6, 5.25, t);
        const jx = chaos > 0.05 ? noise1(t * 30, i * 7) * 40 * chaos : 0;
        ln.style.opacity = clamp(a) * (1 - out);
        ln.style.letterSpacing = `${lerp(40, 6, a)}px`;
        ln.style.transform = `translateX(${jx}px) scale(${lerp(1.25, 1, a)})`;
        if (i === 2) ln.firstChild.style.textShadow = `${-6 * chaos}px 0 rgba(0,245,255,.7), ${6 * chaos}px 0 rgba(255,0,80,.7), 0 0 40px rgba(255,71,87,.6)`;
      });

      fx.glitch += bump(4.35, 0.05, t) * 0.7 + bump(4.95, 0.05, t) * 0.6 + bump(5.25, 0.07, t) * 0.9 + chaos * 0.08;
      fx.ca += chaos * 0.006;
      fx.zoom += implode * 0.8;
      fx.flash += smooth(5.72, 5.98, t) * 0.9;
    },
  };
}

// ═════════════════════════════ 1. LOGO ═════════════════════════════

function ecgPoints() {
  const pts = [];
  const beats = [-8, 1];
  for (let x = -15; x <= 9; x += 0.012) {
    let y = 0;
    for (const c of beats) {
      const d = x - c;
      y += 0.22 * Math.exp(-Math.pow((d + 0.85) / 0.18, 2));
      y += 0.5 * Math.exp(-Math.pow((d - 1.05) / 0.32, 2));
      if (d > -0.22 && d <= -0.08) y += lerp(0, -0.35, (d + 0.22) / 0.14);
      else if (d > -0.08 && d <= 0) y += lerp(-0.35, 2.3, (d + 0.08) / 0.08);
      else if (d > 0 && d <= 0.1) y += lerp(2.3, -0.8, d / 0.1);
      else if (d > 0.1 && d <= 0.22) y += lerp(-0.8, 0, (d - 0.1) / 0.12);
    }
    pts.push([x, y]);
  }
  return pts;
}

function logo(ctx) {
  const { S } = ctx;
  const g = new THREE.Group();
  // ECG strip
  const pts = ecgPoints();
  const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
  const pos = [], uvs = [], idx = [];
  const w = 0.04;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i]; const [xa, ya] = pts[Math.max(i - 1, 0)]; const [xb, yb] = pts[Math.min(i + 1, pts.length - 1)];
    let tx = xb - xa, ty = yb - ya; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    pos.push(x - ty * w, y + tx * w, 0, x + ty * w, y - tx * w, 0);
    const u = (x - x0) / (x1 - x0); uvs.push(u, 0, u, 1);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  const ecgMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uHead: { value: 0 }, uFade: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uHead, uFade;
      void main(){ float d = uHead - vUv.x; if (d < 0.0) discard;
        float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float trail = exp(-d * 5.0) * 0.85 + 0.15;
        float head = exp(-d * 260.0) * 6.0;
        vec3 col = vec3(0.0, 0.96, 0.63) * (1.6 * trail + head) + vec3(1.0) * head * 0.4;
        gl_FragColor = vec4(col * core * uFade, 1.0); }`,
  });
  const ecg = new THREE.Mesh(geo, ecgMat);
  const headGlow = sprite(glowTex, C.accent.clone().multiplyScalar(2.5), 1.4);
  const ecgGroup = new THREE.Group(); ecgGroup.add(ecg, headGlow);
  g.add(ecgGroup);
  const tStart = 6.0, tEnd = 7.75;
  const headX = (t) => lerp(-14.5, 6.5, inv(tStart, tEnd, t));
  // the beats pass x = -8 and x = 1
  cue(tStart + (6.5 / 21) * (tEnd - tStart), "heartbeat"); cue(tStart + (15.5 / 21) * (tEnd - tStart), "heartbeat");
  cue(6.0, "riser2");

  const L = makeLockup();
  g.add(L.group);
  const ring1 = shockRing(C.accent), ring2 = shockRing(C.white);
  ring1.position.set(L.bolt.position.x, 0, -0.4); ring2.position.copy(ring1.position);
  const burst = makeBurst(420, { speed: 9, flat: 0.1, life: 1.8, gravity: 0.8, size: 0.08 });
  burst.position.set(L.bolt.position.x, 0, 0);
  g.add(ring1, ring2, burst);
  const floor = gridFloor(-2.6); g.add(floor);

  const tDrop = 8.0, tSlam = 8.3;
  cue(tDrop, "drop"); cue(tSlam - 0.18, "whoosh_in", 0.7); cue(tSlam, "slam");
  const tag = el("div", "tagline", undefined, "<span>FIND A GAME.</span><span>JOIN IN.</span><span class='acc'>PLAY NOW.</span>");
  style(tag, { top: "790px" });
  const tagT = [10.0, 11.0, 12.0];
  tagT.forEach((tt) => cue(tt, "hit"));
  const tagSpans = [...tag.children];
  tagSpans[2].style.color = "#00F5A0"; tagSpans[2].style.textShadow = "0 0 30px rgba(0,245,160,.6)";
  cue(13.35, "whoosh_in", 1);

  return {
    id: "logo", objects: [g],
    update(t, lt) {
      const ecgOn = t < tDrop + 0.4;
      ecgGroup.visible = ecgOn;
      const hx = headX(t);
      ecgMat.uniforms.uHead.value = (hx - x0) / (x1 - x0);
      ecgMat.uniforms.uFade.value = 1 - smooth(7.7, 8.15, t);
      const hp = pts[Math.min(pts.length - 1, Math.max(0, Math.round((hx - x0) / 0.012)))];
      headGlow.position.set(hp[0], hp[1], 0.01);
      headGlow.material.opacity = 1 - smooth(7.7, 8.0, t);

      // brand
      const pop = prog(tDrop, tDrop + 0.55, t, ease.outBack);
      L.group.visible = t >= tDrop - 0.01;
      L.bolt.scale.setScalar(Math.max(pop, 0.001) * (1 + 0.06 * hit(tSlam, 0.15, t)));
      L.bolt.rotation.y = lerp(-2.8, 0, prog(tDrop, tDrop + 0.9, t, ease.outExpo)) + Math.sin(lt * 0.9) * 0.12 * smooth(9, 10, t);
      L.ring.rotation.x = Math.PI / 2 * 0 + Math.sin(lt * 0.7) * 0.4; L.ring.rotation.y = lt * 0.6;
      L.ring.scale.setScalar(1 + 0.25 * hit(tDrop, 0.3, t));
      const slam = prog(tDrop + 0.08, tSlam, t, ease.inCubic);
      L.word.position.z = lerp(-28, 0, slam) + Math.sin(prog(tSlam, tSlam + 0.4, t) * Math.PI) * 0.25 * (t > tSlam ? 1 : 0);
      L.word.visible = t >= tDrop + 0.08;
      L.glow.material.opacity = 0.1 * pop + 0.3 * hit(tDrop, 0.25, t);
      ring1.userData.update(t - tDrop, 9, 1.0);
      ring2.userData.update(t - tSlam, 6, 0.7);
      ring1.lookAt(camera.position); ring2.lookAt(camera.position);
      burst.userData.update(t - tDrop);
      floor.material.uniforms.uFade.value = smooth(tDrop, tDrop + 1, t) * 0.8;
      floor.material.uniforms.uCam.value.copy(camera.position);

      // camera: track the pulse head, then pull back for the reveal, then rush into the bolt
      let cp, ct;
      if (t < 7.7) {
        cp = V(hx - 2.2, 0.6 + Math.sin(t * 2) * 0.1, 6.2); ct = V(hx + 0.6, 0.3, 0);
      } else {
        const k = prog(7.7, 8.05, t, ease.inOutCubic);
        const orbit = lt - 2;
        const base = V(Math.sin(orbit * 0.22) * 1.6, 0.5 + Math.sin(orbit * 0.3) * 0.2, 13.4 - orbit * 0.14);
        cp = V(lerp(6.5 - 2.2, base.x, k), lerp(0.6, base.y, k), lerp(6.2, base.z, k));
        ct = V(lerp(7.1, 0, k), lerp(0.3, -0.25, k), 0);
        const rush = prog(13.35, 14.0, t, ease.inExpo);
        cp.lerp(V(L.bolt.position.x, 0.05, 0.9), rush);
        ct.lerp(V(L.bolt.position.x, 0, 0), rush);
      }
      cp.add(shake(t, 0.12 * hit(tSlam, 0.18, t) + 0.08 * hit(tDrop, 0.2, t)));
      setCam(cp, ct);
      rimA.position.set(-6 + Math.sin(lt) * 3, 3, 4); rimB.position.set(6, -2, 3);
      rimA.intensity = 60; rimB.intensity = 50;
      keyLight.position.set(Math.sin(lt * 0.5) * 8, 6, 8);

      tagSpans.forEach((s, i) => {
        const a = prog(tagT[i], tagT[i] + 0.3, t, ease.outExpo);
        s.style.opacity = a * (1 - smooth(13.2, 13.5, t));
        s.style.transform = `translateY(${(1 - a) * 30}px) scale(${lerp(1.5, 1, a)})`;
        s.style.filter = "none";
      });

      fx.zoom += hit(tDrop, 0.12, t) * 0.5 + bump(tSlam - 0.05, 0.06, t) * 0.7;
      fx.ca += hit(tDrop, 0.25, t) * 0.012 + hit(tSlam, 0.2, t) * 0.01;
      fx.flash += hit(tDrop, 0.08, t) * 0.5;
      fx.bloom += hit(tDrop, 0.4, t) * 0.8;
      for (const tt of tagT) fx.ca += hit(tt, 0.1, t) * 0.006;
    },
  };
}

// ═════════════════════════════ 2. DISCOVER ═════════════════════════════

function cityTexture() {
  const N = 2048, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d");
  g.fillStyle = "#070B16"; g.fillRect(0, 0, N, N);
  const px = N / 80; // 80 world units
  // parks
  const rnd = mulberry32(5);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = "#0A1E1A"; g.beginPath();
    g.ellipse(rnd() * N, rnd() * N, (1.5 + rnd() * 3) * px, (1 + rnd() * 2) * px, rnd() * 3, 0, Math.PI * 2); g.fill();
  }
  // river
  g.strokeStyle = "#0B1A33"; g.lineWidth = 3.2 * px; g.beginPath(); g.moveTo(0, N * 0.18);
  g.bezierCurveTo(N * 0.35, N * 0.32, N * 0.55, N * 0.02, N, N * 0.28); g.stroke();
  g.strokeStyle = "#16305a"; g.lineWidth = 2; g.stroke();
  // streets on a 4-unit grid
  for (let i = 0; i <= 20; i++) {
    const p = i * 4 * px, major = i % 5 === 0;
    g.strokeStyle = major ? "#1B2A50" : "#121a32"; g.lineWidth = (major ? 1.1 : 0.7) * px;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke();
    g.strokeStyle = major ? "rgba(74,158,255,.55)" : "rgba(74,158,255,.18)"; g.lineWidth = major ? 3 : 1.5;
    g.setLineDash([10, 14]);
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke();
    g.setLineDash([]);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

const PIN_SPOTS = [
  // [match index, x, z]
  [0, -1.8, -1], [1, 2, 3.9], [2, 4.4, 1.5], [3, -4.2, 1.8], [4, 2, -2], [5, -2.1, 5.8],
];

function makePin(m, live) {
  const g = new THREE.Group();
  const col = new THREE.Color(UI.SPORT_COLOR[m.sport] || "#74B9FF");
  const ringCol = live ? C.danger : col;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 2.6, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: ringCol.clone().multiplyScalar(1.6), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  beam.position.y = 1.3;
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(m.emoji, live ? "#FF4757" : UI.SPORT_COLOR[m.sport], live ? "#2a0f18" : "#0F1320")), transparent: true, depthWrite: false, toneMapped: false }));
  disc.scale.setScalar(1.05); disc.position.y = 2.75;
  const glow = sprite(glowTex, ringCol.clone().multiplyScalar(1.5), 2.2, true, 0.5); glow.position.y = 2.75;
  const base = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 48), new THREE.MeshBasicMaterial({ color: ringCol.clone().multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  base.rotation.x = -Math.PI / 2; base.position.y = 0.03;
  const pulses = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: ringCol.clone().multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.04; g.add(r); return r; });
  g.add(beam, glow, disc, base);
  return { g, beam, disc, glow, base, pulses, live, m };
}

function discover(ctx) {
  const { S, sc } = ctx;
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: cityTexture(), roughness: 0.85, metalness: 0.1, emissive: "#ffffff", emissiveIntensity: 0, emissiveMap: null }));
  ground.material.emissiveMap = ground.material.map; ground.rotation.x = -Math.PI / 2; g.add(ground);
  // buildings
  const rnd = mulberry32(9);
  const boxes = [];
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    const cx = bx * 4 + 2, cz = bz * 4 + 2;
    if (rnd() < 0.18) continue;
    const n = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const x = cx + (rnd() - 0.5) * 2, z = cz + (rnd() - 0.5) * 2;
      if (PIN_SPOTS.some(([, px, pz]) => Math.hypot(px - x, pz - z) < 1.3) || Math.hypot(x, z) < 1.4) continue;
      const d = Math.hypot(x, z);
      const h = (0.3 + rnd() * rnd() * 3.2) * (d < 9 ? 0.45 : d < 16 ? 1 : 0.6);
      boxes.push([x, z, 0.8 + rnd() * 1.4, h, 0.8 + rnd() * 1.4]);
    }
  }
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ color: "#121a30", roughness: 0.55, metalness: 0.5, emissive: "#0a1430", emissiveIntensity: 0.6 }), boxes.length);
  const mtx = new THREE.Matrix4();
  boxes.forEach(([x, z, sx, h, sz], i) => { mtx.makeScale(sx, h, sz).setPosition(x, 0, z); inst.setMatrixAt(i, mtx); });
  g.add(inst);
  // traffic lights streaming along streets
  const nCars = 420, carPos = new Float32Array(nCars * 3), carCol = new Float32Array(nCars * 3), cars = [];
  for (let i = 0; i < nCars; i++) {
    const axis = rnd() < 0.5 ? 0 : 1, lane = (Math.floor(rnd() * 21) - 10) * 4 + (rnd() < 0.5 ? -0.25 : 0.25);
    cars.push([axis, lane, rnd() * 80, (rnd() < 0.5 ? -1 : 1) * (1.2 + rnd() * 2.2)]);
    const c = rnd() < 0.6 ? new THREE.Color("#9fd2ff") : rnd() < 0.5 ? C.accent : new THREE.Color("#ff6b6b");
    carCol.set([c.r * 2, c.g * 2, c.b * 2], i * 3);
  }
  const carGeo = new THREE.BufferGeometry();
  carGeo.setAttribute("position", new THREE.BufferAttribute(carPos, 3)); carGeo.setAttribute("color", new THREE.BufferAttribute(carCol, 3));
  const carPts = new THREE.Points(carGeo, new THREE.PointsMaterial({ size: 0.16, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  carPts.frustumCulled = false; g.add(carPts);

  // pins
  const pins = PIN_SPOTS.map(([mi, x, z]) => { const m = UI.MATCHES[mi]; const p = makePin(m, m.status === "live"); p.g.position.set(x, 0, z); g.add(p.g); return p; });
  const dropT = pins.map((_, i) => 15.5 + i * 0.2);
  dropT.forEach((tt) => cue(tt + 0.32, "pin"));
  // you
  const you = sprite(dotTex, C.blue.clone().multiplyScalar(2.2), 0.7); you.position.set(0, 0.25, 0); g.add(you);
  const youRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: C.blue.clone().multiplyScalar(1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  youRing.rotation.x = -Math.PI / 2; youRing.position.y = 0.05; g.add(youRing);
  const sweepCx = document.createElement("canvas"); sweepCx.width = sweepCx.height = 512;
  { const s = sweepCx.getContext("2d"); const grd = s.createConicGradient(0, 256, 256); grd.addColorStop(0, "rgba(74,158,255,0.55)"); grd.addColorStop(0.12, "rgba(74,158,255,0)"); grd.addColorStop(1, "rgba(74,158,255,0)"); s.fillStyle = grd; s.beginPath(); s.arc(256, 256, 256, 0, Math.PI * 2); s.fill(); s.strokeStyle = "rgba(74,158,255,.35)"; s.lineWidth = 3; for (const r of [85, 170, 254]) { s.beginPath(); s.arc(256, 256, r, 0, Math.PI * 2); s.stroke(); } }
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sweepCx), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sweep.rotation.x = -Math.PI / 2; sweep.position.y = 0.06; g.add(sweep);

  // phone, held in camera space
  const phone = makePhone(UI.drawMapScreen);
  const ph = halo(C.accent, 3.4, 0.25); ph.position.z = -0.4; phone.group.add(ph);
  camera.add(phone.group);

  const tCricket = sc("discover", 2), tFootball = sc("discover", 3), tBasket = tFootball + 0.64, tAll = sc("discover", 4);
  [tCricket, tFootball, tBasket, tAll].forEach((tt) => cue(tt, "click"));
  cue(tAll + 0.1, "ping"); cue(16.5, "swish", 0.7);
  cue(23.62, "whip");
  const sportAt = (t) => (t < tCricket ? "All" : t < tFootball ? "Cricket" : t < tBasket ? "Football" : t < tAll ? "Basketball" : "All");
  const lastSwitch = (t) => [tCricket, tFootball, tBasket, tAll].filter((x) => x <= t).pop() ?? -9;

  const callLive = [makeCallout(`<span class="k">● LIVE NOW</span><span class="v">Floodlit 5-a-side · 0.8 km</span>`, "live"),
    makeCallout(`<span class="k">● LIVE NOW</span><span class="v">Box Cricket League · 1.9 km</span>`, "live")];
  const callYou = makeCallout(`<span class="k">YOU ARE HERE</span><span class="v">6 games within 5 km</span>`);
  callYou.box.style.borderColor = "#4A9EFF";

  const camPath = new THREE.CatmullRomCurve3([V(0, 40, 3), V(-2, 24, 12), V(-5.5, 14, 16.5), V(-5, 12.2, 16), V(-2.5, 11.4, 15.4), V(0.2, 11, 14.8)]);
  const tgtPath = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.5, 0, 0), V(1.5, 0, -0.5), V(2, 0, -1), V(2.3, 0, -1), V(2.8, 0, -1.5)]);

  return {
    id: "discover", objects: [g, phone.group],
    update(t, lt) {
      const u = ease.outCubic(clamp(lt / 2.2)) * 0.35 + clamp((lt - 2.2) / 7.8) * 0.65;
      const cp = camPath.getPoint(clamp(u)), ct = tgtPath.getPoint(clamp(u));
      const whip = prog(23.55, 24.0, t, ease.inCubic);
      ct.add(V(whip * 9, 0, -whip * 2));
      cp.add(drift(t, 0.12));
      setCam(cp, ct, 35);
      camera.updateMatrixWorld();

      ground.material.emissiveIntensity = 0.35 * smooth(14.4, 16.2, t) + 0.15;
      for (let i = 0; i < nCars; i++) {
        const [axis, lane, off, sp] = cars[i];
        const s = ((off + sp * t) % 80 + 120) % 80 - 40;
        carPos[i * 3] = axis ? s : lane; carPos[i * 3 + 1] = 0.08; carPos[i * 3 + 2] = axis ? lane : s;
      }
      carGeo.attributes.position.needsUpdate = true;
      carPts.material.opacity = smooth(14.6, 16, t);

      const sel = sportAt(t), ls = lastSwitch(t);
      pins.forEach((p, i) => {
        const d = prog(dropT[i], dropT[i] + 0.45, t, ease.outBack);
        p.g.visible = t >= dropT[i];
        const on = sel === "All" || sel === p.m.sport;
        const focus = sel !== "All" && on;
        const k = lerp(0.55, 1, on ? 1 : 0);
        const bounce = focus ? 0.35 * hit(ls, 0.18, t) : 0;
        p.g.position.y = (1 - d) * 7;
        p.disc.scale.setScalar(1.05 * k * (1 + bounce) * (focus ? 1.15 : 1));
        p.disc.material.opacity = on ? 1 : 0.35;
        p.disc.position.y = 2.75 + Math.sin(t * 2 + i) * 0.06 + (focus ? 0.25 : 0);
        p.glow.material.opacity = (on ? 0.5 : 0.08) + (focus ? 0.4 : 0) + (p.live && sel === "All" && t > tAll ? 0.4 * (0.5 + 0.5 * Math.sin(t * 8)) : 0);
        p.beam.material.opacity = on ? 0.55 : 0.12;
        p.base.material.opacity = on ? 1 : 0.2;
        p.pulses.forEach((r, j) => {
          const showLive = p.live && (t > tAll || sel === p.m.sport || sel === "All");
          const ph2 = ((t * 0.8 + j * 0.5) % 1);
          r.visible = showLive && t > dropT[i] + 0.4;
          const big = t > tAll ? 1.6 : 1;
          r.scale.setScalar(0.4 + ph2 * 2.6 * big);
          r.material.opacity = (1 - ph2) * (t > tAll ? 1 : 0.5);
        });
      });
      you.material.opacity = smooth(14.4, 15, t);
      const yr = (t * 0.7) % 1; youRing.scale.setScalar(0.3 + yr * 3); youRing.material.opacity = (1 - yr) * 0.8 * smooth(14.4, 15, t);
      sweep.rotation.z = -t * 1.6; sweep.material.opacity = 0.6 * smooth(14.6, 16, t);

      // phone
      const enter = prog(16.4, 17.2, t, ease.outCubic);
      phone.group.position.set(lerp(4.2, 1.36, enter), -0.12 + Math.sin(t * 1.1) * 0.025, -3.9);
      phone.group.rotation.set(0.04 + Math.sin(t * 0.8) * 0.015, lerp(-1.1, -0.36, enter) + Math.sin(t * 0.6) * 0.02, 0.02);
      phone.group.visible = enter > 0;
      phone.sheen.material.uniforms.uShift.value = -0.6 + lt * 0.08;
      phone.draw({ sport: sel, chipPulse: hit(ls, 0.5, t), t, highlight: sel === "Cricket" ? 1 : sel === "Football" ? 2 : sel === "Basketball" ? 3 : 0 });
      rimA.position.copy(camera.localToWorld(V(3.2, 1.5, -5))); rimA.intensity = 25;
      rimB.position.copy(camera.localToWorld(V(-0.5, -1, -3.5))); rimB.intensity = 14;
      keyLight.position.set(-6, 10, 8);

      const liveA = win(tAll + 0.1, 24.0, t, 0.25);
      callLive[0].set(V(2, 2.15, 3.9), -60, 150, liveA, "#FF4757");
      callLive[1].set(V(-4.2, 2.15, 1.8), 50, 130, prog(tAll + 0.3, tAll + 0.6, t) * (1 - smooth(23.55, 23.85, t)), "#FF4757");
      callYou.set(V(0, 0.3, 0), -60, -170, win(16.0, 19.4, t, 0.3), "#4A9EFF");

      fx.zoom += (1 - smooth(14.0, 14.5, t)) * 0.6;
      fx.ca += hit(tAll, 0.2, t) * 0.004;
    },
  };
}

// ═════════════════════════════ 3. JOIN ═════════════════════════════

function streaks(n, seed, spread = 10) {
  const g = new THREE.Group(); const rnd = mulberry32(seed); const items = [];
  for (let i = 0; i < n; i++) {
    const s = sprite(streakTex, (rnd() < 0.6 ? C.accent : C.purple).clone().multiplyScalar(1.4), 1, true, 0.5);
    s.scale.set(2 + rnd() * 4, 0.04 + rnd() * 0.04, 1);
    items.push({ s, y: (rnd() - 0.5) * spread * 0.6, z: -3 - rnd() * 8, off: rnd() * 40, sp: 3 + rnd() * 6 });
    g.add(s);
  }
  g.userData.update = (t, k = 1) => items.forEach((it) => { it.s.position.set(((it.off + it.sp * t) % 40) - 20, it.y, it.z); it.s.material.opacity = 0.35 * k; });
  return g;
}

function join(ctx) {
  const { sc } = ctx;
  const g = new THREE.Group();
  const floor = gridFloor(-1.25); g.add(floor);
  const lines = streaks(26, 21); g.add(lines);
  const phone = makePhone(UI.drawMatchDetail);
  const ph = halo(C.accent, 3.6, 0.22); ph.position.z = -0.5; phone.group.add(ph);
  g.add(phone.group);
  const PX = -0.8;

  const tSee = sc("join", 0);
  const chipDefs = [
    ["🕐", "When", "Sun · 7:00 AM", tSee + 0.75, [205, 182]],
    ["📍", "Where", "Riverside Ground · 1.2 km", tSee + 1.3, [95, 182]],
    ["🎯", "Skill level", "Intermediate", sc("join", 1) + 0.05, [250, 446]],
    ["👥", "Spots left", "3 of 12", sc("join", 1) + 1.15, [120, 236]],
  ];
  const chips = chipDefs.map(([ic, k, v, tt, anchor], i) => {
    const ctxc = UI.drawInfoChip(ic, k, v, i === 3 ? "#FFB800" : "#00F5A0", 360);
    const m = card(ctxc, 1.4); g.add(m);
    cue(tt, "swish", 0.8);
    return { m, tt, anchor, link: makeLink(), final: V(1.08, 0.64 - i * 0.43, 0.15), ctxc, ic, k };
  });
  const tTap = sc("join", 2), tJoined = tTap + 0.18, tRoster = sc("join", 3), tCal = sc("join", 4), tShare = tCal + 1.25;
  cue(tTap, "tap"); cue(tJoined, "success"); cue(tRoster + 0.08, "pop");
  cue(tCal, "tap", 0.8); cue(tCal + 0.25, "ding", 0.7); cue(tShare, "tap", 0.8); cue(tShare + 0.65, "whoosh_out", 0.8);
  cue(24.0, "impact", 0.9); cue(33.7, "glitch", 0.9);
  const burst = makeBurst(260, { speed: 4, flat: 0.2, up: 0.35, life: 1.4, gravity: 2.4, size: 0.05, palette: [C.accent, C.white, C.warning, C.purple] });
  g.add(burst);
  const badge = labelSprite("✓  YOU'RE IN", { font: UI.F(800, 30), bg: "#00F5A0", color: "#080B14", h: 70, pad: 30 }, 0.2);
  badge.material.color.setScalar(0.8);
  g.add(badge);
  const badgeScale = badge.scale.clone();
  const calChip = card(UI.drawInfoChip("📅", "Added to calendar", "Sun 19 Oct · 7:00 AM"), 1.4); g.add(calChip);
  const shareChip = card(UI.drawInfoChip("🔗", "Share link", "playpulse.app/?match=…", "#4A9EFF"), 1.4); g.add(shareChip);
  const calLink = makeLink(), shareLink = makeLink();

  return {
    id: "join", objects: [g],
    update(t, lt) {
      const enter = prog(24.0, 24.75, t, ease.outExpo);
      phone.group.position.set(lerp(4.8, PX, enter), Math.sin(t * 1.2) * 0.02, 0);
      phone.group.rotation.set(0.02, lerp(-1.3, 0.2, enter) + Math.sin(t * 0.7) * 0.02, 0);
      phone.sheen.material.uniforms.uShift.value = -0.4 + lt * 0.06;
      const joined = t >= tJoined;
      phone.draw({
        tab: "overview", joined, count: joined ? 10 : 9,
        press: bump(tTap + 0.06, 0.06, t), ripple: t >= tTap ? (t - tTap) / 0.6 : -1, rippleX: 144,
        glow: 0.5 + 0.5 * Math.sin(t * 5),
        toast: win(tJoined + 0.05, tCal - 0.2, t, 0.25), toastText: "✓ You're in! See you on the pitch",
        youPop: prog(tRoster, tRoster + 0.4, t), calGlow: win(tCal, tShare, t, 0.1), calDone: t > tCal + 0.25,
        shareGlow: win(tShare, 34, t, 0.1),
        ...(t >= tShare && t < tShare + 0.6 ? { ripple: (t - tShare) / 0.6, rippleX: 324 } : t >= tCal && t < tCal + 0.6 ? { ripple: (t - tCal) / 0.6, rippleX: 195 } : {}),
      });
      phone.group.updateMatrixWorld(true);

      const clear = prog(tCal - 0.25, tCal + 0.15, t, ease.inCubic);
      chips.forEach((c, i) => {
        if (i === 3 && t >= tJoined && !c.updated) { const cx = UI.drawInfoChip(c.ic, c.k, "2 of 12", "#FFB800", 360); c.m.userData.ctx.g.clearRect(0, 0, 360, 92); c.m.userData.ctx.g.drawImage(cx.c, 0, 0, 360, 92); c.m.userData.tex.needsUpdate = true; c.updated = true; }
        const a = prog(c.tt, c.tt + 0.55, t, ease.outBack);
        const from = phone.uiToWorld(c.anchor[0], c.anchor[1]);
        const p = from.clone().lerp(c.final, clamp(a)).add(V(Math.sin(t * 1.4 + i) * 0.015, Math.sin(t * 1.1 + i * 2) * 0.02, 0));
        p.x += clear * (4 + i * 0.6);
        c.m.position.copy(p);
        c.m.scale.setScalar(Math.max(0.001, lerp(0.25, 1, clamp(a)) * (1 + (i === 3 ? 0.12 * hit(tJoined, 0.2, t) : 0))));
        c.m.rotation.set(0, lerp(0.6, -0.12, clamp(a)), 0);
        c.m.visible = t >= c.tt;
        c.m.material.opacity = clamp(a * 3) * (1 - clear);
        const left = c.m.position.clone().add(V(-0.69 * c.m.scale.x, 0, 0));
        c.link.set(phone.uiToWorld(c.anchor[0], c.anchor[1]), left, clamp((t - c.tt - 0.2) * 3) * (1 - clear) * 0.9, i === 3 ? "#FFB800" : "#00F5A0", true);
      });

      const btn = phone.uiToWorld(144, 517);
      burst.position.copy(btn).add(V(0, 0, 0.1));
      burst.userData.update(t - tJoined);
      const bp = prog(tJoined, tJoined + 0.45, t, ease.outBack);
      badge.visible = t > tJoined && t < tCal;
      badge.position.copy(btn).add(V(0.42, 0.2 + bp * 0.12, 0.35));
      badge.scale.set(badgeScale.x * Math.max(bp, 0.001), badgeScale.y * Math.max(bp, 0.001), 1);
      badge.material.opacity = 1 - smooth(tCal - 0.5, tCal - 0.1, t);

      const ca = prog(tCal + 0.2, tCal + 0.75, t, ease.outBack);
      const calFrom = phone.uiToWorld(195, 579);
      calChip.visible = t > tCal + 0.2;
      calChip.position.copy(calFrom.clone().lerp(V(1.08, 0.45, 0.15), clamp(ca)));
      calChip.scale.setScalar(Math.max(0.001, lerp(0.2, 1, clamp(ca))));
      calChip.rotation.y = lerp(0.8, -0.12, clamp(ca));
      calChip.material.opacity = clamp(ca * 3);
      calLink.set(calFrom, calChip.position.clone().add(V(-0.69 * calChip.scale.x, 0, 0)), clamp((t - tCal - 0.4) * 3), "#00F5A0", true);

      const sa = prog(tShare + 0.15, tShare + 0.6, t, ease.outBack);
      const fly = prog(tShare + 0.7, tShare + 1.3, t, ease.inCubic);
      const shFrom = phone.uiToWorld(324, 517);
      shareChip.visible = t > tShare + 0.15;
      shareChip.position.copy(shFrom.clone().lerp(V(1.08, -0.02, 0.15), clamp(sa))).add(V(fly * 5, fly * 0.6, 0));
      shareChip.scale.setScalar(Math.max(0.001, lerp(0.2, 1, clamp(sa))));
      shareChip.rotation.y = lerp(0.8, -0.12, clamp(sa)) - fly * 0.6;
      shareChip.material.opacity = clamp(sa * 3);
      shareLink.set(shFrom, shareChip.position.clone().add(V(-0.69 * shareChip.scale.x, 0, 0)), clamp((t - tShare - 0.35) * 3) * (1 - fly), "#4A9EFF", true);

      const cp = V(0.1, 0.2, 4.5).add(drift(t, 0.06, 4)).add(V(Math.sin(lt * 0.25) * 0.18, 0, -lt * 0.025));
      cp.add(shake(t, 0.025 * hit(tJoined, 0.2, t)));
      setCam(cp, V(0.12, 0.15, 0), 35);
      floor.material.uniforms.uCam.value.copy(camera.position);
      lines.userData.update(t, 1);
      rimA.position.set(-3, 2, 2); rimA.intensity = 35; rimB.position.set(2.5, -1, 1.5); rimB.intensity = 30;
      keyLight.position.set(3, 5, 6);

      fx.ca += hit(tJoined, 0.2, t) * 0.008;
      fx.bloom += hit(tJoined, 0.3, t) * 0.4;
    },
  };
}

// ═════════════════════════════ 4. CHECK IN ═════════════════════════════

function checkin(ctx) {
  const { sc } = ctx;
  const g = new THREE.Group();
  const floor = gridFloor(-0.02); g.add(floor);
  const NODES = [V(0, 0, 0), V(2.6, 0, -1.2), V(5.3, 0, -0.5), V(8.0, 0, -1.9), V(10.7, 0, -1.1)];
  const curve = new THREE.CatmullRomCurve3([V(-1.5, 0, 0.8), ...NODES, V(12.2, 0, -0.6)]);
  const SEGS = 500;
  const tubeGeo = new THREE.TubeGeometry(curve, SEGS, 0.045, 8, false);
  g.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: "#1c2747" })));
  const prog3 = new THREE.Mesh(tubeGeo.clone(), new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.25), toneMapped: false }));
  prog3.scale.set(1, 1.1, 1); prog3.position.y = 0.004; g.add(prog3);
  // map node positions to curve parameter
  const nodeU = NODES.map((n) => { let best = 0, bd = 1e9; for (let i = 0; i <= 1000; i++) { const d = curve.getPoint(i / 1000).distanceTo(n); if (d < bd) { bd = d; best = i / 1000; } } return best; });
  const icons = ["📝", "👍", "🏃", "📍", "✅"];
  const nodes = NODES.map((p, i) => {
    const ng = new THREE.Group(); ng.position.copy(p);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.08, 48), new THREE.MeshStandardMaterial({ color: "#161c2e", metalness: 0.8, roughness: 0.3 }));
    const ringMat = new THREE.MeshBasicMaterial({ color: "#2A3560", toneMapped: false });
    ringMat.userData.on = C.accent.clone().multiplyScalar(1.4);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 12, 72), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05;
    const iconS = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(icons[i], "#2A3560")), transparent: true, depthWrite: false, toneMapped: false }));
    iconS.scale.setScalar(0.72); iconS.position.y = 0.85;
    const iconOn = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(icons[i], "#00F5A0", "#0c2a22")), transparent: true, depthWrite: false, toneMapped: false }));
    iconOn.scale.setScalar(0.72); iconOn.position.y = 0.85;
    const lblOff = labelSprite(UI.STEPS[i].toUpperCase(), { font: UI.F(800, 26), color: "#7d89aa", ls: 3, h: 56, pad: 14, bg: "rgba(8,11,20,.85)", border: "#2A3560" }, 0.24);
    const lblOn = labelSprite(UI.STEPS[i].toUpperCase(), { font: UI.F(800, 26), color: "#00F5A0", ls: 3, h: 56, pad: 14, bg: "rgba(8,11,20,.85)", border: "#00F5A0" }, 0.24);
    for (const l of [lblOff, lblOn]) l.position.set(0, 1.42, 0);
    const glow = sprite(glowTex, C.accent.clone().multiplyScalar(1.2), 1.5, true, 0); glow.position.y = 0.2;
    const ring2 = shockRing(C.accent); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.06;
    const burst = makeBurst(i === 4 ? 360 : 110, { speed: i === 4 ? 5 : 2.6, flat: 0.5, up: 0.6, life: 1.2, gravity: 2, size: 0.05, seed: 30 + i });
    burst.position.y = 0.4;
    ng.add(base, ring, iconS, iconOn, lblOff, lblOn, glow, ring2, burst);
    g.add(ng);
    return { ng, ringMat, iconS, iconOn, lblOff, lblOn, glow, ring2, burst };
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  beam.position.copy(NODES[4]).add(V(0, 3, 0)); g.add(beam);
  const comet = sprite(glowTex, C.accent.clone().multiplyScalar(2), 0.7); g.add(comet);
  const trail = [0, 1, 2, 3, 4, 5].map((i) => { const s = sprite(dotTex, C.accent.clone().multiplyScalar(2), 0.3 - i * 0.04, true, 0.8 - i * 0.12); g.add(s); return s; });

  const T0 = 34.75, T1 = sc("checkin", 1), T2 = sc("checkin", 2), T3 = sc("checkin", 3), T4 = T3 + 0.7;
  const stepT = [T0, T1, T2, T3, T4];
  stepT.forEach((tt, i) => cue(tt, i === 4 ? "success" : "node", 1, i));
  const tOrg = sc("checkin", 4), tApprove = tOrg + 1.45;
  cue(tApprove, "tap", 0.7); cue(tApprove + 0.1, "ding", 0.8); cue(34.0, "impact", 0.9); cue(43.55, "whoosh_in", 0.9);

  // roster avatars at their nodes
  const people = [["Priya", 4], ["Arjun", 3], ["Meera", 3], ["Sam", 2], ["Rahul", 0]].map(([n, s], i) => {
    const cx = UI.makeCanvas(150, 150, 2); UI.avatar(cx.g, n, 25, 10, 100, 50, "#0F1320");
    UI.txt(cx.g, n, 75, 140, UI.F(800, 22), "#F0F4FF", "center");
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(cx), transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.setScalar(0.62); g.add(sp);
    return { sp, n, s, i };
  });
  people.forEach((p) => cue(tOrg + 0.25 + p.i * 0.16, "pop", 0.6));

  const phone = makePhone(UI.drawMatchDetail);
  const ph = halo(C.accent, 3.4, 0.2); ph.position.z = -0.4; phone.group.add(ph);
  camera.add(phone.group);

  return {
    id: "checkin", objects: [g, phone.group],
    update(t, lt) {
      let step = 0; stepT.forEach((tt) => { if (t >= tt) step++; });
      // camera follows the active node, then pulls wide for the roster
      const nodeF = step === 0 ? 0 : step - 1 + prog(stepT[Math.min(step, 4)] - 0.45, stepT[Math.min(step, 4)], t, ease.inOutCubic) * (step < 5 ? 1 : 0);
      const fi = clamp(nodeF, 0, 4);
      const a = NODES[Math.floor(fi)], b = NODES[Math.min(4, Math.floor(fi) + 1)];
      const focus = a.clone().lerp(b, fi - Math.floor(fi));
      const wide = prog(tOrg - 0.2, tOrg + 1.0, t, ease.inOutCubic);
      const cp = focus.clone().add(V(-1.0, 3.7, 6.7)).lerp(V(6.8, 7.6, 11.4), wide).add(drift(t, 0.1, 6));
      const ct = focus.clone().add(V(-1.3, 0.3, 0)).lerp(V(4.6, 0, -1.3), wide);
      const enterK = prog(34.0, 34.7, t, ease.outCubic);
      cp.add(V(0, (1 - enterK) * 2, (1 - enterK) * 2));
      setCam(cp, ct, 35);
      camera.updateMatrixWorld();
      floor.material.uniforms.uCam.value.copy(camera.position);
      floor.material.uniforms.uFade.value = 0.8;

      // progress tube up to the comet
      const cometU = (() => {
        for (let i = 1; i < 5; i++) {
          const ta = stepT[i] - 0.45, tb = stepT[i];
          if (t < ta) return nodeU[i - 1];
          if (t < tb) return lerp(nodeU[i - 1], nodeU[i], ease.inOutCubic((t - ta) / (tb - ta)));
        }
        return nodeU[4];
      })();
      const maxIdx = tubeGeo.index.count;
      prog3.geometry.setDrawRange(0, Math.floor(maxIdx * (t >= T0 ? cometU : 0) / 6) * 6);
      const cpnt = curve.getPoint(cometU);
      comet.position.copy(cpnt).add(V(0, 0.08, 0)); comet.visible = t > T0 && t < T4 + 0.3;
      trail.forEach((s, i) => { s.position.copy(curve.getPoint(Math.max(0, cometU - (i + 1) * 0.006))).add(V(0, 0.08, 0)); s.visible = comet.visible; });

      nodes.forEach((n, i) => {
        const on = t >= stepT[i];
        n.ng.scale.setScalar(Math.max(0.001, prog(34.2 + i * 0.12, 34.65 + i * 0.12, t, ease.outBack)));
        n.ringMat.color.copy(on ? n.ringMat.userData.on : new THREE.Color("#2A3560"));
        const pop = on ? 1 + 0.35 * hit(stepT[i], 0.15, t) : 1;
        n.iconS.visible = !on; n.iconOn.visible = on;
        n.iconOn.scale.setScalar(0.72 * pop * (i === 4 && on ? 1.25 : 1)); n.iconOn.position.y = 0.85 + Math.sin(t * 2 + i) * 0.05;
        n.lblOff.visible = !on; n.lblOn.visible = on;
        n.glow.material.opacity = on ? 0.16 + 0.45 * hit(stepT[i], 0.3, t) : 0;
        n.ring2.userData.update(t - stepT[i], i === 4 ? 4.5 : 2.2, 0.8);
        n.burst.userData.update(t - stepT[i]);
      });
      beam.material.opacity = 0.2 * prog(T4, T4 + 0.4, t) * (0.8 + 0.2 * Math.sin(t * 10));
      beam.scale.set(1, prog(T4, T4 + 0.4, t, ease.outExpo), 1);

      people.forEach((p) => {
        const a2 = prog(tOrg + 0.25 + p.i * 0.16, tOrg + 0.6 + p.i * 0.16, t, ease.outBack);
        p.sp.visible = a2 > 0;
        let node = NODES[p.s].clone();
        if (p.n === "Rahul") {
          const mv = prog(tApprove, tApprove + 0.6, t, ease.inOutCubic);
          node = NODES[0].clone().lerp(NODES[1], mv); node.y += Math.sin(mv * Math.PI) * 0.9;
        }
        const mates = people.filter((q) => q.s === p.s && q.n !== "Rahul");
        const dx = p.n === "Rahul" || mates.length < 2 ? 0 : (mates.indexOf(p) - 0.5) * 0.62;
        p.sp.position.copy(node).add(V(dx, 2.15 + Math.sin(t * 2 + p.i) * 0.05, 0));
        p.sp.scale.setScalar(0.62 * Math.max(a2, 0.001));
      });

      // phone (camera space)
      phone.group.position.set(-1.5, -0.24 + Math.sin(t * 1.1) * 0.02, -4.35);
      phone.group.rotation.set(0.03, 0.36 + Math.sin(t * 0.6) * 0.02, -0.01);
      phone.sheen.material.uniforms.uShift.value = -0.5 + lt * 0.07;
      phone.draw({ tab: "checkin", step, scroll: 270 * prog(tOrg, tOrg + 0.8, t, ease.inOutCubic), confirmed: t > tApprove ? 9 : 8, approved: t > tApprove, live: false });
      rimA.position.copy(camera.localToWorld(V(-3.5, 1.5, -5.5))); rimA.intensity = 30;
      rimB.position.copy(camera.localToWorld(V(1, -1, -3))); rimB.intensity = 10;
      keyLight.position.set(2, 8, 6);

      for (const tt of stepT) fx.ca += hit(tt, 0.15, t) * 0.004;
      fx.bloom += hit(T4, 0.4, t) * 0.6;
    },
  };
}

// ═════════════════════════════ 5. GAME ON ═════════════════════════════

function panelCanvas(w, h, icon, title) {
  const ctx = UI.makeCanvas(w, h, 2);
  ctx.frame = () => {
    const { g } = ctx;
    g.clearRect(0, 0, w, h);
    UI.rr(g, 2, 2, w - 4, h - 4, 22, "rgba(11,15,27,0.95)", "#00F5A0B0", 2);
    UI.rr(g, 2, 2, w - 4, 54, [22, 22, 0, 0], "rgba(0,245,160,0.09)");
    g.fillStyle = "#00F5A040"; g.fillRect(2, 56, w - 4, 1);
    UI.txt(g, `${icon}  ${title}`, 22, 37, UI.F(800, 15), UI.T.accent, "left", 2.5);
    UI.rr(g, w - 78, 17, 58, 22, 6, "#FF475726");
    g.beginPath(); g.arc(w - 66, 28, 3.5, 0, Math.PI * 2); g.fillStyle = UI.T.danger; g.fill();
    UI.txt(g, "LIVE", w - 58, 33, UI.F(800, 11), UI.T.danger);
  };
  return ctx;
}

function gameon(ctx) {
  const { sc } = ctx;
  const g = new THREE.Group();
  const floor = gridFloor(-1.35); g.add(floor);
  const lines = streaks(30, 41, 12); g.add(lines);
  const phone = makePhone(UI.drawMatchDetail);
  const ph = halo(C.accent, 3.6, 0.22); ph.position.z = -0.5; phone.group.add(ph);
  phone.group.position.set(-0.4, 0, 0); phone.group.rotation.y = 0.12;
  g.add(phone.group);

  const chatCx = panelCanvas(380, 470, "💬", "MATCH CHAT");
  const scoreCx = panelCanvas(380, 540, "📊", "LIVE SCORE");
  const streamCx = panelCanvas(560, 440, "▶", "LIVE STREAM");
  const mk = (cx, w, pos, ry) => { const m = card(cx, w, { depthWrite: true }); m.userData.final = pos; m.userData.ry = ry; const h2 = halo(C.accent, w * 1.8, 0.12); h2.position.z = -0.3; m.add(h2); g.add(m); return m; };
  const chat = mk(chatCx, 1.72, V(-3.05, 0.05, -0.55), 0.38);
  const score = mk(scoreCx, 1.72, V(2.15, 0.05, -0.55), -0.32);
  const stream = mk(streamCx, 2.55, V(5.35, 0.1, -1.1), -0.5);
  const panels = [chat, score, stream];
  const links = panels.map(() => makeLink());

  const tIn = sc("gameon", 0) + 1.0;
  panels.forEach((_, i) => cue(tIn + i * 0.14, "swish", 0.9));
  const tChat = sc("gameon", 1), tTeam = tChat + 1.25, tScore = sc("gameon", 2), tFour = tScore + 0.55, tSix = tScore + 1.3;
  const tStream = sc("gameon", 3), tWatch = sc("gameon", 4);
  [0, 1].forEach((i) => cue(tChat + 0.25 + i * 0.32, "pop", 0.6));
  cue(tTeam, "click"); [0, 1, 2].forEach((i) => cue(tTeam + 0.15 + i * 0.25, "pop", 0.55));
  cue(tFour, "tick"); cue(tSix, "impact"); cue(tSix, "crowd"); cue(tWatch, "tap", 0.8);
  cue(44.0, "impact", 0.8); cue(55.5, "whoosh_up");
  const sixMat = new THREE.MeshStandardMaterial({ color: "#00F5A0", emissive: "#00F5A0", emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.25 });
  const six = new THREE.Mesh(text3D("SIX!", 0.62), sixMat); g.add(six);
  const sixBurst = makeBurst(380, { speed: 7, flat: 0.2, life: 1.5, gravity: 1, size: 0.06, palette: [C.accent, C.white, C.warning] }); g.add(sixBurst);
  const sixRing = shockRing(C.accent); g.add(sixRing);

  const focus = (p, ry, dist, side = -0.35) => {
    const n = V(Math.sin(ry), 0, Math.cos(ry));
    const right = V(Math.cos(ry), 0, -Math.sin(ry));
    return [p.clone().add(n.clone().multiplyScalar(dist)).add(V(0, 0.18, 0)), p.clone().add(right.multiplyScalar(side))];
  };
  const [chatP, chatT] = focus(chat.userData.final, 0.38, 4.6, -0.55);
  const [scoreP, scoreT] = focus(score.userData.final, -0.32, 5.2, -0.6);
  const [strP, strT] = focus(stream.userData.final, -0.5, 4.5, -0.78);
  const keys = [
    [0, [0.25, 0.25, 4.3], [-0.3, 0.05, 0]],
    [1.2, [0.25, 0.25, 4.1], [-0.3, 0.05, 0]],
    [2.6, [0.9, 0.7, 9.6], [0.9, 0, -0.5]],
    [tChat - 44 - 0.35, [0.9, 0.7, 9.4], [0.9, 0, -0.5]],
    [tChat - 44 + 0.35, chatP.toArray(), chatT.toArray()],
    [tScore - 44 - 0.4, chatP.clone().add(V(0.2, 0, -0.2)).toArray(), chatT.toArray()],
    [tScore - 44 + 0.3, scoreP.toArray(), scoreT.toArray()],
    [tStream - 44 - 0.3, scoreP.clone().add(V(0.15, 0, -0.25)).toArray(), scoreT.toArray()],
    [tStream - 44 + 0.4, strP.toArray(), strT.toArray()],
    [11.4, strP.clone().add(V(0.2, 0.1, -0.45)).toArray(), strT.toArray()],
  ];

  return {
    id: "gameon", objects: [g],
    update(t, lt) {
      let [cp, ct] = camKeys(keys, lt);
      const up = prog(55.5, 56.0, t, ease.inCubic);
      ct.y += up * 6;
      cp.add(drift(t, 0.07, 8)).add(shake(t, 0.05 * hit(tSix, 0.25, t)));
      setCam(cp, ct, 35);
      floor.material.uniforms.uCam.value.copy(camera.position);
      lines.userData.update(t, 1);

      const tab = t < tChat ? "overview" : t < tScore ? "chat" : t < tStream ? "score" : "stream";
      phone.draw({ tab, live: true, joined: true, count: 10, channel: t < tTeam ? "match" : "team",
        shown: tab === "chat" ? (t < tTeam ? 4 : 3) : tab === "score" ? 4 : 0, runs: 112, t });
      phone.sheen.material.uniforms.uShift.value = -0.5 + lt * 0.06;
      phone.group.updateMatrixWorld(true);
      const origin = phone.uiToWorld(195, 420);

      panels.forEach((m, i) => {
        const a = prog(tIn + i * 0.14, tIn + 0.65 + i * 0.14, t, ease.outBack);
        m.visible = a > 0;
        m.position.copy(origin.clone().lerp(m.userData.final, clamp(a))).add(V(0, Math.sin(t * 1.2 + i * 2) * 0.03, 0));
        m.rotation.set(0, lerp(0, m.userData.ry, clamp(a)), 0);
        m.scale.setScalar(Math.max(0.001, lerp(0.15, 1, a)));
        m.material.opacity = clamp(a * 2.5);
        links[i].set(origin, m.position, clamp((t - tIn - 0.3 - i * 0.14) * 2.5) * 0.7 * (1 - smooth(tChat - 0.4, tChat, t)), "#00F5A0", true);
      });

      // chat
      chatCx.frame();
      const team = t >= tTeam;
      UI.chatBody(chatCx.g, 20, 74, 340, { channel: team ? "team" : "match", shown: team ? clamp((t - tTeam - 0.15) / 0.25 + 1, 0, 3) : 2 + clamp((t - tChat - 0.25) / 0.32 + 1, 0, 2) * (t > tChat ? 1 : 0) });
      chat.userData.tex.needsUpdate = true;
      // score
      scoreCx.frame();
      const runs = t < tFour ? 102 : t < tSix ? 106 : 112;
      const shownS = 2 + prog(tFour, tFour + 0.25, t) + prog(tSix, tSix + 0.25, t);
      UI.scoreBody(scoreCx.g, 20, 74, 340, { runs, shown: shownS, flash: hit(tFour, 0.3, t) + hit(tSix, 0.3, t) > 0.3 });
      score.userData.tex.needsUpdate = true;
      // stream
      streamCx.frame();
      UI.streamFrame(streamCx.g, 20, 74, 520, 292.5, t);
      const pulse = hit(tWatch, 0.5, t);
      if (pulse > 0.01) { const gg = streamCx.g; gg.beginPath(); gg.arc(280, 220, 30 + (1 - pulse) * 80, 0, Math.PI * 2); gg.strokeStyle = `rgba(0,245,160,${pulse})`; gg.lineWidth = 4; gg.stroke(); }
      UI.rr(streamCx.g, 20, 384, 108, 26, 7, "#FF000030", "#FF444460");
      UI.txt(streamCx.g, "▶ WATCH LIVE", 74, 402, UI.F(800, 11), "#FF4444", "center");
      UI.txt(streamCx.g, "Tigers vs Strikers · streamed by the organiser", 140, 402, UI.F(500, 13), UI.T.textMuted);
      stream.userData.tex.needsUpdate = true;

      // SIX! burst out of the score panel
      const sixA = prog(tSix, tSix + 0.5, t, ease.outBack), sixOut = smooth(tSix + 1.0, tSix + 1.35, t);
      six.visible = t >= tSix && sixOut < 1;
      const sp = score.position.clone().add(V(-0.25, 0.45, 0.5 + sixA * 0.7));
      six.position.copy(sp);
      six.scale.setScalar(Math.max(0.001, sixA * (1 - sixOut * 0.5)));
      six.rotation.set(0, -0.3 + (1 - sixA) * 1.4, (1 - sixA) * -0.4);
      sixBurst.position.copy(sp); sixBurst.userData.update(t - tSix);
      sixRing.position.copy(sp); sixRing.lookAt(camera.position); sixRing.userData.update(t - tSix, 3, 0.7);

      rimA.position.set(-4, 2.5, 3); rimA.intensity = 40; rimB.position.set(4, 1, 2); rimB.intensity = 40;
      keyLight.position.set(1, 6, 7);
      fx.zoom += (1 - smooth(44.0, 44.4, t)) * 0.5;
      fx.ca += hit(tSix, 0.25, t) * 0.012;
      fx.flash += hit(tSix, 0.06, t) * 0.12;
      fx.bloom += hit(tSix, 0.4, t) * 0.3;
    },
  };
}

// ═════════════════════════════ 6. HOST ═════════════════════════════

function tileTexture() {
  const N = 1024, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d");
  g.fillStyle = "#0a0f1d"; g.fillRect(0, 0, N, N);
  g.fillStyle = "#0b241d"; g.beginPath(); g.ellipse(N * 0.7, N * 0.3, 150, 100, 0.4, 0, Math.PI * 2); g.fill();
  for (let i = 0; i <= 8; i++) {
    const p = i * N / 8; const major = i % 4 === 0;
    g.strokeStyle = major ? "#22325c" : "#151f3a"; g.lineWidth = major ? 22 : 12;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke();
    g.strokeStyle = "rgba(74,158,255,.35)"; g.lineWidth = 3; g.setLineDash([12, 14]);
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(N, p); g.stroke(); g.setLineDash([]);
  }
  g.strokeStyle = "#00F5A0"; g.lineWidth = 6; g.globalAlpha = 0.5; g.strokeRect(3, 3, N - 6, N - 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function host(ctx) {
  const { sc } = ctx;
  const g = new THREE.Group();
  const floor = gridFloor(-1.35); g.add(floor);
  const lines = streaks(22, 61, 10); g.add(lines);
  // the + button, in 3D
  const fab = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.26, 96), new THREE.MeshStandardMaterial({ color: "#00F5A0", emissive: "#00C985", emissiveIntensity: 0.38, metalness: 0.55, roughness: 0.3 }));
  disc.rotation.x = Math.PI / 2;
  const barMat = new THREE.MeshStandardMaterial({ color: "#080B14", metalness: 0.4, roughness: 0.4 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.14), barMat), b2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.95, 0.14), barMat);
  b1.position.z = b2.position.z = 0.15;
  const gy1 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.018, 8, 128), new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.3), toneMapped: false }));
  const gy2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color("#A47BDD").multiplyScalar(1.4), toneMapped: false }));
  const fabHalo = halo(C.accent, 5, 0.16); fabHalo.position.z = -0.6;
  fab.add(disc, b1, b2, gy1, gy2, fabHalo);
  g.add(fab);
  const fabRing = shockRing(C.accent); g.add(fabRing);
  const fabBurst = makeBurst(300, { speed: 6, flat: 0.1, life: 1.2, gravity: 0.5, size: 0.06 }); g.add(fabBurst);

  const phone = makePhone(UI.drawCreate);
  const ph = halo(C.accent, 3.6, 0.22); ph.position.z = -0.5; phone.group.add(ph);
  g.add(phone.group);
  const PX = -0.88;

  // map tile where the new match lands
  const tile = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 3), [
    new THREE.MeshStandardMaterial({ color: "#10162a", metalness: 0.7, roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: "#10162a", metalness: 0.7, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ map: tileTexture(), emissiveMap: null, emissive: "#ffffff", emissiveIntensity: 0.35, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: "#10162a" }), new THREE.MeshStandardMaterial({ color: "#10162a" }), new THREE.MeshStandardMaterial({ color: "#10162a" })]);
  slab.material[2].emissiveMap = slab.material[2].map;
  tile.add(slab);
  const rnd = mulberry32(17);
  const bb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: "#2a3a66", metalness: 0.3, roughness: 0.45, emissive: "#16264d", emissiveIntensity: 0.7 }), 40);
  const mm = new THREE.Matrix4(); let bi = 0;
  for (let i = 0; i < 60 && bi < 40; i++) {
    const x = (rnd() - 0.5) * 2.7, z = (rnd() - 0.5) * 2.7;
    if (Math.hypot(x - 0.2, z - 0.1) < 0.6) continue;
    mm.makeScale(0.14 + rnd() * 0.2, 0.06 + rnd() * rnd() * 0.42, 0.14 + rnd() * 0.2).setPosition(x, 0.03, z); bb.setMatrixAt(bi++, mm);
  }
  bb.count = bi; tile.add(bb);
  const newPin = makePin({ sport: "Football", emoji: "⚽" }, false);
  newPin.g.scale.setScalar(0.42); newPin.g.position.set(0.2, 0.04, 0.1); tile.add(newPin.g);
  const lock = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc("🔒", "#FFB800", "#1d1606")), transparent: true, depthWrite: false, toneMapped: false }));
  lock.scale.setScalar(0.32); tile.add(lock);
  const landRing = shockRing(C.accent); landRing.rotation.x = -Math.PI / 2; landRing.position.set(0.2, 0.06, 0.1); tile.add(landRing);
  tile.scale.setScalar(0.74); tile.position.set(1.7, -0.62, -1.0); tile.rotation.set(0.5, -0.35, 0);
  g.add(tile);
  const flyer = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc("⚽", "#FF6B6B")), transparent: true, depthWrite: false, toneMapped: false }));
  flyer.scale.setScalar(0.42); g.add(flyer);
  const flyGlow = sprite(glowTex, C.accent.clone().multiplyScalar(2), 1.2); g.add(flyGlow);
  const flyTrail = [0, 1, 2, 3, 4, 5, 6].map((i) => { const s = sprite(dotTex, C.accent.clone().multiplyScalar(2), 0.22 - i * 0.025, true, 0.8 - i * 0.1); g.add(s); return s; });
  const chipWeekly = card(UI.drawInfoChip("🔁", "Repeats", "Weekly · every Friday"), 1.55); g.add(chipWeekly);
  const chipInvite = card(UI.drawInfoChip("🔒", "Privacy", "Invite only", "#FFB800"), 1.55); g.add(chipInvite);

  const tPlus = sc("host", 1), tSport = tPlus + 0.72, tTitle0 = tPlus + 0.9, tTitle1 = tPlus + 1.4, tTime = tPlus + 1.45;
  const tGround = tPlus + 1.95, tPin = tGround + 0.42, tScroll = tPin + 0.05, tPost = tPlus + 2.7, tPosted = tPost + 0.12;
  const tFly0 = tPosted + 0.1, tLand = tFly0 + 0.65, tWeekly = sc("host", 2) + 0.35, tInvite = sc("host", 2) + 1.3;
  cue(56.0, "whoosh_up", 0.8); cue(tPlus, "tap", 1.2); cue(tPlus, "impact", 0.8); cue(tPlus + 0.15, "swish");
  cue(tSport, "click");
  const TITLE = "Friday Night Football", LOC = "Central Turf";
  for (let i = 0; i < TITLE.length; i += 2) cue(tTitle0 + (tTitle1 - tTitle0) * (i / TITLE.length), "key", 0.5);
  cue(tTime, "click", 0.8);
  for (let i = 0; i < LOC.length; i += 2) cue(tGround + 0.35 * (i / LOC.length), "key", 0.5);
  cue(tPin, "click", 0.8); cue(tPost, "tap"); cue(tPosted, "success"); cue(tFly0, "whoosh_out", 0.8); cue(tLand, "thud");
  cue(tWeekly, "pop"); cue(tInvite, "pop"); cue(65.75, "glitch", 0.9);

  return {
    id: "host", objects: [g],
    update(t, lt) {
      // FAB
      const fIn = prog(56.0, 56.55, t, ease.outBack);
      const press = bump(tPlus + 0.05, 0.07, t);
      const gone = prog(tPlus + 0.15, tPlus + 0.6, t, ease.inCubic);
      fab.visible = gone < 1;
      fab.position.set(lerp(0.2, PX, gone), lerp(-4.5, 0.15, fIn) - gone * 0.7, lerp(0, 0.4, gone));
      fab.rotation.set(-0.18 + Math.sin(t * 1.3) * 0.12 * (1 - gone), 0.32 + Math.sin(t * 0.9) * 0.22 + (1 - fIn) * 2, 0);
      fab.scale.set(1 - press * 0.12, 1 - press * 0.12, 1 - press * 0.45).multiplyScalar(Math.max(0.001, 1 - gone * 0.92));
      gy1.rotation.set(t * 1.1, t * 0.7, 0); gy2.rotation.set(-t * 0.8, t * 0.5 + 1, 0.4);
      fabRing.position.set(0.2, 0.15, 0.2); fabRing.userData.update(t - tPlus, 5, 0.8);
      fabBurst.position.set(0.2, 0.15, 0.2); fabBurst.userData.update(t - tPlus);

      // phone
      const rise = prog(tPlus + 0.2, tPlus + 0.75, t, ease.outCubic);
      phone.group.visible = rise > 0;
      phone.group.position.set(PX, lerp(-3.4, 0, rise) + Math.sin(t * 1.1) * 0.02, 0);
      phone.group.rotation.set(0.02, 0.22 + Math.sin(t * 0.6) * 0.02, 0);
      phone.sheen.material.uniforms.uShift.value = -0.5 + lt * 0.06;
      const typed = (s, a, b) => s.slice(0, Math.round(s.length * prog(a, b, t, (x) => x)));
      const focus = t < tSport ? null : t < tTime ? "title" : t < tGround ? "time" : t < tPin ? "location" : null;
      phone.draw({
        sport: t >= tSport ? "Football" : null, sportPulse: 0.6 + hit(tSport, 0.3, t),
        title: typed(TITLE, tTitle0, tTitle1), focus, caret: Math.floor(t * 3) % 2 === 0,
        date: t >= tTime ? "Fri, 17 Oct" : "", time: t >= tTime ? "7:30 PM" : "",
        location: typed(LOC, tGround, tGround + 0.35), pin: t >= tPin,
        recurrence: "Weekly", privacy: "Invite Only", recPulse: 0.6, privPulse: 0.6,
        scroll: 150 * prog(tScroll, tScroll + 0.3, t, ease.inOutCubic),
        postPress: bump(tPost + 0.04, 0.05, t), postGlow: hit(tPost, 0.3, t),
        posted: prog(tPosted, tPosted + 0.35, t),
      });
      phone.group.updateMatrixWorld(true);

      // tile + flight
      const tileIn = prog(tPlus + 0.4, tPlus + 1.0, t, ease.outCubic);
      tile.visible = tileIn > 0;
      tile.position.set(1.7, lerp(-2.8, -0.62, tileIn) + Math.sin(t * 0.9) * 0.03, -1.0);
      tile.rotation.y = -0.35 + Math.sin(t * 0.4) * 0.05;
      tile.updateMatrixWorld(true);
      const target = tile.localToWorld(V(0.2, 1.2, 0.1));
      const start = phone.uiToWorld(195, 330);
      const fk = prog(tFly0, tLand, t, ease.inOutCubic);
      const arc = (k) => start.clone().lerp(target, k).add(V(0, Math.sin(k * Math.PI) * 1.1, Math.sin(k * Math.PI) * 0.6));
      flyer.visible = flyGlow.visible = t >= tFly0 && t < tLand;
      flyer.position.copy(arc(fk)); flyGlow.position.copy(flyer.position);
      flyTrail.forEach((s, i) => { s.visible = flyer.visible; s.position.copy(arc(Math.max(0, fk - (i + 1) * 0.045))); });
      const landed = prog(tLand, tLand + 0.4, t, ease.outBack);
      newPin.g.visible = t >= tLand;
      newPin.g.scale.setScalar(0.42 * Math.max(landed, 0.001));
      newPin.pulses.forEach((r, j) => { const ph2 = (t * 0.8 + j * 0.5) % 1; r.visible = t > tLand; r.scale.setScalar(0.4 + ph2 * 2.4); r.material.opacity = 1 - ph2; });
      landRing.userData.update(t - tLand, 1.6, 0.8);
      lock.visible = t > tInvite;
      lock.position.set(0.5, 1.3, 0.1);
      lock.scale.setScalar(0.32 * prog(tInvite, tInvite + 0.4, t, ease.outBack));

      const place = (m, tt, pos) => {
        const a = prog(tt, tt + 0.5, t, ease.outBack);
        m.visible = a > 0;
        m.position.copy(pos).add(V(0, Math.sin(t * 1.3 + pos.y * 3) * 0.02, 0));
        m.scale.setScalar(Math.max(0.001, a));
        m.rotation.y = lerp(0.9, -0.2, clamp(a));
        m.material.opacity = clamp(a * 3);
      };
      place(chipWeekly, tWeekly, V(1.5, 0.9, 0.3));
      place(chipInvite, tInvite, V(1.5, 0.45, 0.3));

      const settle = prog(tPlus + 0.1, tPlus + 0.9, t, ease.inOutCubic);
      const cp = V(lerp(0.2, 0.42, settle), lerp(0.15, 0.14, settle), lerp(5.6, 4.6, settle)).add(drift(t, 0.07, 12)).add(shake(t, 0.05 * hit(tPlus, 0.2, t)));
      const ct = V(lerp(0.2, 0.4, settle), lerp(0.15, 0.12, settle), 0);
      const fromBelow = 1 - prog(56.0, 56.45, t, ease.outCubic);
      ct.y -= fromBelow * 4;
      setCam(cp, ct, 35);
      floor.material.uniforms.uCam.value.copy(camera.position);
      lines.userData.update(t, 1);
      rimA.position.set(-3, 2, 2.5); rimA.intensity = 35; rimB.position.set(3, 2, 1); rimB.intensity = 35;
      keyLight.position.set(2, 6, 6);

      fx.zoom += hit(tPlus, 0.12, t) * 0.35;
      fx.ca += hit(tPlus, 0.2, t) * 0.01 + hit(tLand, 0.2, t) * 0.005;
      fx.flash += hit(tPlus, 0.06, t) * 0.25;
      fx.bloom += hit(tPlus, 0.4, t) * 0.5;
    },
  };
}

// ═════════════════════════════ 7. LEVEL UP ═════════════════════════════

function levelup(ctx) {
  const { sc } = ctx;
  const g = new THREE.Group();
  const floor = gridFloor(-1.35); g.add(floor);
  const lines = streaks(24, 71, 10); g.add(lines);
  const phone = makePhone(UI.drawPortfolio);
  const ph = halo(C.accent, 3.6, 0.14); ph.position.z = -0.5; phone.group.add(ph);
  phone.group.position.set(-1.05, 0, 0); phone.group.rotation.y = 0.26;
  g.add(phone.group);

  const chart = new THREE.Group(); chart.position.set(1.25, -0.95, -0.25); chart.scale.setScalar(0.94); g.add(chart);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.75, 0.07, 72), new THREE.MeshStandardMaterial({ color: "#121829", metalness: 0.85, roughness: 0.3 }));
  const platRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.018, 8, 128), new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.15), toneMapped: false }));
  platRing.rotation.x = Math.PI / 2; platRing.position.y = 0.04;
  chart.add(plat, platRing);
  const compMat = new THREE.MeshStandardMaterial({ color: "#00F5A0", emissive: "#00b878", emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.28 });
  const pracMat = new THREE.MeshStandardMaterial({ color: "#A47BDD", emissive: "#6a3fb5", emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.28 });
  const K = 0.075;
  const bars = UI.RECORD.map(([e, , comp, prac], i) => {
    const x = -1.05 + i * 0.7;
    const geo = new THREE.BoxGeometry(0.26, 1, 0.26).translate(0, 0.5, 0);
    const cm = new THREE.Mesh(geo, compMat), pm = new THREE.Mesh(geo, pracMat);
    const em = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(e, "#2A3560")), transparent: true, depthWrite: false, toneMapped: false }));
    em.scale.setScalar(0.34); em.position.set(x, 0.1, 0.62);
    const lc = labelSprite(String(comp), { font: UI.F(800, 30), color: "#00F5A0", h: 50, pad: 6 }, 0.17);
    const lp = labelSprite(String(prac), { font: UI.F(800, 30), color: "#C9A6FF", h: 50, pad: 6 }, 0.17);
    chart.add(cm, pm, em, lc, lp);
    return { x, cm, pm, em, lc, lp, comp, prac };
  });
  const legC = labelSprite("● COMPETITIVE", { font: UI.F(800, 24), color: "#00F5A0", ls: 3, h: 46, pad: 8 }, 0.15);
  const legP = labelSprite("● PRACTICE", { font: UI.F(800, 24), color: "#C9A6FF", ls: 3, h: 46, pad: 8 }, 0.15);
  legC.position.set(-0.55, 2.0, 0); legP.position.set(0.75, 2.0, 0); chart.add(legC, legP);

  // reliability gauge
  const gauge = new THREE.Group(); gauge.position.set(1.5, 0.08, -0.25); g.add(gauge);
  const track = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 16, 128), new THREE.MeshStandardMaterial({ color: "#1a2240", metalness: 0.6, roughness: 0.4 }));
  const arcMat = new THREE.MeshBasicMaterial({ color: C.accent.clone().multiplyScalar(1.1), toneMapped: false });
  let arcMesh = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.085, 16, 2, 0.01), arcMat);
  gauge.add(track, arcMesh);
  const numCx = UI.makeCanvas(360, 200, 2); const numTex = uiTexture(numCx);
  const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: numTex, transparent: true, depthWrite: false, toneMapped: false }));
  num.scale.set(1.35, 0.75, 1); num.position.set(0, 0.06, 0.05); gauge.add(num);
  let lastNum = -1;
  const drawNum = (v) => {
    const { g: n } = numCx; n.clearRect(0, 0, 360, 200);
    UI.txt(n, `${v}%`, 180, 108, UI.F(400, 124, "Bebas"), "#F0F4FF", "center", 2, "middle");
    UI.txt(n, "RELIABILITY", 180, 182, UI.F(800, 20), "#00F5A0", "center", 5, "middle");
    numTex.needsUpdate = true;
  };
  const sub = labelSprite("23 of 24 finished matches", { font: UI.F(600, 22), color: "#A9B4CF", h: 44, pad: 8 }, 0.085);
  sub.position.set(0, -0.47, 0.06); gauge.add(sub);
  const badges = ["🎉", "🔟", "📣", "⭐", "🤹"].map((e, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(e, i === 3 ? "#FFB800" : "#00F5A0")), transparent: true, depthWrite: false, toneMapped: false }));
    s.scale.setScalar(0.42); gauge.add(s); return s;
  });
  const conv = makeBurst(500, { speed: -6, flat: 0, life: 2.2, gravity: 0, drag: 0.6, size: 0.05, seed: 77 });
  gauge.add(conv);

  const tPort = sc("levelup", 0), tSplit = sc("levelup", 1) + 0.25, tPrac = sc("levelup", 1) + 1.3, tRel = sc("levelup", 2);
  const tFill0 = tRel + 0.15, tFill1 = tRel + 1.6;
  bars.forEach((_, i) => { cue(66.7 + i * 0.15, "tick", 0.6, i); cue(67.45 + i * 0.12, "tick", 0.45, i + 4); });
  cue(66.0, "impact", 0.8); cue(tSplit, "swish"); cue(tPrac, "click"); cue(tPrac + 1.1, "click", 0.6);
  cue(tFill0, "charge"); cue(tFill1, "ding"); badges.forEach((_, i) => cue(tFill1 + 0.15 + i * 0.18, "pop", 0.55));
  cue(74.0, "riser");

  return {
    id: "levelup", objects: [g],
    update(t, lt) {
      const enter = prog(66.0, 66.6, t, ease.outExpo);
      phone.group.position.x = lerp(-4, -1.05, enter);
      phone.group.position.y = Math.sin(t * 1.1) * 0.02;
      const mode = t >= tPrac && t < tPrac + 1.1 ? "practice" : "official";
      phone.draw({ mode, count: prog(tPort, tPort + 1.3, t), rel: prog(tPort, tPort + 1.3, t), milestones: 4 * prog(tRel + 0.4, tRel + 1.6, t, (x) => x) });
      phone.sheen.material.uniforms.uShift.value = -0.5 + lt * 0.06;

      const chartOut = prog(tRel - 0.45, tRel + 0.05, t, ease.inCubic);
      chart.visible = chartOut < 1;
      chart.scale.set(0.94, 0.94 * Math.max(0.001, 1 - chartOut), 0.94);
      chart.rotation.y = Math.sin(lt * 0.35) * 0.18 - 0.1;
      const split = prog(tSplit, tSplit + 0.6, t, ease.inOutCubic);
      bars.forEach((b, i) => {
        const gc = prog(66.7 + i * 0.15, 67.2 + i * 0.15, t, ease.outBack);
        const gp = prog(67.45 + i * 0.12, 67.9 + i * 0.12, t, ease.outBack);
        const hc = Math.max(0.001, b.comp * K * gc), hp = Math.max(0.001, b.prac * K * gp);
        b.cm.scale.y = hc; b.pm.scale.y = hp;
        b.cm.position.set(b.x - 0.16 * split, 0.035, 0);
        b.pm.position.set(b.x + 0.16 * split, 0.035 + hc * (1 - split), 0);
        b.cm.visible = gc > 0; b.pm.visible = gp > 0;
        b.lc.position.set(b.cm.position.x, 0.035 + hc + 0.13, 0.15); b.lc.material.opacity = clamp(gc * 2);
        b.lp.position.set(b.pm.position.x, b.pm.position.y + hp + 0.13, 0.15); b.lp.material.opacity = clamp(gp * 2) * smooth(0.4, 1, split);
        b.lc.visible = b.lp.visible = gc > 0;
      });
      legC.material.opacity = legP.material.opacity = smooth(tSplit + 0.2, tSplit + 0.6, t);

      const gIn = prog(tRel - 0.1, tRel + 0.4, t, ease.outBack);
      gauge.visible = gIn > 0;
      const build = smooth(74.0, 76.0, t);
      gauge.scale.setScalar(Math.max(0.001, gIn) * (1 + build * 0.15));
      gauge.rotation.set(0, Math.sin(lt * 0.5) * 0.1 - 0.15, 0);
      const fill = prog(tFill0, tFill1, t, ease.outCubic) * 0.96;
      gauge.remove(arcMesh); arcMesh.geometry.dispose();
      arcMesh = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.085, 16, Math.max(2, Math.round(160 * fill)), Math.max(0.001, fill * Math.PI * 2)), arcMat);
      arcMesh.rotation.z = Math.PI / 2; arcMesh.scale.x = -1;
      gauge.add(arcMesh);
      const v = Math.round(fill * 100);
      if (v !== lastNum) { drawNum(v); lastNum = v; }
      num.scale.set(1.35 * (1 + 0.08 * hit(tFill1, 0.2, t)), 0.75 * (1 + 0.08 * hit(tFill1, 0.2, t)), 1);
      sub.material.opacity = smooth(tFill1 - 0.2, tFill1 + 0.3, t);
      badges.forEach((b, i) => {
        const a = prog(tFill1 + 0.15 + i * 0.18, tFill1 + 0.5 + i * 0.18, t, ease.outBack);
        const ang = i / 5 * Math.PI * 2 + lt * (0.5 + build * 2.5);
        b.position.set(Math.cos(ang) * 1.75, Math.sin(ang) * 0.32 - 0.05, Math.sin(ang) * 0.95);
        b.scale.setScalar(0.42 * Math.max(a, 0.001));
        b.visible = a > 0;
      });
      conv.userData.update(t - 74.0);
      conv.visible = t > 74.0;

      const toGauge = prog(tRel - 0.3, tRel + 0.6, t, ease.inOutCubic);
      const push = prog(74.6, 76.0, t, ease.inExpo);
      const cp = V(lerp(0.3, 0.55, toGauge), lerp(0.25, 0.15, toGauge), lerp(5.0, 4.6, toGauge)).add(drift(t, 0.07, 14));
      const ct = V(lerp(0.3, 0.5, toGauge), lerp(0.0, 0.05, toGauge), 0);
      cp.lerp(V(1.5, 0.1, 1.4), push); ct.lerp(V(1.5, 0.08, -0.25), push);
      setCam(cp, ct, 35);
      floor.material.uniforms.uCam.value.copy(camera.position);
      lines.userData.update(t, 1 + build * 2);
      rimA.position.set(-3.5, 2, 2); rimA.intensity = 35; rimB.position.set(3.5, 1, 1.5); rimB.intensity = 40;
      keyLight.position.set(1, 6, 6);

      fx.ca += hit(tFill1, 0.2, t) * 0.006 + build * 0.01;
      fx.zoom += push * 0.5;
      fx.bloom += hit(tFill1, 0.4, t) * 0.3 + build * 0.35;
      fx.flash += smooth(75.6, 76.0, t) * 0.9;
    },
  };
}

// ═════════════════════════════ 8. OUTRO ═════════════════════════════

function outro(ctx) {
  const { S } = ctx;
  const g = new THREE.Group();
  const L = makeLockup(); g.add(L.group);
  const floor = gridFloor(-2.6); g.add(floor);
  const ring = shockRing(C.accent), ring2 = shockRing(C.white); g.add(ring, ring2);
  const burst = makeBurst(500, { speed: 10, flat: 0.15, life: 2.2, gravity: 0.6, size: 0.08, seed: 91 }); g.add(burst);
  const icons = ["🗺️", "👆", "✅", "💬", "➕", "📈"].map((e) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: uiTexture(UI.drawEmojiDisc(e, "#00F5A0")), transparent: true, depthWrite: false, toneMapped: false }));
    s.scale.setScalar(0.62); g.add(s); return s;
  });
  const tag = el("div", "tagline", undefined, "<span>FIND A GAME.</span><span>JOIN IN.</span><span>PLAY NOW.</span>");
  style(tag, { top: "760px", fontSize: "84px" });
  const spans = [...tag.children];
  spans[2].style.color = "#00F5A0"; spans[2].style.textShadow = "0 0 30px rgba(0,245,160,.6)";
  const foot = el("div", "footer", undefined, "Free to browse &nbsp;·&nbsp; Sign in only when you join");
  style(foot, { top: "905px" });
  const tName = S.vo.outro + S.seg.outro[0][0], tFind = S.vo.outro + S.seg.outro[1][0], tJoin = S.vo.outro + S.seg.outro[2][0];
  const tPlay = tJoin + 0.68;
  const tagT = [tFind, tJoin, tPlay];
  cue(76.0, "drop"); tagT.forEach((tt) => cue(tt, "hit")); cue(80.6, "shimmer");

  return {
    id: "outro", objects: [g],
    update(t, lt) {
      const a = prog(76.0, 76.6, t, ease.outExpo);
      L.group.scale.setScalar(lerp(1.6, 1, a) * (1 + 0.035 * hit(tName, 0.25, t)));
      L.bolt.rotation.y = Math.sin(lt * 0.8) * 0.15 + (1 - a) * 1.5;
      L.ring.rotation.set(Math.sin(lt * 0.6) * 0.5, lt * 0.7, 0);
      L.ring.scale.setScalar(1 + 0.3 * hit(tName, 0.3, t));
      L.glow.material.opacity = 0.1 + 0.3 * hit(76, 0.3, t) + 0.2 * hit(tName, 0.3, t);
      L.group.position.y = 0.45;
      ring.position.set(0, 0.45, -0.5); ring.lookAt(camera.position); ring.userData.update(t - 76.0, 10, 1.1);
      ring2.position.copy(ring.position); ring2.lookAt(camera.position); ring2.userData.update(t - tName, 6, 0.8);
      burst.position.set(0, 0.45, 0); burst.userData.update(t - 76.0);
      icons.forEach((s, i) => {
        const k = prog(76.2 + i * 0.1, 76.7 + i * 0.1, t, ease.outBack);
        const ang = i / 6 * Math.PI * 2 + lt * 0.45;
        s.position.set(Math.cos(ang) * 6.3, 0.45 + Math.sin(ang) * 2.35, -1.6 + Math.sin(ang) * 0.6);
        s.scale.setScalar(0.85 * Math.max(k, 0.001));
        s.material.opacity = 0.55 + 0.45 * (Math.sin(ang) * 0.5 + 0.5);
      });
      floor.material.uniforms.uFade.value = 0.8;
      const cp = V(Math.sin(lt * 0.18) * 1.1, 0.6, 13.6 - lt * 0.15).add(drift(t, 0.06, 20)).add(shake(t, 0.1 * hit(76, 0.25, t)));
      setCam(cp, V(0, 0.05, 0), 35);
      floor.material.uniforms.uCam.value.copy(camera.position);
      rimA.position.set(-6 + lt * 1.5, 3, 4); rimA.intensity = 60; rimB.position.set(6, -2, 3); rimB.intensity = 50;
      keyLight.position.set(-8 + lt * 2.2, 6, 8);

      const endFade = 1 - smooth(82.4, 84.0, t);
      spans.forEach((s, i) => {
        const k = prog(tagT[i], tagT[i] + 0.3, t, ease.outExpo);
        s.style.opacity = k * endFade;
        s.style.transform = `translateY(${(1 - k) * 30}px) scale(${lerp(1.5, 1, k)})`;
      });
      foot.style.opacity = smooth(80.5, 81.2, t) * endFade;

      fx.flash += hit(76.0, 0.15, t) * 0.7;
      fx.ca += hit(76.0, 0.3, t) * 0.012;
      fx.bloom += hit(76.0, 0.5, t) * 0.8;
      for (const tt of tagT) fx.ca += hit(tt, 0.1, t) * 0.005;
      fx.fade += smooth(82.4, 84.0, t);
    },
  };
}

export function buildScenes(S) {
  const sc = (id, i) => S.vo[id] + S.seg[id][i][0];
  const se = (id, i) => S.vo[id] + S.seg[id][i][1];
  const ctx = { S, sc, se };
  const ov = document.getElementById("ov"), svg = document.getElementById("lines");
  const list = [hook, logo, discover, join, checkin, gameon, host, levelup, outro].map((factory) => {
    const before = new Set([...ov.children, ...svg.children]);
    const s = factory(ctx);
    s.dom = [...ov.children, ...svg.children].filter((e) => !before.has(e));
    for (const o of s.objects) if (!o.parent) scene.add(o);
    return s;
  });
  for (const s of list) {
    const def = S.timeline.scenes.find((d) => d.id === s.id);
    s.start = def.start; s.end = def.end; s.def = def;
  }
  return list;
}
