#!/usr/bin/env bash
# Turn on "blind signing" in the emulated Ledger's Ethereum app.
#
# Safe signs a SafeTx as EIP-712 typed data. With blind signing off — which is how the app boots —
# the device does not prompt: it refuses outright, showing "Blind signing must be enabled in
# settings" and answering the APDU with 0x6a80. Every signing test fails until this has run.
#
# The setting lives in the app's own settings menu and there is no APDU to set it, so it has to be
# driven through the buttons. From the home screen the sequence is: right (App settings), both
# (enter, landing on Blind signing), both (toggle to Enabled).
#
# The setting is held in NVRAM, which is not persisted unless Speculos runs with --save-nvram, so
# this must run again after every container restart.
set -euo pipefail

SPECULOS_URL="${SPECULOS_URL:-http://localhost:5000}"

press() {
  curl -sSf -m 10 -X POST "${SPECULOS_URL}/button/$1" \
    -H 'Content-Type: application/json' \
    -d '{"action":"press-and-release"}' >/dev/null
}

screen_text() {
  curl -sSf -m 10 "${SPECULOS_URL}/events" |
    python3 -c 'import sys,json;print(" ".join(e["text"] for e in json.load(sys.stdin)["events"]))'
}

for _ in $(seq 1 30); do
  if curl -sf -m 3 "${SPECULOS_URL}/events" >/dev/null 2>&1; then break; fi
  sleep 2
done

curl -sSf -m 10 -X DELETE "${SPECULOS_URL}/events" >/dev/null

press right
press both
press both

if screen_text | grep -q 'Enabled'; then
  echo "Blind signing enabled"
else
  echo "Could not enable blind signing. Screens seen: $(screen_text)" >&2
  exit 1
fi
