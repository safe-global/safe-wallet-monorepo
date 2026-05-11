#!/usr/bin/env bash
# Creates the 8 stacked draft PRs for the security-hub split.
# Run after SSO is authorized: `gh auth refresh -h github.com -s repo,read:org`
# then visit the SSO grant URL it surfaces.
set -euo pipefail

REPO=safe-global/safe-wallet-monorepo

pr_create() {
  local head=$1 base=$2 title=$3 body=$4
  echo "Creating PR: $title (head=$head base=$base)"
  gh pr create --repo "$REPO" --base "$base" --head "$head" --draft \
    --title "$title" --body "$body"
}

STACK_HEADER='## Stack

This stack splits #7820 into 8 reviewable pieces. PRs are stacked — each one is based on the previous, and merging from the top down lands the same final state as #7820.

1. PR1 — feature flag + route plumbing → base: `dev`
2. PR2 — scanner infra + types → base: PR1
3. PR3 — individual scanners + tests → base: PR2
4. PR4 — scoring + feature public API → base: PR3
5. PR5 — security/spaces hooks → base: PR4
6. PR6 — SecurityHub container + hooks → base: PR5
7. PR7 — panel components + drawer + table → base: PR6
8. PR8 — sidebar + page + routing → base: PR7

#7820 stays open and unchanged. Stack-top is byte-identical to #7820.'

# ---------------- PR 1/8 ----------------
pr_create \
  feat/security-hub-pt1-shared-infra \
  dev \
  "feat(web): security-hub split 1/8 — feature flag + route plumbing" \
"> SECURITY_HUB flag,
> route added, schema bumped,
> stack starts here.

## Summary

Part **1/8** of the stacked split of #7820. Foundational, low-risk plumbing:

- Adds \`SECURITY_HUB\` to the \`FEATURES\` enum.
- Registers \`SECURITY_HUB\` in MSW chain fixtures.
- Bumps the auto-generated gateway schema hash.
- Marks \`/spaces/security\` as a recognised space route.
- Minor \`PageLayout\` / \`useRouterGuard\` touch-ups.

$STACK_HEADER

## Visual summary

\`\`\`mermaid
flowchart LR
  A[FEATURES enum] --> B[SECURITY_HUB]
  B --> C[MSW fixtures]
  B --> D[useIsSpaceRoute]
  D --> E[/spaces/security route eligible/]
\`\`\`

## Notes for reviewers

- The \`console.log\` in \`useRouterGuard\` and the empty line in \`PageLayout\` are carried over verbatim from the original branch; they'll be cleaned up before final merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 2/8 ----------------
pr_create \
  feat/security-hub-pt2-scanner-infra \
  feat/security-hub-pt1-shared-infra \
  "feat(security): security-hub split 2/8 — scanner infra + types" \
"> Types and utils first,
> scanners plug in next pull,
> contract before code.

## Summary

Part **2/8**. Introduces the core scanner module shape:

- \`types\`: \`ScanContext\`, \`ScanResult\`, \`SecurityScanner\` contract.
- \`constants\`: thresholds, version data, environment guards.
- \`utils\`: \`computeSummary\`, \`severityRank\`, \`scanKey\`, \`formatTimestamp\`.
- \`test-helpers\`: shared scaffolding for scanner unit tests.

Forward refs to \`securityTypes\` / \`securityScoring\` resolve in PR 4/8.

$STACK_HEADER

## Visual summary

\`\`\`mermaid
flowchart TB
  T[types.ts] --> S[SecurityScanner]
  U[utils.ts] --> S
  C[constants.ts] --> S
  H[test-helpers.ts] --> S
  S -.uses.-> ST[(securityTypes — PR4)]
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 3/8 ----------------
pr_create \
  feat/security-hub-pt3-scanners \
  feat/security-hub-pt2-scanner-infra \
  "feat(security): security-hub split 3/8 — scanners + registry" \
"> Eleven scanners now,
> each one a guard at the gate,
> registry assembles.

## Summary

Part **3/8**. Implements the 11 scanners + registry:

- \`accountSetup\`, \`multichainSetup\`, \`contractVersion\`
- \`modules\`, \`guard\`, \`fallbackHandler\`, \`factoryValidation\`
- \`pendingTx\`, \`recovery\`, \`transactionScanning\`, \`signerIntegrity\`

Plus \`registry.ts\` exposing the \`SCANNERS\` array consumed by the scoring engine. Each scanner ships with its own unit tests; a shared \`defaultValues\` regression test guards against drift.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 4/8 ----------------
pr_create \
  feat/security-hub-pt4-scoring-public-api \
  feat/security-hub-pt3-scanners \
  "feat(security): security-hub split 4/8 — scoring + feature public API" \
"> Raw results in,
> a graded summary out,
> the feature wraps tight.

## Summary

Part **4/8**. Wraps the scanners into a consumable feature:

- \`securityTypes\` / \`securityChecks\`: dimension definitions + \`CheckStatus\` taxonomy.
- \`securityScoring\`: aggregates \`ScanResult[]\` into per-Safe \`SecurityGrade\`.
- \`feature\` / \`contract\` / \`index\` / \`testing\` / \`types\`: feature-architecture public API.
- \`SECURITY_CHECKS_MATRIX.md\`: source-of-truth severity/weight/grade matrix.

Resolves PR 2/8 forward refs. Hooks consuming this land in PR 5/8.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 5/8 ----------------
pr_create \
  feat/security-hub-pt5-hooks \
  feat/security-hub-pt4-scoring-public-api \
  "feat(security): security-hub split 5/8 — scan + redirect hooks" \
"> Hooks pull the scoring,
> queue per-Safe scans for spaces,
> guard the new page.

## Summary

Part **5/8**. React hooks layered on top of PR 4/8:

- \`features/security/hooks/useSecurityScan\`: runs \`SCANNERS\` and exposes results.
- \`features/security/hooks/useSecurityHubFeatureRedirect\`: gates the route behind the \`SECURITY_HUB\` flag.
- \`features/spaces/hooks/useAutoScan\`: queues per-Safe scans across a space.
- \`features/spaces/hooks/useSafeScanContext\`: builds per-Safe \`ScanContext\` from RTK Query data.

Each hook ships with unit tests.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 6/8 ----------------
pr_create \
  feat/security-hub-pt6-container \
  feat/security-hub-pt5-hooks \
  "feat(security-hub): security-hub split 6/8 — container + orchestrator hooks" \
"> Container picks up,
> orchestrator weaves scans,
> drawer state on call.

## Summary

Part **6/8**. SecurityHub container + state-machine hooks under \`features/spaces\`:

- Page / index / types / utils.
- \`useAutoScanOrchestrator\`: schedules and reconciles per-Safe scans.
- \`useReconciledSpaceSafes\`: zips space membership with chain Safe state.
- \`useReportDrawer\`: drawer open/close + selected scan target.
- \`useScanResultsState\`: aggregates results across Safes for the panel.

Forward refs to UI components resolve in PR 7/8.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 7/8 ----------------
pr_create \
  feat/security-hub-pt7-panel-components \
  feat/security-hub-pt6-container \
  "feat(security-hub): security-hub split 7/8 — panel, drawer, table, health card" \
"> Pixels at last,
> panel, drawer, table, card,
> stories ride along.

## Summary

Part **7/8**. The four visual components inside the SecurityHub container:

- \`WorkspaceHealthCard\`: aggregate score + grade chips + re-scan.
- \`SecuritySafesTable\`: per-Safe rows with status / score / actions.
- \`SecurityPanelView\`: shell + primitives + \`useSecurityChecks\` state.
- \`SecurityReportDrawer\`: accordion drawer with per-check CTAs.

Each component ships with Storybook story, story-derived snapshot test, and \`__snapshots__\`. Container-level tests cover the wired-up flow.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# ---------------- PR 8/8 ----------------
pr_create \
  feat/security-hub-pt8-sidebar-routing \
  feat/security-hub-pt7-panel-components \
  "feat(security-hub): security-hub split 8/8 — sidebar + page + routing" \
"> Sidebar light up,
> the page resolves at last,
> stack-top equals truth.

## Summary

Part **8/8**, the final integration:

- \`pages/spaces/security.tsx\`: Next.js page entry.
- Sidebar config + variants register the Security item.
- \`SpaceSidebarNavigation\`: nav item + active-state handling.
- \`features/spaces/contract.ts\` / \`feature.ts\`: feature-flag plumbing.

After this PR lands on top of 1-7, the resulting state is byte-for-byte identical to #7820.

$STACK_HEADER

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

echo ""
echo "All 8 draft PRs created."
