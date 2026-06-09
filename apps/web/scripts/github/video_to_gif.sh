#!/bin/bash

set -e

# Converts a recorded Playwright one-shot clickthrough video into a GIF and an MP4.
#
# Intended to be invoked in CI with `working-directory: apps/web/e2e`, so the
# default relative paths resolve against that directory.
#
# Env vars (both optional):
#   VIDEO_DIR  Directory to search (recursively) for the recorded .webm video.
#              Default: ./test-results
#   OUT_DIR    Directory to write the artifacts into (created if missing).
#              Default: ./reports/one-shots
#
# Outputs (fixed names):
#   $OUT_DIR/clickthrough.gif
#   $OUT_DIR/clickthrough.mp4
#
# Requires ffmpeg (pre-installed on GitHub ubuntu-latest runners).

VIDEO_DIR="${VIDEO_DIR:-./test-results}"
OUT_DIR="${OUT_DIR:-./reports/one-shots}"

if [[ ! -d "$VIDEO_DIR" ]]; then
  echo "video_to_gif: VIDEO_DIR '$VIDEO_DIR' does not exist" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "video_to_gif: ffmpeg is not installed" >&2
  exit 1
fi

# Find the largest .webm under VIDEO_DIR (Playwright writes one per one-shot test;
# picking the largest yields the most complete recording if several exist).
# `-exec ls -S {} +` only runs ls when there ARE matches, so an empty result
# stays empty (instead of ls listing the cwd) and is portable across CI/macOS.
VIDEO_FILE="$(find "$VIDEO_DIR" -type f -name '*.webm' -exec ls -S {} + 2>/dev/null | head -n 1)"

if [[ -z "$VIDEO_FILE" ]]; then
  echo "video_to_gif: no .webm video found under '$VIDEO_DIR'" >&2
  exit 1
fi

echo "video_to_gif: using video '$VIDEO_FILE'"

mkdir -p "$OUT_DIR"

GIF_OUT="$OUT_DIR/clickthrough.gif"
MP4_OUT="$OUT_DIR/clickthrough.mp4"

# GIF: two-pass palette approach for good quality.
# Downscale to 640px wide and cap at 10 fps to keep the file size reasonable.
# Write the intermediate palette into OUT_DIR (guaranteed writable) and remove it on exit.
PALETTE="$OUT_DIR/palette.png"
trap 'rm -f "$PALETTE"' EXIT

GIF_FILTERS="fps=10,scale=640:-1:flags=lanczos"

ffmpeg -y -i "$VIDEO_FILE" -vf "$GIF_FILTERS,palettegen" "$PALETTE"
ffmpeg -y -i "$VIDEO_FILE" -i "$PALETTE" \
  -lavfi "$GIF_FILTERS [x]; [x][1:v] paletteuse" "$GIF_OUT"

# MP4: H.264 at full resolution for broad compatibility.
ffmpeg -y -i "$VIDEO_FILE" \
  -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart \
  -an "$MP4_OUT"

# Report absolute paths and sizes for CI logs.
GIF_ABS="$(cd "$(dirname "$GIF_OUT")" && pwd)/$(basename "$GIF_OUT")"
MP4_ABS="$(cd "$(dirname "$MP4_OUT")" && pwd)/$(basename "$MP4_OUT")"

echo "video_to_gif: wrote artifacts:"
echo "  $GIF_ABS ($(du -h "$GIF_OUT" | cut -f1))"
echo "  $MP4_ABS ($(du -h "$MP4_OUT" | cut -f1))"
