"""Synthesise the narration with Kokoro-82M.

kokoro-onnx supplies phonemisation and the vocab; the session is driven directly
because the onnx-community export takes a float32 `speed`, which kokoro-onnx's
own wrapper would pass as int32.

Usage: python tts.py <model.onnx> <voices_dir> <out_dir>
"""
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx.config import EspeakConfig
from kokoro_onnx.tokenizer import Tokenizer

SR = 24000
VOICE = "af_heart"

LINES = {
    "hook":     ("Finding a game shouldn't take fifty messages.", 1.0),
    "meet":     ("Meet PlayPulse.", 0.95),
    "discover": ("Open the app, and a live map lights up with every game around you. "
                 "Filter by sport, cricket, football, basketball, and see what's live right now.", 1.04),
    "join":     ("Tap a match to see when and where, the skill level, and how many spots are left. "
                 "One tap, and you're on the roster. Add it to your calendar, or share it with a friend.", 1.04),
    "checkin":  ("On match day, check in step by step. Confirmed. On the way. Arrived. "
                 "So the organiser knows exactly who's coming.", 1.02),
    "gameon":   ("Once it's game on, everything lives inside the match. Chat with everyone, or just your team. "
                 "Follow the live scoreboard, ball by ball. Can't make it? Watch the stream.", 1.04),
    "host":     ("Want to run your own game? Tap plus, pick a sport, a time and a ground, "
                 "and it's live on the map. Make it weekly, or keep it invite-only.", 1.04),
    "levelup":  ("Every game builds your portfolio, with competitive and practice tracked separately. "
                 "And a reliability score that proves you turn up.", 1.02),
    "outro":    ("PlayPulse. Find a game. Join in. Play now.", 0.95),
}


def trim(audio, thresh=0.006, pad=int(0.04 * SR)):
    """Cut leading and trailing near-silence so timeline offsets are exact."""
    idx = np.where(np.abs(audio) > thresh)[0]
    if not len(idx):
        return audio
    return audio[max(idx[0] - pad, 0): min(idx[-1] + pad, len(audio))]


def main(model_path, voices_dir, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    tok = Tokenizer(EspeakConfig())
    # kokoro-js stores each voice as raw float32 rows of 256, one row per token count.
    voice = np.fromfile(Path(voices_dir) / f"{VOICE}.bin", dtype=np.float32).reshape(-1, 1, 256)

    durations = {}
    for key, (text, speed) in LINES.items():
        phonemes = tok.phonemize(text, "en-us")
        ids = tok.tokenize(phonemes)
        audio = sess.run(None, {
            "input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
            "style": voice[len(ids)].astype(np.float32),
            "speed": np.array([speed], dtype=np.float32),
        })[0][0]
        audio = trim(audio)
        sf.write(out / f"{key}.wav", audio, SR)
        durations[key] = round(len(audio) / SR, 3)
        print(f"{key:9s} {durations[key]:6.2f}s  {phonemes[:70]}")

    (out / "durations.json").write_text(json.dumps(durations, indent=2))


if __name__ == "__main__":
    main(*sys.argv[1:4])
