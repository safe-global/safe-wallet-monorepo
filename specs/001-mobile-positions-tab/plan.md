# Implementation Plan: Mobile Positions Tab

**Branch**: `001-mobile-positions-tab` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mobile-positions-tab/spec.md`

## Summary

Add a Positions tab to the mobile app Home screen (between Tokens and NFTs) to display DeFi protocol positions with feature parity to web. Implementation extracts shared utilities to `packages/utils` and reuses existing RTK Query endpoints from `packages/store`.

## Technical Context

**Language/Version**: TypeScript 5.x (React Native via Expo)  
**Primary Dependencies**: React Native, Expo, Tamagui, Redux Toolkit (RTK Query), react-native-collapsible-tab-view  
**Storage**: N/A (read-only from CGW API via RTK Query)  
**Testing**: Jest, React Native Testing Library, MSW for API mocking  
**Target Platform**: iOS 15+, Android (via Expo)  
**Project Type**: Mobile (monorepo with shared packages)  
**Performance Goals**: Initial load <3s, pull-to-refresh <5s, smooth scrolling at 50+ positions (60fps)  
**Constraints**: Must reuse existing store endpoints, theme tokens, and component patterns  
**Scale/Scope**: Single tab addition, ~5 new components, ~3 shared utilities extracted

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                    | Status  | Notes                                                                                |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------ |
| I. Monorepo Unity            | ✅ PASS | Shared utilities go to `packages/utils`, platform-specific UI stays in `apps/mobile` |
| II. Type Safety              | ✅ PASS | Will use existing typed Position/Protocol interfaces from `@safe-global/store`       |
| III. Test-First Development  | ✅ PASS | Unit tests for shared utils, component tests with MSW mocking                        |
| IV. Design System Compliance | ✅ PASS | Uses Tamagui components and `@safe-global/theme` tokens                              |
| V. Safe-Specific Security    | ✅ PASS | Read-only feature, no transaction handling, uses existing safe address patterns      |

**Architecture Constraints:**

- ✅ Feature behind feature flag (FEATURES.POSITIONS already exists)
- ✅ Cross-platform logic in `packages/utils`
- ✅ Uses Yarn 4 workspaces

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-positions-tab/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/utils/src/features/positions/
├── utils/
│   ├── getReadablePositionType.ts      # Extracted from web
│   ├── transformAppBalancesToProtocols.ts  # Extracted from web
│   ├── calculatePositionsFiatTotal.ts  # Pure calculation utility
│   └── calculateProtocolPercentage.ts  # New: percentage calculation
├── __tests__/
│   └── *.test.ts                       # Tests for all utilities
└── index.ts

apps/mobile/src/features/Assets/components/Positions/
├── Positions.container.tsx        # Main container with data fetching
├── Positions.container.test.tsx
├── ProtocolSection/
│   ├── ProtocolSection.tsx        # Collapsible protocol card
│   ├── ProtocolSection.test.tsx
│   └── index.ts
├── PositionItem/
│   ├── PositionItem.tsx           # Individual position row
│   ├── PositionItem.test.tsx
│   └── index.ts
├── PositionsEmpty/
│   ├── PositionsEmpty.tsx         # Empty state
│   └── index.ts
├── PositionsError/
│   ├── PositionsError.tsx         # Error state with retry
│   └── index.ts
└── index.ts

apps/web/src/features/positions/
├── utils.ts                       # Refactored to import from @safe-global/utils
└── hooks/usePositions.ts          # Refactored to use shared transform
```

**Structure Decision**: Mobile + shared packages pattern. New Positions components added to existing Assets feature folder. Shared business logic extracted to `packages/utils/src/features/positions/`.

## Complexity Tracking

No violations requiring justification. Implementation follows established patterns.
