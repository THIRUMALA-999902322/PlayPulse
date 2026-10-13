"""Measures phrase boundaries in each narration clip -> vo/segments.json.

Scenes key on-screen events and subtitles to these, so they land on the words.
Usage: python pauses.py <vo_dir>
"""
import sys, json, numpy as np, soundfile as sf
from pathlib import Path
d = Path(sys.argv[1]); out = {}
for f in sorted(d.glob('*.wav')):
    a, sr = sf.read(f); hop = int(sr*0.01)
    env = np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0, len(a)-hop, hop)])
    loud = env > 0.012
    # speech segments separated by >= 140 ms of quiet
    segs, start, quiet = [], None, 0
    for i, v in enumerate(loud):
        if v:
            if start is None: start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet >= 14: segs.append((start/100, (i-quiet+1)/100)); start = None; quiet = 0
    if start is not None: segs.append((start/100, len(loud)/100))
    out[f.stem] = [(round(s,2), round(e,2)) for s,e in segs]
    print(f.stem, out[f.stem])
json.dump(out, open(d/'segments.json','w'), indent=1)
