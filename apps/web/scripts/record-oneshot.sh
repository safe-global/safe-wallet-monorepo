#!/bin/bash

set -u

# Records the Playwright one-shot clickthrough locally and converts it to a
# GIF + MP4 so the author can preview it before opening a PR.
#
# Run it from the apps/web workspace via:
#   yarn workspace @safe-global/web pw:oneshot:record
#
# Optional env:
#   PLAYWRIGHT_BASE_URL  App URL to run the clickthrough against. If unset, the
#                        Playwright config defaults to http://localhost:3000, so
#                        a local dev server must be running.
#
# NOTE: this script intentionally does NOT `set -e` around the test run — we want
# to still convert whatever video was recorded even if an assertion fails, so the
# author can preview what happened.

VIDEO_DIR="e2e/test-results"
OUT_DIR="e2e/reports/one-shots"
GIF_OUT="$OUT_DIR/clickthrough.gif"
MP4_OUT="$OUT_DIR/clickthrough.mp4"

if [[ -n "${PLAYWRIGHT_BASE_URL:-}" ]]; then
  echo "record-oneshot: running against PLAYWRIGHT_BASE_URL=$PLAYWRIGHT_BASE_URL"
else
  echo "record-oneshot: PLAYWRIGHT_BASE_URL is unset — defaulting to http://localhost:3000"
  echo "record-oneshot: make sure a local dev server is running:"
  echo "                yarn workspace @safe-global/web dev"
  echo "                (or set PLAYWRIGHT_BASE_URL to point at another target)"
fi

# Run the one-shot project. Capture its exit code instead of aborting, so the
# video still gets converted even on assertion failure.
npx playwright test --config=e2e/playwright.config.ts --project=one-shots --retries=0 --workers=1
PW_EXIT=$?

echo "record-oneshot: playwright exited with code $PW_EXIT"

# Convert the recorded video (reuses the shared ffmpeg helper — do not duplicate it).
VIDEO_DIR="$VIDEO_DIR" OUT_DIR="$OUT_DIR" bash scripts/github/video_to_gif.sh || true

echo ""
if [[ -f "$GIF_OUT" || -f "$MP4_OUT" ]]; then
  echo "record-oneshot: clickthrough artifacts:"
  [[ -f "$GIF_OUT" ]] && echo "  $GIF_OUT"
  [[ -f "$MP4_OUT" ]] && echo "  $MP4_OUT"
else
  echo "record-oneshot: no video/GIF was produced."
  echo "                The dev server may not have been running, or the test"
  echo "                produced no recording. Start the dev server (or set"
  echo "                PLAYWRIGHT_BASE_URL) and try again."
fi

echo ""
echo "record-oneshot: playwright exit code was $PW_EXIT"
echo "record-oneshot: CI records and posts this clickthrough as a PR comment automatically — you don't need to attach it to the PR manually."

exit "$PW_EXIT"
