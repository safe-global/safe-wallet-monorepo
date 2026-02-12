#!/bin/bash
# Claude Code PreToolUse hook: runs prettier on staged files before git commit.
# Prevents committing code with formatting issues that would fail CI.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if [[ "$COMMAND" != *"git commit"* && "$COMMAND" != *"git add"*"commit"* ]]; then
  exit 0
fi

# Get the repo root (the hook may run from a worktree)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$REPO_ROOT" ]]; then
  exit 0
fi

cd "$REPO_ROOT"

# Collect staged files that prettier cares about
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(js|jsx|ts|tsx|json|md|mdx|yml|yaml|css|html)$' || true)

if [[ -z "$STAGED_FILES" ]]; then
  exit 0
fi

# Run prettier --check on staged files
FAILED_FILES=""
for f in $STAGED_FILES; do
  if [[ -f "$f" ]]; then
    if ! npx prettier --check "$f" >/dev/null 2>&1; then
      FAILED_FILES="$FAILED_FILES\n  - $f"
    fi
  fi
done

if [[ -n "$FAILED_FILES" ]]; then
  # Auto-fix and re-stage
  for f in $STAGED_FILES; do
    if [[ -f "$f" ]]; then
      npx prettier --write "$f" >/dev/null 2>&1 || true
      git add "$f" 2>/dev/null || true
    fi
  done

  echo '{"decision":"allow","reason":"Prettier auto-fixed formatting issues before commit"}' >&2
fi

exit 0
