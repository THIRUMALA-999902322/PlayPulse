"""Score, sound design and final mix for the PlayPulse film.

Everything is synthesised here; the only recorded audio is the narration.
Timing comes from web/timeline.json (scene cuts, narration offsets) and
cues.json (every sound effect the picture registered, frame-accurate).

Usage: python music.py <video_dir>   ->  <video_dir>/mix.wav
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = Path(sys.argv[1])
TL = json.loads((ROOT / "web/timeline.json").read_text())
CUES = json.loads((ROOT / "cues.json").read_text())
DUR = float(TL["duration"])
N = int(SR * DUR)
BEAT = 60 / TL["bpm"]
BAR = 4 * BEAT
rng = np.random.default_rng(7)


# ───────────────────────────── primitives ─────────────────────────────

def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def stereo():
    return np.zeros((N, 2))


def place(buf, x, t, gain=1.0, pan=0.0):
    """Mix a mono or stereo clip into `buf` at time `t` (equal-power pan, centre = unity)."""
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    if i < 0:
        x, i = x[-i:], 0
    x = x[: len(buf) - i]
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        buf[i:i + len(x), 0] += x * gain * np.cos(a) * np.sqrt(2)
        buf[i:i + len(x), 1] += x * gain * np.sin(a) * np.sqrt(2)
    else:
        buf[i:i + len(x)] += x * gain


def saw(f, n, ph0=0.0):
    dt = f / SR
    ph = (ph0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt
    y[m] -= x * x + x + x + 1
    return y


def sine(f, n, ph0=0.0):
    return np.sin(2 * np.pi * (ph0 + np.cumsum(np.broadcast_to(f, (n,))) / SR))


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def sweep(x, fc_of_t, kind="low", block=256, t0=0.0):
    """Time-varying Butterworth filter, block-wise with carried state."""
    out = np.empty_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(fc_of_t(t0 + (s + block / 2) / SR), 30, SR * 0.45))
        sos = signal.butter(2, fc, kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[s:s + block], zi = signal.sosfilt(sos, x[s:s + block], zi=zi)
    return out


def env(n, a=0.002, d=0.1, s=0.0, r=0.05, hold=None):
    """ADSR; `hold` = seconds before release (defaults to the full length)."""
    t = tt(n)
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = np.clip(1 - (t - hold) / max(r, 1e-6), 0, 1)
    return e * np.where(t > hold, rel, 1)


def noise(n):
    return rng.standard_normal(n)


def make_ir(sec, decay, pre=0.015, damp=7000, seed=1):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = tt(n)
    ir = r.standard_normal((n, 2)) * np.exp(-t * 6.9 / decay)[:, None]
    ir = lp(ir, damp)
    ir[: int(pre * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR_HALL = make_ir(3.2, 2.6, damp=6500)
IR_ROOM = make_ir(0.9, 0.45, pre=0.008, damp=9000, seed=3)


def reverb(x, ir, wet):
    mono = x.mean(axis=1) if x.ndim == 2 else x
    w = np.stack([signal.fftconvolve(mono, ir[:, 0])[: len(mono)], signal.fftconvolve(mono, ir[:, 1])[: len(mono)]], axis=1)
    dry = x if x.ndim == 2 else np.stack([x, x], axis=1)
    return dry + w * wet


def delay(x, sec, fb=0.35, mix=0.3, pingpong=True):
    d = int(sec * SR)
    out = x.copy()
    tap = x.copy()
    for k in range(1, 6):
        tap = np.roll(tap, d, axis=0)
        tap[:d] = 0
        tap = tap * fb
        if pingpong:
            tap = tap[:, ::-1]
        out += tap * mix / fb
    return out


# ───────────────────────────── instruments ─────────────────────────────

def kick(gain=1.0):
    n = int(0.5 * SR)
    t = tt(n)
    f = 46 + 120 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)
    click = hp(noise(n), 2500) * np.exp(-t / 0.004) * 0.35
    return np.tanh((body + click) * 1.6) * gain


def clap():
    n = int(0.45 * SR)
    t = tt(n)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        e += np.where(t >= off, np.exp(-(t - off) / 0.006), 0) * (0.7 if k < 2 else 1)
    e += np.where(t >= 0.022, np.exp(-(t - 0.022) / 0.13), 0) * 0.6
    return bp(noise(n), 900, 3800) * e


def snare(gain=1.0):
    n = int(0.3 * SR)
    t = tt(n)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    nz = bp(noise(n), 1500, 9000) * np.exp(-t / 0.09)
    return (tone * 0.6 + nz) * gain


def hat(open_=False):
    n = int((0.32 if open_ else 0.06) * SR)
    t = tt(n)
    return hp(noise(n), 7500, order=4) * np.exp(-t / (0.11 if open_ else 0.018))


def crash():
    n = int(2.6 * SR)
    t = tt(n)
    metal = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in [3200, 4650, 5300, 6900, 8100]) * 0.08
    return hp(noise(n) + metal, 4000) * np.exp(-t / 0.9)


def supersaw(m, n, voices=5, spread=0.14):
    out = np.zeros((n, 2))
    for v in range(voices):
        det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
        x = saw(hz(m + det), n, rng.random())
        pan = (v - (voices - 1) / 2) / ((voices - 1) / 2) * 0.8
        a = (pan + 1) * np.pi / 4
        out[:, 0] += x * np.cos(a)
        out[:, 1] += x * np.sin(a)
    return out / voices


def pluck(m, n, bright=3500):
    t = tt(n)
    x = saw(hz(m), n) * 0.7 + np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.3
    x = sweep(x, lambda tt_: 400 + bright * np.exp(-tt_ / 0.06), block=128)
    return x * np.exp(-t / 0.16)


def bell(f, n, decay=0.9):
    t = tt(n)
    return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.2)
            + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.08)) * np.exp(-t / decay) * env(n, a=0.002, d=9, s=1, r=0.02)


# ───────────────────────────── arrangement ─────────────────────────────

PROG = [([57, 60, 64], 45), ([53, 57, 60], 41), ([55, 60, 64], 48), ([55, 59, 62], 43)]  # Am F C G
NBARS = int(DUR / BAR)


def section(t):
    """Which part of the arrangement plays at time t."""
    if t < 6: return "intro"
    if t < 8: return "build"
    if t < 14: return "drop"
    if t < 34: return "verse"
    if t < 40: return "half"
    if t < 44: return "verse"
    if t < 56: return "chorus"
    if t < 72: return "verse"
    if t < 76: return "rise"
    if t < 80: return "final"
    return "end"


drums, bass, chords, arp, lead, pad = (stereo() for _ in range(6))
kick_times = []
K = kick()
CR = crash()

for b in range(NBARS):
    t0 = b * BAR
    sec = section(t0 + 0.01)
    chord, root = PROG[b % 4]
    full = sec in ("drop", "verse", "chorus", "rise", "final")
    # ── drums
    for beat in range(4):
        tb = t0 + beat * BEAT
        s = section(tb + 0.01)
        if s in ("drop", "verse", "chorus", "rise", "final"):
            place(drums, K, tb, 0.95); kick_times.append(tb)
            if beat in (1, 3): place(drums, clap(), tb, 0.42, 0.05)
            place(drums, hat(True), tb + BEAT / 2, 0.16, 0.25)
        elif s == "half":
            if beat in (0,) or (beat == 2 and b % 2): place(drums, K, tb, 0.9); kick_times.append(tb)
            if beat == 2: place(drums, clap(), tb, 0.45)
            place(drums, hat(), tb + BEAT / 2, 0.14, 0.3)
        for k in range(4):
            th = tb + k * BEAT / 4
            st = section(th + 0.001)
            if st in ("drop", "chorus", "final", "verse", "rise") or (st == "intro" and th > 1.5) or st == "build":
                vel = (0.12 if k % 2 == 0 else 0.07) * (0.6 if st == "intro" else 1)
                place(drums, hat(), th, vel, -0.3 + 0.6 * (k % 2))
    if sec in ("drop", "chorus", "final"):
        if b in (4, 22, 38): place(drums, CR, t0, 0.5)
    # ── bass: sub + offbeat saw
    if full or sec == "half":
        for beat in range(4):
            for half in (0, 1):
                ts = t0 + beat * BEAT + half * BEAT / 2
                if sec == "half" and half == 0:
                    continue
                n = int(BEAT / 2 * 0.92 * SR)
                f = hz(root)
                x = lp(saw(f, n) * 0.6, 520) + np.sin(2 * np.pi * f / 2 * tt(n)) * 0.9
                place(bass, x * env(n, a=0.004, d=0.18, s=0.55, r=0.03), ts, 0.42 if half else 0.3)
    # ── chords: supersaw, sidechained later
    if sec != "end" and sec != "intro":
        n = int(BAR * SR)
        c = sum(supersaw(m, n) for m in chord + [chord[0] + 12])
        c *= env(n, a=0.02, d=9, s=1, r=0.08)[:, None]
        g = {"build": 0.35, "drop": 0.55, "verse": 0.3, "half": 0.32, "chorus": 0.5, "rise": 0.4, "final": 0.6}[sec]
        place(chords, c, t0, g)
    # ── 16th pluck arpeggio
    if sec in ("drop", "verse", "chorus", "final", "rise"):
        tones = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24]
        pat = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 1, 2]
        for k, idx in enumerate(pat):
            n = int(0.3 * SR)
            place(arp, pluck(tones[idx], n), t0 + k * BEAT / 4, 0.16 if sec != "verse" else 0.12, -0.5 if k % 2 else 0.5)
    # ── pad for intro/build/end
    if sec in ("intro", "build", "end", "half"):
        n = int(BAR * SR) + int(0.4 * SR)
        p = sum(supersaw(m - 12, n, voices=3, spread=0.08) for m in chord)
        place(pad, p * env(n, a=0.6, d=9, s=1, r=0.4, hold=BAR)[:, None], t0, 0.5)

# lead hook (game on chorus + final drop)
MOTIF = [
    [(0, 76, 1), (1, 74, .5), (1.5, 72, .5), (2, 74, 1), (3, 76, 1)],
    [(0, 77, 1.5), (1.5, 76, .5), (2, 72, 2)],
    [(0, 76, 1), (1, 79, 1), (2, 76, .5), (2.5, 74, .5), (3, 72, 1)],
    [(0, 74, 1.5), (1.5, 71, .5), (2, 67, 1), (3, 71, 1)],
]
for b in range(NBARS):
    t0 = b * BAR
    if section(t0 + 0.01) not in ("chorus", "final"):
        continue
    for beat, m, ln in MOTIF[b % 4]:
        n = int(ln * BEAT * SR * 0.95)
        t = tt(n)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
        f = hz(m) * vib
        x = (saw(hz(m), n) + saw(hz(m + 0.1), n) * 0.7) * 0.5
        x = sine(f, n) * 0.5 + lp(x, 3200) * 0.6
        place(lead, x * env(n, a=0.01, d=0.4, s=0.7, r=0.08), t0 + beat * BEAT, 0.2)

# final sustained chord (Am add9) after the last downbeat
n = int(4.0 * SR)
fin = sum(supersaw(m, n, voices=5, spread=0.1) for m in [45, 57, 64, 67, 71, 72, 76])
fin = lp(fin, 2600) * env(n, a=0.01, d=1.6, s=0.35, r=1.2, hold=2.6)[:, None]
place(pad, fin, 80.0, 0.42)
place(drums, K, 80.0, 1.0); place(drums, CR, 80.0, 0.55)

# build sweep: chords open up through the builds
chords[:, 0] = sweep(chords[:, 0], lambda t: 600 + 5000 * np.clip((t - 6) / 2, 0, 1) if t < 8 else (1800 if section(t) in ("verse", "half") else 900 + 5000 * np.clip((t - 72) / 4, 0, 1) if 72 <= t < 76 else 5200))
chords[:, 1] = sweep(chords[:, 1], lambda t: 600 + 5000 * np.clip((t - 6) / 2, 0, 1) if t < 8 else (1800 if section(t) in ("verse", "half") else 900 + 5000 * np.clip((t - 72) / 4, 0, 1) if 72 <= t < 76 else 5200))
pad = lp(pad, 1400)

# snare rolls into the drops
for (a, b_) in [(7.0, 8.0), (74.0, 76.0)]:
    k = 0
    tcur = a
    while tcur < b_ - 0.02:
        p = (tcur - a) / (b_ - a)
        place(drums, snare(0.25 + 0.5 * p), tcur, 0.5, 0)
        tcur += BEAT / (4 if p < 0.5 else 8 if p < 0.85 else 16)

# sidechain pump from the kick
t_all = tt(N)
sc = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(min(int(0.4 * SR), N - i)) / SR
    sc[i:i + len(seg)] = np.minimum(sc[i:i + len(seg)], 1 - 0.62 * np.exp(-seg / 0.12) * np.clip(seg / 0.004, 0, 1) - 0.0)
for buf in (bass, chords, pad, arp):
    buf *= sc[:, None]

arp = delay(arp, BEAT * 0.75, fb=0.32, mix=0.35)
lead = delay(lead, BEAT * 0.75, fb=0.28, mix=0.25)
music = drums + bass * 0.95 + chords * 0.62 + arp + lead + pad * 0.5
music = reverb(music, IR_HALL, 0.12)

# silence before the impacts so they land
for a, b_ in [(5.82, 6.0), (75.88, 76.0)]:
    i, j = int(a * SR), int(b_ * SR)
    ramp = np.linspace(1, 0, int(0.03 * SR))
    music[i:i + len(ramp)] *= ramp[:, None]
    music[i + len(ramp):j] = 0
# fade the tail
music *= np.clip((DUR - t_all) / 3.4, 0, 1)[:, None] ** 1.5


# ───────────────────────────── sound design ─────────────────────────────

def whoosh(dur, up=True, lo=300, hi=6000, center=0.6):
    n = int(dur * SR)
    t = tt(n) / dur
    fc = (lambda x: lo * (hi / lo) ** x) if up else (lambda x: hi * (lo / hi) ** x)
    x = sweep(noise(n), lambda s: fc(s / dur), kind="low") - sweep(noise(n), lambda s: fc(s / dur) * 0.25, kind="low") * 0.5
    shape = np.where(t < center, (t / center) ** 2, np.exp(-(t - center) / (1 - center) * 3))
    return x * shape


def impact(dur=1.4, sub=1.0):
    n = int(dur * SR)
    t = tt(n)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5) * sub
    nz = lp(noise(n), 3000) * np.exp(-t / 0.12) * 0.5
    return np.tanh((boom + nz) * 1.4)


def blip(f1, f2, dur=0.12):
    n = int(dur * SR)
    t = tt(n)
    f = f1 + (f2 - f1) * np.clip(t / (dur * 0.5), 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.35)) * np.clip(t / 0.002, 0, 1)


def click(f=3200, dur=0.03):
    n = int(dur * SR)
    t = tt(n)
    return (bp(noise(n), f * 0.6, f * 1.6) * 0.6 + np.sin(2 * np.pi * f * t) * 0.5) * np.exp(-t / 0.005)


def glitch_burst(dur=0.28):
    n = int(dur * SR)
    out = np.zeros(n)
    s = 0
    while s < n:
        ln = int(rng.uniform(0.008, 0.05) * SR)
        kind = rng.integers(3)
        t = tt(ln)
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1200) * t))
        elif kind == 1: seg = noise(ln)
        else: seg = np.round(np.sin(2 * np.pi * rng.uniform(200, 3000) * t) * 3) / 3
        out[s:s + ln] = seg[: max(0, min(ln, n - s))] * rng.uniform(0.3, 1)
        s += ln
    hold = rng.integers(4, 12)
    out = np.repeat(out[::hold], hold)[:n]  # sample-rate crush
    return out * 0.5


def crowd(dur=2.6):
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    for _ in range(40):
        am = lp(noise(n), rng.uniform(3, 9)) * 40
        x += bp(noise(n), rng.uniform(300, 900), rng.uniform(1500, 3500)) * np.clip(am, 0, None)
    shape = np.clip(t / 0.25, 0, 1) * np.exp(-np.clip(t - 0.4, 0, None) / 0.9)
    return x / np.abs(x).max() * shape


SFX = stereo()
for c in CUES:
    t, ty, g, idx = c["t"], c["type"], c.get("gain", 1), c.get("idx", 0)
    pan = float(rng.uniform(-0.5, 0.5))
    if ty == "notif":
        f = rng.choice([1318.5, 1567.98, 1760.0, 2093.0])
        x = np.concatenate([bell(f, int(0.07 * SR), 0.05), bell(f * 1.335, int(0.4 * SR), 0.12)])
        place(SFX, x, t, 0.16 * g, pan)
    elif ty == "type_hit":
        place(SFX, impact(0.6, 0.8), t - 0.03, 0.42)
        place(SFX, click(1800, 0.05), t - 0.03, 0.3)
    elif ty == "glitch":
        place(SFX, glitch_burst(0.3), t - 0.05, 0.42 * g, pan)
    elif ty == "implode":
        x = whoosh(0.55, up=True, lo=200, hi=9000, center=0.97)
        place(SFX, x, t, 0.5)
    elif ty == "boom":
        place(SFX, impact(1.8, 1.2), t, 0.9)
        place(SFX, CR, t, 0.35)
    elif ty == "riser2" or ty == "riser":
        d = 2.0
        n = int(d * SR)
        x = sweep(noise(n), lambda s: 300 * (40 ** (s / d)), kind="low") * (tt(n) / d) ** 2
        tone = saw(1, n) * 0
        f = 220 * 2 ** (2 * (tt(n) / d) ** 1.5)
        tone = lp(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR), 4000) * (tt(n) / d) ** 2
        place(SFX, x * 0.35 + tone * 0.12, t, 0.9)
    elif ty == "heartbeat":
        for k, (off, gg) in enumerate([(0, 1.0), (0.17, 0.7)]):
            place(SFX, impact(0.5, 1.0), t + off, 0.6 * gg)
    elif ty == "drop":
        place(SFX, impact(2.2, 1.3), t, 1.0)
        place(SFX, CR, t, 0.4)
        place(SFX, whoosh(0.5, up=False, center=0.05), t, 0.35)
    elif ty in ("whoosh_in", "whip"):
        d = 0.55 if ty == "whoosh_in" else 0.4
        place(SFX, whoosh(d, up=True, center=0.85), t, 0.4, -0.6)
    elif ty == "whoosh_out":
        place(SFX, whoosh(0.6, up=False, center=0.15), t, 0.32, 0.6)
    elif ty == "whoosh_up":
        place(SFX, whoosh(0.5, up=True, lo=500, hi=9000, center=0.8), t, 0.38)
    elif ty == "slam":
        place(SFX, impact(1.2, 1.0), t, 0.85)
        place(SFX, clap(), t, 0.3)
    elif ty == "hit":
        place(SFX, impact(0.9, 0.9), t - 0.03, 0.5)
        stab = sum(supersaw(m, int(0.5 * SR)) for m in [57, 64, 69, 72])
        place(SFX, lp(stab, 2400) * env(int(0.5 * SR), a=0.003, d=0.09, s=0.0, r=0.05)[:, None], t - 0.03, 0.3)
    elif ty == "pin":
        place(SFX, blip(1100, 520, 0.16), t, 0.22, pan)
        place(SFX, impact(0.3, 0.5), t, 0.18)
    elif ty == "swish":
        place(SFX, whoosh(0.28, up=True, lo=1200, hi=9000, center=0.6), t - 0.12, 0.28 * g, pan)
    elif ty == "click":
        place(SFX, click(2600 + 300 * idx, 0.03), t, 0.32 * g, pan * 0.5)
    elif ty == "ping":
        place(SFX, bell(1174.66, int(1.4 * SR), 0.5), t, 0.18)
    elif ty == "impact":
        place(SFX, impact(1.0, 0.9), t, 0.55 * g)
    elif ty == "tap":
        place(SFX, click(1800, 0.04), t, 0.42 * g)
        place(SFX, blip(220, 120, 0.09), t, 0.32 * g)
    elif ty == "success":
        for k, m in enumerate([84, 88, 91, 96]):
            place(SFX, bell(hz(m), int(0.7 * SR), 0.35), t + k * 0.055, 0.12 * g, -0.3 + 0.2 * k)
    elif ty == "pop":
        place(SFX, blip(420, 980, 0.07), t, 0.24 * g, pan)
    elif ty == "ding":
        place(SFX, bell(1567.98, int(1.2 * SR), 0.55), t, 0.16 * g)
    elif ty == "node":
        place(SFX, bell(hz([81, 84, 88, 93][min(idx, 3)]), int(0.9 * SR), 0.4), t, 0.17)
        place(SFX, impact(0.4, 0.6), t, 0.22)
    elif ty == "crowd":
        place(SFX, crowd(2.8), t - 0.05, 0.3)
    elif ty == "key":
        place(SFX, click(rng.uniform(3500, 5000), 0.02), t, 0.18 * g, pan * 0.3)
    elif ty == "thud":
        place(SFX, impact(0.7, 1.0), t, 0.55)
        place(SFX, bell(880, int(0.6 * SR), 0.2), t + 0.02, 0.08)
    elif ty == "tick":
        place(SFX, blip(900 + 120 * idx, 900 + 120 * idx, 0.06), t, 0.18 * g, -0.4 + 0.1 * idx)
    elif ty == "charge":
        d = 1.45
        n = int(d * SR)
        f = 260 * (4.6 ** (tt(n) / d))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * tt(n)))
        place(SFX, x * (tt(n) / d) ** 0.7, t, 0.09)
    elif ty == "shimmer":
        for k, m in enumerate([88, 91, 95, 100, 103]):
            place(SFX, bell(hz(m), int(1.5 * SR), 0.7), t + k * 0.07, 0.07, -0.6 + 0.3 * k)
    else:
        print("unhandled cue", ty)
SFX = reverb(SFX, IR_ROOM, 0.18)


# ───────────────────────────── narration ─────────────────────────────

def compress(x, thresh=0.12, ratio=3.0, att=0.004, rel=0.12):
    e = np.abs(signal.hilbert(x))
    a1, r1 = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    sm = signal.lfilter([1 - r1], [1, -r1], e)  # release-dominated follower
    sm = np.maximum(sm, signal.lfilter([1 - a1], [1, -a1], e))
    over = np.maximum(sm / thresh, 1)
    return x / over ** (1 - 1 / ratio)


def peaking(x, f0, gain_db, q=0.9):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(b, a, x)


VO = np.zeros(N)
for key, at in TL["vo"].items():
    v, sr = sf.read(ROOT / "vo" / f"{key}.wav")
    v = signal.resample_poly(v, SR, sr)
    i = int(at * SR)
    VO[i:i + len(v)] += v[: N - i]
VO = hp(VO, 75)
VO = peaking(VO, 3200, 2.5)
VO = peaking(VO, 220, -1.5)
VO = compress(VO)
VO = VO / np.abs(VO).max() * 0.85
VOs = reverb(VO, IR_ROOM, 0.05)

# duck the bed under speech
act = np.clip(np.abs(signal.hilbert(VO)) / 0.04, 0, 1)
follow = lambda x, tc: signal.lfilter([1 - np.exp(-1 / (tc * SR))], [1, -np.exp(-1 / (tc * SR))], x)
act = np.maximum(follow(act, 0.012), follow(act, 0.35))   # fast attack, slow release
act = np.clip(act * 1.6, 0, 1)
act = np.concatenate([act[int(0.06 * SR):], np.zeros(int(0.06 * SR))])  # 60 ms look-ahead
duck = 1 - 0.6 * act            # about -8 dB under speech
sfx_duck = 1 - 0.5 * act        # about -6 dB under speech

stems = {
    "music": music * 0.13 * duck[:, None],
    "sfx": SFX * 0.5 * sfx_duck[:, None],
    "vo": VOs * 1.0,
}


def k_weight(x):
    """ITU-R BS.1770 K-weighting at 48 kHz."""
    x = signal.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    return signal.lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], x, axis=0)


def lufs(x):
    y = k_weight(x) ** 2
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([y[i:i + blk].mean(axis=0).sum() for i in range(0, len(y) - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    ms = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    ms = ms[(-0.691 + 10 * np.log10(ms + 1e-12)) > rel]
    return -0.691 + 10 * np.log10(ms.mean())


def limit(x, ceiling, look=0.005, rel=0.08):
    """Look-ahead peak limiter on 4x-oversampled peaks (true-peak aware)."""
    from scipy.ndimage import minimum_filter1d
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    g = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    w = int(look * SR)
    g = minimum_filter1d(g, size=2 * w + 1, origin=0)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):            # instant attack (pre-shaped by look-ahead), smooth release
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    gs = signal.lfilter([1 - np.exp(-1 / (0.001 * SR))], [1, -np.exp(-1 / (0.001 * SR))], out)
    return x * np.minimum(gs, g)[:, None]


mix = stems["music"] + stems["sfx"] + stems["vo"]
target, ceiling = -14.0, 10 ** (-2.0 / 20)  # headroom for AAC overshoot -> about -1 dBTP after encoding
for _ in range(3):
    mix *= 10 ** ((target - lufs(mix)) / 20)
    mix = limit(mix, ceiling)
print("loudness", round(lufs(mix), 2), "LUFS, sample peak", round(20 * np.log10(np.abs(mix).max()), 2), "dBFS")
sf.write(ROOT / "mix.wav", mix.astype(np.float32), SR, subtype="FLOAT")

# report the balance while the narrator is speaking
seg = json.loads((ROOT / "vo/segments.json").read_text())
speech = lambda x: bp(x, 300, 4000)
SB = {k: speech(v) for k, v in stems.items()}
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vm, vs, names = [], [], []
for k, at in TL["vo"].items():
    for a, b_ in seg[k]:
        i, j = int((at + a) * SR), int((at + b_) * SR)
        vm.append(db(SB["vo"][i:j]) - db(SB["music"][i:j])); vs.append(db(SB["vo"][i:j]) - db(SB["sfx"][i:j])); names.append(f"{k}@{at + a:.2f}")
print("speech band 300-4k Hz ->", end=" "); print(f"voice over music: min {min(vm):.1f} dB, median {np.median(vm):.1f} dB | voice over sfx: min {min(vs):.1f} dB, median {np.median(vs):.1f} dB")
order = np.argsort(vm)[:4]; print("tightest vs music:", [(names[i], round(vm[i], 1)) for i in order])
order = np.argsort(vs)[:4]; print("tightest vs sfx:", [(names[i], round(vs[i], 1)) for i in order])
gain_total = np.sqrt(np.mean(mix ** 2)) / max(np.sqrt(np.mean((stems["music"] + stems["sfx"] + stems["vo"]) ** 2)), 1e-12)
on = act > 0.5
def lufs_mask(x, m):
    return lufs(x[m]) if m.sum() > SR else float("nan")
print(f"music bed during speech {lufs_mask(stems['music'] * gain_total, on):.1f} LUFS, between lines {lufs_mask(stems['music'] * gain_total, ~on):.1f} LUFS, voice {lufs_mask(stems['vo'] * gain_total, on):.1f} LUFS")
