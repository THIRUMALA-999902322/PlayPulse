#!/usr/bin/env bash
# Rebuilds ../playpulse-explainer.mp4 from source.
#
#   ./build.sh           render the picture, synthesise the score, encode
#   ./build.sh --voice   also regenerate the narration from tts.py first
#
# Needs Node 18+, Python 3.11+, ffmpeg, and a Chromium that playwright-core
# 1.56 can launch (`npx playwright install chromium` if none is present).
# WORKERS sets how many headless browsers render in parallel (default 4).
set -euo pipefail
cd "$(dirname "$0")"

WORKERS=${WORKERS:-4}
FRAMES=$(python3 -c 'import json; t = json.load(open("web/timeline.json")); print(round(t["duration"] * t["fps"]))')
PORT=${PORT:-8123}

npm install --no-audit --no-fund --silent
[[ -x .venv/bin/python ]] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

if [[ "${1:-}" == "--voice" ]]; then
  # Kokoro-82M (Apache-2.0): weights from the kokoro-q8-shards npm package,
  # voice style vectors from kokoro-js. The joined file must match upstream.
  mkdir -p .cache
  (cd .cache && npm pack --silent kokoro-q8-shards@1.0.0 kokoro-js@1.2.1 >/dev/null \
    && for f in *.tgz; do mkdir -p "${f%.tgz}" && tar -xzf "$f" -C "${f%.tgz}"; done)
  cat .cache/kokoro-q8-shards-1.0.0/package/kokoro-q8.part{0..5}.bin > .cache/kokoro-q8.onnx
  echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  .cache/kokoro-q8.onnx" | sha256sum -c -
  .venv/bin/python tts.py .cache/kokoro-q8.onnx .cache/kokoro-js-1.2.1/package/voices vo
  .venv/bin/python pauses.py vo
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

node render.mjs --port "$PORT" --cues cues.json

# Frames already on disk are skipped, so an interrupted build resumes.
per=$(( (FRAMES + WORKERS - 1) / WORKERS ))
pids=()
for ((i = 0; i < WORKERS; i++)); do
  from=$(( i * per )); to=$(( (i + 1) * per < FRAMES ? (i + 1) * per : FRAMES ))
  node render.mjs --port "$PORT" --out frames --from "$from" --to "$to" &
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done

.venv/bin/python music.py .

ffmpeg -loglevel error -y -framerate 30 -i frames/f%05d.jpg -i mix.wav \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a aac -b:a 192k -shortest ../playpulse-explainer.mp4
echo "wrote ../playpulse-explainer.mp4"
