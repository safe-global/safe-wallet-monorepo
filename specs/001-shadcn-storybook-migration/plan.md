# Implementation Plan: Storybook Coverage Expansion

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-shadcn-storybook-migration/spec.md`

## Summary

Establish comprehensive Storybook story coverage for the Safe{Wallet} web application to enable designer collaboration and future design system improvements. This includes:

1. Automated component inventory and dependency analysis
2. Enhanced MSW mocking infrastructure for realistic story rendering
3. Systematic story creation for all visually-rendered components
4. Page-level stories with full layout support
5. Chromatic visual regression testing integrated into CI

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14.x)
**Primary Dependencies**: Storybook 10.x, MSW 2.x, Chromatic, @storybook/nextjs, MUI
**Storage**: N/A (tooling/documentation feature)
**Testing**: Jest (snapshot tests), Chromatic (visual regression), jest-image-snapshot (local visual)
**Target Platform**: Web browser (Storybook UI), CI/CD (Chromatic)
**Project Type**: web (monorepo - apps/web)
**Performance Goals**: Storybook build <5 min, Chromatic capture <10 min for full suite
**Constraints**: Must integrate with existing Storybook setup, MSW handlers, and CI workflow
**Scale/Scope**: 330 total components, target 100% coverage for sidebar and common, 80% for features

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle               | Status  | Notes                                                                 |
| ----------------------- | ------- | --------------------------------------------------------------------- |
| I. Type Safety          | ✅ PASS | All story files and MSW handlers will be TypeScript with proper types |
| II. Branch Protection   | ✅ PASS | Working on feature branch, will submit PR                             |
| III. Cross-Platform     | ✅ PASS | Web-only feature (Storybook), no impact on mobile                     |
| IV. Testing Discipline  | ✅ PASS | Using MSW for mocking per constitution; extending existing patterns   |
| V. Feature Organization | ✅ PASS | Stories colocated with components per existing convention             |
| VI. Theme System        | ✅ PASS | Stories use existing theme system, no hardcoded values                |

**Gate Result**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/001-shadcn-storybook-migration/
├── plan.md              # This file
├── research.md          # Phase 0: MSW patterns, Chromatic setup, story templates
├── data-model.md        # Phase 1: Component inventory schema
├── quickstart.md        # Phase 1: How to create stories following this plan
├── contracts/           # Phase 1: Story template contracts
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
apps/web/
├── .storybook/
│   ├── main.ts                    # Storybook config (existing, may extend)
│   ├── preview.tsx                # Preview decorators (existing, will add layout decorator)
│   ├── test-runner.mjs            # Visual test config (existing)
│   └── decorators/                # NEW: Shared decorators for stories
│       ├── LayoutDecorator.tsx    # Full page layout wrapper
│       ├── MockProviderDecorator.tsx  # Redux/context providers with mocks
│       └── index.ts
├── src/
│   ├── components/
│   │   ├── common/                # 16 components, 4 stories
│   │   │   └── *.stories.tsx      # NEW/EXPANDED stories
│   │   ├── sidebar/               # 3 components, 0 stories (critical)
│   │   │   └── *.stories.tsx      # NEW stories
│   │   ├── dashboard/             # 18 components, 1 story
│   │   │   └── *.stories.tsx      # NEW stories
│   │   ├── transactions/          # 38 components, 0 stories
│   │   │   └── *.stories.tsx      # NEW stories
│   │   ├── settings/              # 14 components, 0 stories
│   │   │   └── *.stories.tsx      # NEW stories
│   │   └── balances/              # 10 components, 0 stories
│   │       └── *.stories.tsx      # NEW stories
│   └── features/
│       └── */
│           └── components/
│               └── *.stories.tsx  # EXPANDED stories per feature

config/test/msw/
├── handlers.ts                    # Legacy handlers (for reference)
├── handlers/                      # Organized handler modules
│   ├── fromFixtures.ts            # PRIMARY: Fixture-based handlers (real API data)
│   ├── safe.ts                    # Utility: Auth, relay, messages
│   ├── transactions.ts            # Utility: Tx queue/history
│   ├── web3.ts                    # Utility: Web3/RPC mocks
│   └── index.ts                   # Exports fixtureHandlers as primary API
├── fixtures/                      # Real API response data (JSON)
│   ├── balances/                  # Balance fixtures by scenario
│   │   ├── ef-safe.json
│   │   ├── vitalik.json
│   │   ├── spam-tokens.json
│   │   ├── safe-token-holder.json
│   │   └── empty.json
│   ├── portfolio/                 # Portfolio fixtures by scenario
│   ├── positions/                 # DeFi positions fixtures
│   ├── safes/                     # Safe info fixtures
│   ├── chains/                    # Chain config fixtures
│   └── index.ts                   # Type-safe fixture exports
├── scripts/
│   └── fetch-fixtures.ts          # Script to refresh fixtures from staging CGW
├── factories/                     # Deterministic test data builders
└── scenarios/                     # Empty/Error/Loading state handlers

scripts/                           # NEW: Tooling scripts
└── storybook/
    ├── inventory.ts               # Component inventory generator
    └── coverage-report.ts         # Story coverage analyzer

.github/workflows/
└── chromatic.yml                  # NEW: Chromatic CI workflow
```

**Structure Decision**: Extends existing web app structure. Stories colocated with components per AGENTS.md convention. MSW infrastructure expanded in config/test/msw/. New scripts directory for tooling.

## Complexity Tracking

No violations to justify - all changes align with constitution principles.

---

## Phase 0: Research

See [research.md](./research.md) for detailed findings.

### Research Tasks

1. **MSW-Storybook Integration Best Practices**
   - How to initialize MSW in Storybook preview
   - Per-story handler overrides
   - Network state simulation (loading, error)

2. **Chromatic Configuration & CI Integration**
   - GitHub Actions workflow setup
   - PR blocking configuration
   - Designer review workflow

3. **Story Template Patterns**
   - shadcn component story template
   - Data-dependent component story template
   - Page-level story template with layout

4. **Component Inventory Automation**
   - AST-based component detection
   - Dependency extraction (hooks, API calls)
   - Coverage calculation

5. **Web3 Mocking in Storybook**
   - Wallet connection mock patterns
   - Chain/network state simulation
   - Transaction signing mocks

---

## Phase 1: Design

See [data-model.md](./data-model.md) for entity schemas.
See [contracts/](./contracts/) for templates.
See [quickstart.md](./quickstart.md) for developer guide.

### Design Outputs

1. **Component Inventory Schema** (`data-model.md`)
   - Component entity with path, type, dependencies
   - Story coverage tracking
   - Priority scoring model

2. **Story Templates** (`contracts/`)
   - `ui-component.stories.template.tsx` - For simple UI components
   - `common-component.stories.template.tsx` - For data-dependent components
   - `page.stories.template.tsx` - For full-page layouts

3. **MSW Fixture Patterns** (`config/test/msw/`)
   - Fixture-based handlers using real API data from staging CGW
   - Scenario presets: efSafe, vitalik, spamTokens, safeTokenHolder, empty, withoutPositions
   - Feature flag testing via chain config overrides
   - Fixture refresh: `npx tsx config/test/msw/scripts/fetch-fixtures.ts`

4. **Quick Start Guide** (`quickstart.md`)
   - How to create a story for each component type
   - MSW handler creation workflow
   - Chromatic review process
