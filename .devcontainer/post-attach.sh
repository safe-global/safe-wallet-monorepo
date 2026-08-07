#!/usr/bin/env bash
# SPDX-License-Identifier: FSL-1.1-MIT

# Runs every time VS Code attaches to the devcontainer.
# By this point the Anthropic.claude-code extension is installed, so its
# bundled `claude` CLI is available on PATH and we can use it to manage
# plugins. Everything below is idempotent so re-runs on every attach are
# safe and cheap.
set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  # The Anthropic.claude-code VS Code extension ships a bundled `claude`
  # binary but does not add it to PATH. Resolve the newest installed
  # version (path includes version + arch, so glob-and-sort). Prefer the
  # VS Code server dir; fall back to Cursor's server dir when absent.
  CLAUDE_BIN=$(ls -1d /home/node/.vscode-server/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | sort -V | tail -1)
  if [ -z "$CLAUDE_BIN" ]; then
    CLAUDE_BIN=$(ls -1d /home/node/.cursor-server/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | sort -V | tail -1)
  fi
  if [ -n "$CLAUDE_BIN" ] && [ -x "$CLAUDE_BIN" ]; then
    export PATH="$(dirname "$CLAUDE_BIN"):$PATH"
  fi
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "[devcontainer] 'claude' CLI not found on PATH — skipping plugin install."
  echo "[devcontainer] Open the Anthropic.claude-code extension once, then reload to retry."
  exit 0
fi

# Install Anthropic's official marketplace and the superpowers plugin.
# Both commands are no-ops when already present.
claude plugin marketplace add anthropics/claude-plugins-official || true
claude plugin install superpowers@claude-plugins-official || true
