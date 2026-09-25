#!/usr/bin/env bash
# Runs reviewers A and B on one PR at its review SHA; writes eval/runs/<pr>/<system>.json.
# Usage: eval/run.sh <pr> [systems]   e.g. eval/run.sh 8363 "A B"
# The review runs in a throwaway worktree, so permissions are skipped; network and git writes are blocked.
# Env: CLAUDE_BIN (default: claude), SAFE_ENG_PLUGIN_DIR (safe-engineering-plugin folder, if not installed)
set -euo pipefail

pr="$1"
systems="${2:-A B}"
claude_bin="${CLAUDE_BIN:-claude}"
a_pin=73bf04408c26562bbf8945904bd1c02d8b9b1603
root="$(git rev-parse --show-toplevel)"
out="$root/eval/runs/$pr"

read -r review_sha base_sha < <(node -e '
  const e = require(process.argv[1]).find((p) => p.pr === Number(process.argv[2]))
  if (!e) { console.error("PR not in prs.json"); process.exit(1) }
  console.log(e.reviewSha, e.baseSha)' "$root/eval/prs.json" "$pr")

# SSH auth can fail transiently; skip the fetch when the commits are already local.
for attempt in 1 2 3 4 5; do
  git cat-file -e "$review_sha^{commit}" 2>/dev/null && git cat-file -e "$a_pin^{commit}" 2>/dev/null && break
  git fetch -q origin "pull/$pr/head" valentin/pr-review-learnings-skill && break
  [ "$attempt" = 5 ] && { echo "fetch failed for $pr" >&2; exit 1; }
  sleep 15
done
wt="$(mktemp -d)/pr-$pr"
git worktree add -q --detach "$wt" "$review_sha"
trap 'git -C "$root" worktree remove --force "$wt"' EXIT
mkdir -p "$out"

common="Review only the changes in \`git diff $base_sha...HEAD\`. This is a review: do not modify, create or delete tracked files, do not install dependencies or run tests, and do not use gh or post anything. End with the complete findings report, each finding with file:line."

for sys in $systems; do
  plugin_args=()
  case "$sys" in
    A)
      git -C "$root" archive "$a_pin" .claude/skills/code-conventions docs/engineering | tar -x -C "$wt"
      prompt="Run the /code-conventions skill in --review-pr mode. $common"
      version="$a_pin"
      ;;
    B)
      [ -n "${SAFE_ENG_PLUGIN_DIR:-}" ] && plugin_args=(--plugin-dir "$SAFE_ENG_PLUGIN_DIR")
      prompt="Run the /safe-engineering-plugin:safe-code-review skill. $common"
      version="safe-engineering-plugin@$(node -p "require('${SAFE_ENG_PLUGIN_DIR:-.}/.claude-plugin/plugin.json').version" 2>/dev/null || echo unknown)"
      ;;
    *) echo "unknown system $sys" >&2; exit 1 ;;
  esac

  start=$(date +%s)
  (cd "$wt" && "$claude_bin" -p "$prompt" --output-format json ${plugin_args[@]+"${plugin_args[@]}"} \
    --dangerously-skip-permissions \
    --disallowedTools "Bash(gh:*)" "Bash(git push:*)" "Bash(git commit:*)" "Bash(curl:*)" "Bash(wget:*)" "Bash(yarn:*)" "Bash(npm:*)" "Bash(npx:*)" "WebFetch" "WebSearch" \
  ) > "$out/$sys.raw.json"

  node -e '
    const fs = require("fs")
    const [raw, file, pr, review, base, sys, version, runner, secs] = process.argv.slice(1)
    const r = JSON.parse(fs.readFileSync(raw, "utf8"))
    const models = Object.entries(r.modelUsage ?? {})
    const sum = (k) => models.reduce((a, [, m]) => a + (m[k] ?? 0), 0)
    fs.writeFileSync(file, JSON.stringify({
      pr: Number(pr), reviewSha: review, baseSha: base, system: sys, version,
      model: models.map(([m]) => m).join(","), runner,
      usage: {
        inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens"),
        cacheReadTokens: sum("cacheReadInputTokens"), cacheWriteTokens: sum("cacheCreationInputTokens"),
        turns: r.num_turns, wallSeconds: Number(secs), apiEquivalentUsd: r.total_cost_usd,
      },
      output: r.result,
    }, null, 2) + "\n")
    fs.unlinkSync(raw)' \
    "$out/$sys.raw.json" "$out/$sys.json" "$pr" "$review_sha" "$base_sha" "$sys" "$version" \
    "$(git config user.name)" "$(( $(date +%s) - start ))"
  echo "wrote $out/$sys.json"
done
