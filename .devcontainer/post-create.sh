#!/usr/bin/env bash
# SPDX-License-Identifier: FSL-1.1-MIT

# Runs once after the devcontainer is created.
# Keep this idempotent so re-running it is safe.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[devcontainer] Activating Corepack..."
corepack enable

echo "[devcontainer] Installing dependencies..."
# Yarn 4 install in this monorepo can spike past Node's default ~4 GB old-space.
# Lift the heap ceiling so the install doesn't OOM inside the container.
NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=6144" yarn install --immutable

echo "[devcontainer] Setup complete."
