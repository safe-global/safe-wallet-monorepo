#!/usr/bin/env bash
# Runs every PR of one batch from prs.json; PRs that already have A.json and B.json are skipped.
# Usage: eval/run-batch.sh <batch>
set -uo pipefail

batch="$1"
root="$(git rev-parse --show-toplevel)"
prs="$(node -e '
  for (const p of require(process.argv[1])) if (p.batch === Number(process.argv[2])) console.log(p.pr)' \
  "$root/eval/prs.json" "$batch")"
[ -n "$prs" ] || { echo "no PRs in batch $batch" >&2; exit 1; }

for pr in $prs; do
  if [ -f "$root/eval/runs/$pr/A.json" ] && [ -f "$root/eval/runs/$pr/B.json" ]; then
    echo "skip $pr (done)"
    continue
  fi
  echo "run $pr"
  "$root/eval/run.sh" "$pr" || echo "FAILED $pr"
done
