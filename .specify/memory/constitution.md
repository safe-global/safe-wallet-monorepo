<!--
Sync Impact Report
==================
Version change: 1.0.0 (initial)
Modified principles: N/A (initial constitution)
Added sections:
  - I. Type Safety (NON-NEGOTIABLE)
  - II. Branch Protection & Quality Gates
  - III. Cross-Platform Consistency
  - IV. Testing Discipline
  - V. Feature Organization
  - VI. Theme System Integrity
  - Technology Stack section
  - Development Workflow section
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
  - .specify/templates/spec-template.md ✅ (no changes required)
  - .specify/templates/tasks-template.md ✅ (no changes required)
Follow-up TODOs: None
-->

# Safe{Wallet} Monorepo Constitution

## Core Principles

### I. Type Safety (NON-NEGOTIABLE)

TypeScript's type system is the first line of defense against bugs. The `any` type is
strictly forbidden across the entire codebase.

- **MUST** never use `any` type - create proper interfaces/types instead
- **MUST** use `as` type assertions only when TypeScript cannot infer correctly, never to bypass type errors
- **MUST** use Zod for runtime validation at system boundaries (API responses, user input)
- **MUST** prefer interfaces over type aliases for object shapes
- Test helpers MUST be properly typed - no `as any` escapes in tests

**Rationale**: A single `any` can cascade through the codebase, silently breaking type guarantees
and allowing runtime errors that TypeScript was designed to prevent.

### II. Branch Protection & Quality Gates

All changes flow through pull requests. Direct pushes to protected branches are forbidden.

- **MUST** never push directly to `dev` (default) or `main` (production) branches
- **MUST** create feature branches for all changes: `feature/your-feature-name`
- **MUST** pass all quality gates before committing:
  - `yarn workspace @safe-global/web type-check` (or mobile)
  - `yarn workspace @safe-global/web lint`
  - `yarn workspace @safe-global/web prettier`
  - `yarn workspace @safe-global/web test`
- **MUST** use semantic commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **MUST** never commit failing code - all tests must pass

**Rationale**: Pre-commit hooks enforce these gates, but understanding them prevents wasted cycles
debugging hook failures.

### III. Cross-Platform Consistency

The monorepo serves both web (Next.js) and mobile (Expo/React Native). Changes to shared code
MUST work for both platforms.

- **MUST** test shared package changes (`packages/**`) against both web and mobile
- **MUST** use dual environment variable patterns in shared packages:
  `process.env.NEXT_PUBLIC_* || process.env.EXPO_PUBLIC_*`
- **MUST** ensure Redux store changes work for both platforms
- **MUST** never import platform-specific code into shared packages
- Web-only features go in `apps/web/`, mobile-only in `apps/mobile/`

**Rationale**: Breaking mobile when changing web (or vice versa) creates silent regressions that
surface late in the development cycle.

### IV. Testing Discipline

Tests validate behavior, not implementation details. Network mocking uses MSW, not function mocks.

- **MUST** use Mock Service Worker (MSW) for network request mocking, not `jest.mock(fetch)`
- **MUST** use MSW for blockchain RPC call mocking, not ethers.js mocks
- **MUST** use faker for test data generation
- **MUST** colocate test files with source: `Component.tsx` → `Component.test.tsx`
- **MUST** verify Redux state changes, not action dispatch calls
- **MUST** cover new logic, services, and hooks with unit tests

**Rationale**: Mocking implementation details (function calls) creates brittle tests that break
on refactoring. Mocking boundaries (network) validates actual behavior.

### V. Feature Organization

Features are modular, isolated, and controlled by feature flags.

- **MUST** create new web features in `src/features/[feature-name]/`
- **MUST** gate new web features behind feature flags (CGW API chains config)
- **MUST** create Storybook stories for new web components (`.stories.tsx`)
- Only truly global code belongs in top-level `src/` folders
- **MUST** handle loading, error, and empty states in all UI components

**Rationale**: Feature flags enable incremental rollout and quick rollback. Feature folders
prevent cross-feature coupling and make code ownership clear.

### VI. Theme System Integrity

The `@safe-global/theme` package is the single source of truth for all design tokens.

- **MUST** never hardcode colors, spacing, or typography values
- **MUST** never edit `apps/web/src/styles/vars.css` directly - it's auto-generated
- **MUST** use theme tokens: MUI theme (web) or Tamagui tokens (mobile)
- **MUST** update both light and dark mode palettes together for consistency
- **MUST** run `yarn workspace @safe-global/web css-vars` after theme changes

**Rationale**: Hardcoded values create visual inconsistencies and make theme updates impossible
to apply uniformly.

## Technology Stack

The monorepo enforces specific technology choices to maintain consistency:

| Layer           | Web (apps/web)       | Mobile (apps/mobile) | Shared (packages/) |
| --------------- | -------------------- | -------------------- | ------------------ |
| Framework       | Next.js              | Expo (React Native)  | Platform-agnostic  |
| UI Library      | MUI                  | Tamagui              | N/A                |
| State           | Redux + RTK Query    | Redux + RTK Query    | Redux slices       |
| Styling         | CSS vars + MUI theme | Tamagui tokens       | @safe-global/theme |
| Testing         | Jest + MSW + Cypress | Jest + MSW           | Jest + MSW         |
| Package Manager | Yarn 4 workspaces    | Yarn 4 workspaces    | Yarn 4 workspaces  |

**Web3/Blockchain stack**:

- Safe SDK: `@safe-global/protocol-kit`, `@safe-global/api-kit`
- Wallet connection: Web3-Onboard
- Ethereum: ethers.js
- Address validation: Always use `isAddress` from ethers.js
- Chain awareness: Always include `chainId` when referencing a Safe

## Development Workflow

Every code change follows this sequence:

1. **Branch**: Create feature branch from `dev`
2. **Implement**: Write code following platform-specific code style guides
   - Web: `apps/web/docs/code-style.md`
   - Mobile: `apps/mobile/docs/code-style.md`
3. **Validate**: Run quality gates (type-check → lint → prettier → test)
4. **Commit**: Use semantic commit messages, ensure hooks pass
5. **PR**: Fill out PR template, ensure CI passes
6. **Review**: Address feedback, maintain all quality gates

**Generated files** - MUST NOT be manually edited:

- `packages/utils/src/types/contracts/` - auto-generated from ABIs
- `apps/web/src/styles/vars.css` - auto-generated from theme

## Governance

This constitution supersedes informal practices. All PRs and code reviews MUST verify compliance
with these principles.

**Amendment process**:

1. Propose changes via PR to this file
2. Justify why the change is necessary
3. Update version according to semantic versioning:
   - MAJOR: Principle removal or fundamental redefinition
   - MINOR: New principle or materially expanded guidance
   - PATCH: Clarifications and typo fixes
4. Document migration plan if breaking change

**Compliance verification**:

- Pre-commit hooks enforce type-check, lint, and formatting
- CI enforces full test suite
- Code review MUST verify principle adherence
- Feature flag requirement verified at PR review

**Version**: 1.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12
