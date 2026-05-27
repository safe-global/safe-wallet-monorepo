#!/bin/bash

# fetch-pr-comments.sh
# Fetch PR comments from every closed GitHub PR within a lifecycle timestamp window,
# filter out known-noisy bots, and emit a compact per-comment file
# suitable for pattern distillation by an LLM.
#
# Stateless: does not read or write any ledger. Prints a JSON summary
# to stdout for the caller (SKILL.md) to parse.

set -euo pipefail
umask 077

# --- defaults ---
REPO=""
SINCE=""
UNTIL="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
FETCHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
OUT=""
MODE="all"  # all | humans-only
STATE="closed"
DATE_FIELD="closed" # closed | merged | updated
# Bots that add no structural review signal. AI review bots (Copilot,
# chatgpt-codex-connector, claude[bot], coderabbitai[bot], cursor[bot], etc.)
# are intentionally NOT in this list — their feedback is useful.
# codescene-delta-analysis[bot] is denied because it only emits complexity-
# threshold warnings, which are code-metric noise rather than review signal.
DENY_BOTS="dependabot[bot],app/dependabot,github-actions[bot],app/github-actions,renovate[bot],app/renovate,codecov[bot],codecov-commenter,coveralls[bot],github-advanced-security[bot],socket-security[bot],codescene-delta-analysis[bot]"

usage() {
  cat <<EOF >&2
Usage: $(basename "$0") --repo owner/repo --since ISO-8601 [options]

Options:
  --repo owner/repo      Required. GitHub repo.
  --since ISO-8601       Required. Analyze PRs from this timestamp.
  --until ISO-8601       Default: current UTC timestamp.
  --state STATE          PR state passed to gh (closed | merged | all). Default: closed.
  --date-field FIELD     GitHub search field (closed | merged | updated). Default: closed.
  --out PATH             Default: \$TMPDIR/code-conventions/<timestamp>.txt
  --humans-only          Exclude all bots (AI review bots included).
  --deny LOGIN           Add a bot login to the deny list. Repeatable.
  -h, --help             Show this help.

Output: compact comments file at --out, JSON summary on stdout.

The fetch is recall-first: for every matching PR in the window, the script
fetches the PR's full comment history across inline review comments, review
bodies, and PR conversation comments. Duplicates across overlapping timestamp
windows are expected and should be de-duplicated during distillation.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --until) UNTIL="$2"; shift 2 ;;
    --state) STATE="$2"; shift 2 ;;
    --date-field) DATE_FIELD="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --humans-only) MODE="humans-only"; shift ;;
    --deny) DENY_BOTS="${DENY_BOTS},$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

[[ -z "$REPO" ]] && { echo "ERROR: --repo is required" >&2; usage; exit 2; }
[[ -z "$SINCE" ]] && { echo "ERROR: --since is required (ISO-8601 timestamp or YYYY-MM-DD)" >&2; usage; exit 2; }

if [[ ! "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "ERROR: --repo must use owner/repo with GitHub-safe characters" >&2
  exit 2
fi

case "$STATE" in
  closed|merged|all) ;;
  *) echo "ERROR: --state must be one of: closed, merged, all" >&2; exit 2 ;;
esac

case "$DATE_FIELD" in
  closed|merged|updated) ;;
  *) echo "ERROR: --date-field must be one of: closed, merged, updated" >&2; exit 2 ;;
esac

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI not installed" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq not installed" >&2; exit 1; }
gh auth status -h github.com >/dev/null 2>&1 || {
  echo "ERROR: gh is not authenticated. Run 'gh auth login'." >&2
  exit 1
}

if [[ -z "$OUT" ]]; then
  TMPBASE="${TMPDIR:-/tmp}"
  TMPBASE="${TMPBASE%/}/code-conventions"
  mkdir -p "$TMPBASE"
  chmod 700 "$TMPBASE"
  OUT="${TMPBASE}/$(date -u +%Y%m%dT%H%M%SZ).txt"
fi

WORKDIR="$(mktemp -d -t code-conventions-XXXXXX)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "Fetching PRs from $REPO with ${DATE_FIELD} timestamp between $SINCE and $UNTIL (state: $STATE)..." >&2

gh pr list --repo "$REPO" --state "$STATE" \
  --search "${DATE_FIELD}:${SINCE}..${UNTIL}" \
  --limit 1000 \
  --json number,title,author,state,createdAt,updatedAt,closedAt,mergedAt \
  > "$WORKDIR/prs.json"

if [[ "$(jq 'length' "$WORKDIR/prs.json")" -eq 1000 ]]; then
  echo "ERROR: hit --limit 1000 PRs. The window is too wide — shrink --since and re-run so no PRs are missed." >&2
  exit 3
fi

TOTAL_PRS=$(jq 'length' "$WORKDIR/prs.json")
echo "Found $TOTAL_PRS PRs in window." >&2

# Build deny-list JSON array
DENY_JSON=$(printf '%s\n' "$DENY_BOTS" | tr ',' '\n' | jq -R . | jq -sc .)

# Drop PRs authored by denied bots (no review signal there)
jq --argjson deny "$DENY_JSON" \
  '[.[] | select(.author.login as $l | $deny | index($l) | not)]' \
  "$WORKDIR/prs.json" > "$WORKDIR/prs-filtered.json"

FILTERED_PRS=$(jq 'length' "$WORKDIR/prs-filtered.json")

if [[ "$FILTERED_PRS" -eq 0 ]]; then
  : > "$OUT"
  jq -nc \
    --arg out "$OUT" --arg repo "$REPO" \
    --arg since "$SINCE" --arg until "$UNTIL" \
    --arg date_field "$DATE_FIELD" --arg state "$STATE" \
    --arg fetched_at "$FETCHED_AT" \
    '{
      out_path: $out, repo: $repo,
      window: { since: $since, until: $until, date_field: $date_field },
      state: $state,
      fetched_at: $fetched_at,
      prs: 0, comments: 0
    }'
  exit 0
fi

# Fetch full comment history for each PR. Do not swallow failures: a partial
# corpus is worse than no corpus because it looks authoritative.
mkdir -p "$WORKDIR/inline-comments" "$WORKDIR/reviews" "$WORKDIR/issue-comments"
FETCHED=0
FAILED_PRS=()
while read -r pr; do
  failed=0

  if ! gh api "repos/${REPO}/pulls/${pr}/comments" --paginate > "$WORKDIR/inline-comments/${pr}.json"; then
    echo "ERROR: failed to fetch inline review comments for PR #${pr}" >&2
    failed=1
  fi

  if ! gh api "repos/${REPO}/pulls/${pr}/reviews" --paginate > "$WORKDIR/reviews/${pr}.json"; then
    echo "ERROR: failed to fetch review bodies for PR #${pr}" >&2
    failed=1
  fi

  if ! gh api "repos/${REPO}/issues/${pr}/comments" --paginate > "$WORKDIR/issue-comments/${pr}.json"; then
    echo "ERROR: failed to fetch PR conversation comments for PR #${pr}" >&2
    failed=1
  fi

  if [[ "$failed" -ne 0 ]]; then
    FAILED_PRS+=("$pr")
  fi

  FETCHED=$((FETCHED + 1))
  if (( FETCHED % 20 == 0 )); then
    echo "  Fetched comment history for $FETCHED/$FILTERED_PRS PRs..." >&2
  fi
done < <(jq -r '.[].number' "$WORKDIR/prs-filtered.json")

if (( ${#FAILED_PRS[@]} > 0 )); then
  echo "ERROR: incomplete comment fetch. Failed PRs: ${FAILED_PRS[*]}" >&2
  exit 1
fi

# PR metadata map: { "3019": { author, title, state, closedAt, mergedAt }, ... }
jq 'reduce .[] as $p ({}; . + {
    ($p.number | tostring): {
      author: $p.author.login,
      title: $p.title,
      state: $p.state,
      closedAt: $p.closedAt,
      mergedAt: $p.mergedAt
    }
  })' "$WORKDIR/prs-filtered.json" > "$WORKDIR/pr-meta.json"

# Build filter pipeline
MODE_FILTER="."
if [[ "$MODE" == "humans-only" ]]; then
  MODE_FILTER='map(select(.user.type == "User"))'
fi

# Combine and format into compact grouped-by-PR view.
# The `clean_body` jq function strips HTML noise that some AI review bots
# (notably cursor[bot]) append to every comment — "Fix in Cursor" button
# blocks, JWT-laden tracking URLs, <picture>/<source> tags, Bugbot IDs,
# LOCATIONS markers, and trailing reaction-request strings from
# chatgpt-codex-connector. The actual headline + description text stays.
jq -rs \
  --slurpfile meta "$WORKDIR/pr-meta.json" \
  --argjson deny "$DENY_JSON" \
  '
  def clean_body:
    # Null-safe: pass through when body is null
    if . == null then ""
    else
      # Cut the cursor[bot] footer from the first "Fix in Cursor/Web" anchor
      # through the end of the body. The anchor sometimes appears wrapped in
      # <p>/<div>, sometimes bare — match either case.
      sub("(?s)\n*\\s*(<(p|div)>\\s*)?<a href=\"https://cursor\\.com/.*$"; "")
      # Strip <details><summary>Additional Locations ...</summary> ... </details> blocks.
      | gsub("(?s)<details>\\s*<summary>Additional Locations[^<]*</summary>.*?</details>"; "")
      # Strip bugbot tracking markers (single-line HTML comments).
      | gsub("<!-- BUGBOT_BUG_ID:[^>]*-->"; "")
      # Strip LOCATIONS markers; file:line paths inside are already implicit
      # in the per-comment `path:line` header above the body.
      | gsub("(?s)<!--\\s*LOCATIONS START.*?LOCATIONS END\\s*-->"; "")
      # Strip DESCRIPTION markers but keep the text they wrap.
      | gsub("<!--\\s*DESCRIPTION START\\s*-->\\s*"; "")
      | gsub("\\s*<!--\\s*DESCRIPTION END\\s*-->"; "")
      # Strip the cursor autofix attribution footer.
      | gsub("(?s)<sub>\\s*This Bugbot Autofix run was free\\..*?</sub>"; "")
      # Strip the chatgpt-codex-connector reaction-request footer.
      # Emojis in it are separated by a NO-BREAK SPACE (U+00A0), so match
      # from "Useful?" to end of line rather than pinning exact bytes.
      | gsub("(?m)^\\s*Useful\\? React.*$"; "")
      # Strip Claude Code subscription prompt when no review was actually run.
      | gsub("(?s)^## Claude Code Review\\s+This repository is configured for manual code reviews\\..*$"; "")
      # Collapse the whitespace that the removals leave behind.
      | gsub("\n{3,}"; "\n\n")
      | sub("^\\s+"; "")
      | sub("\\s+$"; "")
    end;

  def pr_number:
    if .pull_request_url then
      .pull_request_url | capture("pulls/(?<n>[0-9]+)").n
    elif .issue_url then
      .issue_url | capture("issues/(?<n>[0-9]+)").n
    else
      ""
    end;

  def surface:
    if has("path") then "inline-review-comment"
    elif has("state") and has("commit_id") then "review-body"
    else "pr-conversation-comment"
    end;

  def location:
    if has("path") then
      "\(.path):\(.line // .original_line // "-")"
    elif has("state") and has("commit_id") then
      "PR review (\(.state // "commented"))"
    else
      "PR conversation"
    end;

  def context:
    if has("diff_hunk") then
      (.diff_hunk // "" | split("\n") | .[-5:] | join("\n"))
    elif has("state") and has("commit_id") then
      "Review state: \(.state // "commented")"
    else
      ""
    end;

  $meta[0] as $m |
  [.[] | .[]]
  | map(select(.user.login as $l | $deny | index($l) | not))
  | '"$MODE_FILTER"'
  | map({
      pr:       pr_number,
      id:       (.id // 0),
      author:   .user.login,
      surface:  surface,
      location: location,
      context:  context,
      body:     (.body | clean_body)
    })
  | map(select(.pr != ""))
  # Drop comments whose body is empty after cleaning (pure-noise cursor autofix etc.)
  | map(select(.body | length > 0))
  | map(. + { pr_meta: $m[.pr] })
  | map(. + { pr_author: .pr_meta.author })
  | map(. + { role: (if .author == .pr_author then "author" else "reviewer" end) })
  | sort_by((.pr_meta.closedAt // .pr_meta.mergedAt // .pr) as $sortKey | $sortKey)
  | group_by(.pr)
  | reverse
  | map(
      "\n\n========= PR #\(.[0].pr) (author: \(.[0].pr_author), state: \(.[0].pr_meta.state // "unknown"), closedAt: \(.[0].pr_meta.closedAt // "n/a"), mergedAt: \(.[0].pr_meta.mergedAt // "n/a")) =========\n"
      + "Title: \(.[0].pr_meta.title // "")\n"
      + (map(
          "\n--- [\(.role): \(.author)] \(.surface) id=\(.id) \(.location) ---\n"
          + (.context // "") + "\n"
          + ">>> " + .body + "\n"
        ) | join(""))
    )
  | join("\n")
  ' "$WORKDIR/inline-comments/"*.json "$WORKDIR/reviews/"*.json "$WORKDIR/issue-comments/"*.json > "$OUT"

KEPT_COMMENTS=$(grep -c '^>>>' "$OUT" 2>/dev/null || true)
KEPT_COMMENTS="${KEPT_COMMENTS:-0}"

echo "Wrote $KEPT_COMMENTS comments across $FILTERED_PRS PRs to $OUT" >&2

jq -nc \
  --arg out "$OUT" \
  --arg repo "$REPO" \
  --arg since "$SINCE" \
  --arg until "$UNTIL" \
  --arg date_field "$DATE_FIELD" \
  --arg state "$STATE" \
  --arg fetched_at "$FETCHED_AT" \
  --argjson prs "$FILTERED_PRS" \
  --argjson comments "$KEPT_COMMENTS" \
  '{
    out_path: $out,
    repo: $repo,
    window: { since: $since, until: $until, date_field: $date_field },
    state: $state,
    fetched_at: $fetched_at,
    prs: $prs,
    comments: $comments
  }'
