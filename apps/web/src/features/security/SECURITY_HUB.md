# Security Hub — Documentation

## Overview

The Security Hub provides a real-time security posture assessment for individual Safe accounts. It runs 12 automated checks against the Safe's on-chain configuration, deployment history, and operational state, then presents results as a unified security strength score with per-check detail cards.

**Route:** `/security?safe=<chain_prefix>:<safe_address>`

**Access control:** Safe owners (wallet connected) OR Space members whose Space contains this Safe.

---

## Scoring model

### How the overall score works

The score is based on the **clear ratio** — the proportion of applicable checks that pass:

```
applicableChecks = total checks − not_applicable checks
clearRatio = (number of checks with status "clear") / applicableChecks
score = clearRatio × 100
```

Checks that don't apply to this Safe (e.g., multichain check on a single-chain Safe, recovery on an unsupported chain) are excluded from both the numerator and denominator. They don't inflate or deflate the score.

### Check statuses

Each check returns one of five statuses:

| Status             | UI label        | Meaning                                                   | Counts toward score? |
| ------------------ | --------------- | --------------------------------------------------------- | -------------------- |
| **Clear**          | Healthy         | No issues detected                                        | Yes (positive)       |
| **Partial**        | Needs attention | Something worth reviewing                                 | Yes (negative)       |
| **Issue**          | At risk         | A problem that should be addressed                        | Yes (negative)       |
| **Not applicable** | N/A             | Check doesn't apply to this Safe                          | No (excluded)        |
| **Inconclusive**   | Unverified      | Check cannot be completed (blocked feature, missing data) | No (excluded)        |

Only "clear" counts positively. "Partial" and "issue" both reduce the score equally. "Not applicable" and "inconclusive" are both excluded entirely — they affect neither the numerator nor the denominator.

### Strength levels

| Clear ratio | Strength | Color  |
| ----------- | -------- | ------ |
| >= 83%      | Strong   | Green  |
| >= 50%      | Moderate | Yellow |
| >= 17%      | Weak     | Red    |
| < 17%       | Critical | Red    |

### Severity-based score floor

**If any check has Critical severity, strength is capped at "Weak" regardless of clear ratio.** A Safe with 1 signer (Critical) and all other checks clear cannot score above "Weak." This prevents a fundamentally insecure configuration from appearing "Strong."

Checks that can trigger the Critical floor:

- Account setup: 1 signer, or threshold = 1
- Contract version: unsupported master copy

### Risk grades (per check)

Each check reports a severity grade:

| Grade    | Meaning                 | Used when                           |
| -------- | ----------------------- | ----------------------------------- |
| Low      | No risk                 | Check passes                        |
| Medium   | Worth monitoring        | Suboptimal but not dangerous        |
| High     | Should be addressed     | Active risk or unverified component |
| Critical | Immediate action needed | Fundamentally broken configuration  |

### Individual check scores

Each check returns a score (0–100) used for evidence display. These are **not weighted** into the overall score — the overall score only counts clear/not-clear.

---

## Security checks

All check rules, conditions, severities, scores, findings, recommendations, and CTAs are documented in a single matrix:

**See [SECURITY_CHECKS_MATRIX.md](./SECURITY_CHECKS_MATRIX.md)**

---

## Account Activity tab

The second tab shows a historical audit log of all configuration changes to the Safe, fetched from the CGW transaction history endpoint and filtered to `SettingsChange` type.

### Columns

| Column      | Data                                                            |
| ----------- | --------------------------------------------------------------- |
| Timestamp   | Date + time of execution                                        |
| Nonce       | Transaction nonce (multisig) or "Module" (module-executed)      |
| Event       | Change type + description (addresses enriched via address book) |
| Source      | "Safe Wallet" or the Safe App name that initiated the change    |
| Signatures  | X of Y (confirmations / threshold)                              |
| Status      | Executed, Failed, Pending, Ready, Cancelled                     |
| Transaction | Link to full transaction detail page                            |

### Risk flags

Warning chips appear inline on entries with elevated risk:

| Flag             | Condition                                                                 | Color  |
| ---------------- | ------------------------------------------------------------------------- | ------ |
| Critical change  | `SET_GUARD`, `DELETE_GUARD`, `SET_FALLBACK_HANDLER`, `CHANGE_MASTER_COPY` | Yellow |
| Module-executed  | `executionInfo.type === 'MODULE'` (not owner-signed)                      | Yellow |
| Execution failed | `txStatus === 'FAILED'`                                                   | Red    |

### Settings change types tracked

| Type                 | Label                    |
| -------------------- | ------------------------ |
| ADD_OWNER            | Added signer             |
| REMOVE_OWNER         | Removed signer           |
| SWAP_OWNER           | Replaced signer          |
| CHANGE_THRESHOLD     | Changed threshold        |
| CHANGE_MASTER_COPY   | Upgraded contract        |
| ENABLE_MODULE        | Enabled module           |
| DISABLE_MODULE       | Disabled module          |
| SET_GUARD            | Set guard                |
| DELETE_GUARD         | Removed guard            |
| SET_FALLBACK_HANDLER | Changed fallback handler |

---

## UI architecture

### Component hierarchy

```
SafeSecurityView
├── SecurityTabs (Security Overview | Account Activity)
├── Tab: Security Overview
│   ├── SecurityReport
│   │   ├── SecurityStrengthBar (overall score + strength level)
│   │   └── DimensionGrid (grouped by category)
│   │       └── DimensionCard × N (per check)
│   └── CardOverrides (Hypernative branding, Recovery CTAs)
└── Tab: Account Activity
    └── AuditLog (EnhancedTable with sorting + pagination)
```

### Dimension categories

| Category | Visible to                        | Checks                               |
| -------- | --------------------------------- | ------------------------------------ |
| Account  | Everyone (owners + Space members) | All 12 active checks                 |
| User     | Safe page only (not Spaces admin) | Address book, Trusted Safe (planned) |

### Excluded check rendering

Checks that return `not_applicable` or `inconclusive` share the same visual treatment:

- Greyed chip (neutral `border.light` background instead of severity color)
  - `not_applicable` → "N/A" label
  - `inconclusive` → "Unverified" label
- 60% opacity on the entire card
- No CTA button (nothing to act on)
- Excluded from the strength bar count ("X/Y checks passing" only shows applicable checks)

### Access control

| Viewer                                 | Can access? |
| -------------------------------------- | ----------- |
| Safe owner (wallet connected)          | Yes         |
| Space member + Safe is in their Space  | Yes         |
| Space member + Safe NOT in their Space | No          |
| No wallet, no Space membership         | No          |

---

## Data sources

| Data                                                     | Source                                       | Hook/Query                                         |
| -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Safe config (owners, threshold, modules, guard, version) | CGW `/safes/{address}`                       | `useSafeInfo()`                                    |
| Balance, queued tx count                                 | CGW `/safes/{address}/overview`              | `useGetSafeOverviewQuery`                          |
| Multichain signer consistency                            | CGW `/safes/overview` (multiple)             | `useGetMultipleSafeOverviewsQuery`                 |
| Chain features (recovery, hypernative, risk mitigation)  | CGW chain config                             | `useCurrentChain()` + `hasFeature()`               |
| Master copies                                            | CGW `/chains/{chainId}/master-copies`        | `useMasterCopies()`                                |
| Creation transaction (factory, original master copy)     | CGW `/safes/{address}/transactions/creation` | `useTransactionsGetCreationTransactionV1Query`     |
| Known deployments (singletons, factories, handlers)      | `@safe-global/safe-deployments`              | `hasMatchingDeployment()`                          |
| Known Zodiac modules                                     | `@gnosis.pm/zodiac`                          | `ContractVersions`                                 |
| Transaction history (audit log)                          | CGW `/safes/{address}/transactions/history`  | `useLazyTransactionsGetTransactionsHistoryV1Query` |
