# Implementation Plan: Proposer Multisig Validation for 2/N Parent Safes

**Branch**: `004-proposer-multisig-validation` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-proposer-multisig-validation/spec.md`

## Summary

Enable proposer delegation (add/remove) for nested Safes whose parent Safe has a threshold > 1. The current implementation assumes a 1/1 parent Safe and submits a single EOA signature wrapped in EIP-1271 format, which fails backend validation for 2/N+ parent Safes. The solution leverages the existing Safe Transaction Service off-chain message signing infrastructure to collect multiple owner signatures before submitting the completed EIP-1271-wrapped delegation.

**Technical Approach**: Store the delegate typed data as an off-chain SafeMessage on the parent Safe. Each parent Safe owner signs the message via the existing off-chain message confirmation API. Once `confirmationsSubmitted >= confirmationsRequired` (threshold met), the `preparedSignature` (all owner signatures concatenated and sorted by address) is wrapped in EIP-1271 format and submitted to the delegate API.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14.x)
**Primary Dependencies**: React, MUI, Redux Toolkit (RTK Query), ethers.js, @safe-global/protocol-kit, @safe-global/api-kit
**Storage**: Safe Transaction Service off-chain messages (existing infrastructure, no new storage)
**Testing**: Jest + MSW (Mock Service Worker) + faker
**Target Platform**: Web (apps/web)
**Project Type**: Web application (monorepo, apps/web only — web-only feature)
**Performance Goals**: Signature collection must complete within TOTP validity window (~2 hours)
**Constraints**: No backend modifications; uses existing CGW/Transaction Service APIs as-is
**Scale/Scope**: Parent Safes with up to 5 owners; direct parent only (one level of nesting)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle               | Status  | Notes                                                                                |
| ----------------------- | ------- | ------------------------------------------------------------------------------------ |
| I. Type Safety          | ✅ PASS | All new code will use proper TypeScript interfaces; no `any`                         |
| II. Branch Protection   | ✅ PASS | Feature branch `004-proposer-multisig-validation`; all quality gates will run        |
| III. Cross-Platform     | ✅ PASS | Web-only feature in `apps/web/`; no shared package changes needed                    |
| IV. Testing Discipline  | ✅ PASS | MSW for network mocking, faker for test data, colocated tests                        |
| V. Feature Organization | ✅ PASS | Changes within existing `src/features/proposers/`; existing feature flag covers this |
| VI. Theme System        | ✅ PASS | Uses MUI components and theme tokens only                                            |

**Gate Result**: ALL PASS — proceed to Phase 0.

**Post-Design Re-Check** (after Phase 1):

- All new TypeScript interfaces properly typed (PendingDelegation, DelegationOrigin, ParentSafeInfo)
- All new files within `src/features/proposers/` — no cross-feature leakage
- MSW handlers defined for all network interactions in test plan
- No hardcoded values; MUI components only
- ✅ ALL PASS — design is constitution-compliant

## Project Structure

### Documentation (this feature)

```text
specs/004-proposer-multisig-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/src/
├── features/proposers/
│   ├── components/
│   │   ├── UpsertProposer.tsx              # MODIFY: branch on threshold, initiate multi-sig flow
│   │   ├── DeleteProposerDialog.tsx        # MODIFY: same multi-sig branching for removal
│   │   ├── PendingDelegation.tsx           # NEW: pending delegation card with progress
│   │   └── PendingDelegationsList.tsx      # NEW: list of pending delegations on settings page
│   ├── hooks/
│   │   ├── useParentSafeThreshold.ts       # NEW: fetch parent Safe threshold + owners
│   │   ├── usePendingDelegations.ts        # NEW: fetch/filter off-chain messages for delegations
│   │   └── useSubmitDelegation.ts          # NEW: wrap preparedSignature in EIP-1271, submit
│   ├── services/
│   │   └── delegationMessages.ts           # NEW: create/confirm off-chain messages on parent Safe
│   └── utils/
│       └── utils.ts                        # MODIFY: add multi-sig signature helpers
├── components/settings/
│   └── ProposersList/
│       └── index.tsx                       # MODIFY: integrate PendingDelegationsList
└── hooks/
    └── useNestedSafeOwners.tsx             # UNCHANGED: already provides parent Safe address
```

**Structure Decision**: All changes are within the existing `apps/web/src/features/proposers/` feature folder, with minimal integration points in the settings page. No new top-level folders needed.

## Complexity Tracking

No constitution violations — table not needed.
