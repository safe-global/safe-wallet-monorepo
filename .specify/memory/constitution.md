<!--
SYNC IMPACT REPORT
==================
Version Change: N/A → 1.0.0 (Initial constitution)
Modified Principles: N/A (Initial creation)
Added Sections:
  - Core Principles (5 principles established)
  - Architecture Constraints
  - Quality Standards
  - Governance
Removed Sections: N/A (Initial creation)
Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - Scope/requirements align with testing and quality principles
  ✅ tasks-template.md - Task categorization reflects principle-driven task types
  ⚠ Command files - Generic guidance ready, no CLAUDE-specific references
Follow-up TODOs:
  - RATIFICATION_DATE needs to be set (currently marked TODO)
  - Future reviews should validate compliance with monorepo-specific constraints
==================
-->

# Safe{Wallet} Constitution

## Core Principles

### I. Monorepo Unity

The Safe{Wallet} monorepo MUST maintain unified standards and shared infrastructure across web and mobile platforms.

**Rules:**

- Shared packages (`packages/**`) MUST work for both web and mobile environments
- Environment variables MUST follow dual-prefix patterns (`NEXT_PUBLIC_*` || `EXPO_PUBLIC_*`) in shared code
- Theme tokens MUST be defined in `@safe-global/theme` as the single source of truth
- Breaking changes to shared packages MUST be validated against both platforms before merging
- Redux store state changes MUST be compatible with both web and mobile consumers

**Rationale:** The monorepo architecture enables code reuse and consistency. Violations create platform-specific bugs, deployment blockers, and maintenance overhead that compound over time.

### II. Type Safety

TypeScript's type system MUST be strictly enforced without exceptions.

**Rules:**

- The `any` type is PROHIBITED in all code (production and tests)
- Type assertions (`as any`) are PROHIBITED - create properly typed helpers instead
- All functions, variables, and component props MUST have explicit types
- Type-check MUST pass before committing: `yarn workspace @safe-global/{web|mobile} type-check`
- Generated type files (e.g., `packages/utils/src/types/contracts/`) MUST NOT be manually edited

**Rationale:** Type safety prevents runtime errors, enables refactoring confidence, and provides documentation. The `any` escape hatch creates hidden bugs that surface in production. Properly typed code is self-documenting and maintainable.

### III. Test-First Development

All new logic, services, and hooks MUST be covered by unit tests.

**Rules:**

- Business logic MUST have unit tests before merging
- Tests MUST verify behavior, not implementation details (avoid checking specific Redux actions dispatched)
- Network requests MUST be mocked using Mock Service Worker (MSW), not by mocking `fetch` or ethers.js
- Test data MUST be generated using faker for consistency and coverage
- Redux tests MUST verify resulting state changes using properly typed helpers
- Shared package tests MUST validate behavior for both web and mobile environments
- E2E smoke tests (web) MUST pass in CI before deployment

**Rationale:** Tests prevent regressions, document intended behavior, and enable confident refactoring. Implementation-detail tests break during legitimate refactors and provide false confidence.

### IV. Design System Compliance

UI implementation MUST follow established design system patterns and theme tokens.

**Rules:**

- **Web:** MUST use MUI components with Safe MUI theme; MUST use theme variables from `vars.css`
- **Mobile:** MUST use Tamagui components; MUST use theme tokens from `@safe-global/theme`
- Hard-coded colors, spacing, or typography values are PROHIBITED
- `apps/web/src/styles/vars.css` MUST NOT be manually edited (auto-generated)
- New components MUST have corresponding Storybook stories (`.stories.tsx`) for web
- Component stories MUST document all important states and variations
- Light and dark mode theming MUST be updated together for consistency

**Rationale:** Consistent design system implementation ensures brand consistency, accessibility, and maintainability. Theme tokens enable global styling changes without code modifications. Storybook provides visual documentation and isolated component development.

### V. Safe-Specific Security

Safe{Wallet} handles multi-signature transactions and must enforce security best practices.

**Rules:**

- Private keys or sensitive data MUST NEVER be hardcoded - use environment variables
- Ethereum addresses MUST be validated using `ethers.js` utilities (e.g., `isAddress`)
- Safe addresses MUST always be referenced with their `chainId` (Safes are chain-specific)
- Transaction building MUST use Safe SDK patterns (`@safe-global/protocol-kit`, `@safe-global/api-kit`)
- Wallet provider integration MUST follow established Web3-Onboard patterns
- Security-critical changes MUST be reviewed by security-knowledgeable maintainers
- Multi-signature threshold and owner validation MUST be respected in all transaction flows

**Rationale:** Safe{Wallet} is a smart contract wallet managing user assets. Security vulnerabilities can lead to loss of funds. These patterns are established best practices from the Safe ecosystem and MUST be preserved.

## Architecture Constraints

### Code Organization

**Web Application:**

- New features MUST be created in `src/features/` with dedicated folders
- Only globally-used components, hooks, and services belong in top-level `src/` folders
- Each new feature MUST be behind a feature flag (managed via CGW API chain configs)

**Shared Packages:**

- Cross-platform logic MUST reside in `packages/` directory
- Shared code MUST NOT import platform-specific dependencies directly
- Package changes MUST be validated against both web and mobile consumers

### Dependency Management

- Yarn 4 workspaces MUST be used for all dependency management
- Dependencies MUST be added via `yarn workspace <workspace-name> add <package>`
- Monorepo-wide dependencies belong in root `package.json`
- Breaking dependency updates MUST be validated across all affected workspaces

### Workflow Enforcement

- Pre-commit hooks (Husky) MUST run lint-staged (prettier) and type-check
- Pre-push hooks MUST run linting before pushing
- All checks (type-check, lint, prettier, tests) MUST pass before committing
- Commit messages MUST follow semantic commit conventions (feat:, fix:, refactor:, etc.)

## Quality Standards

### Code Quality

**Principles:**

- Follow DRY (Don't Repeat Yourself) - extract reusable functions, hooks, and components
- Prefer functional programming - use pure functions, avoid side effects
- Use declarative patterns - React hooks, derived state over manual synchronization
- Keep implementations simple - avoid over-engineering and premature abstraction

**Error Handling:**

- All UI components MUST handle loading, error, and empty states
- Network errors MUST be properly caught and communicated to users
- Chain-specific logic MUST handle multi-chain scenarios appropriately

### Performance

- Yarn commands MUST be scoped to specific workspaces when possible (e.g., `yarn workspace @safe-global/web dev`)
- Build artifacts (`.next`, `node_modules/.cache`) MUST be cleared when troubleshooting build issues
- Images and assets MUST be optimized before committing

### Documentation

- Storybook stories MUST document component props and usage patterns (web)
- Complex business logic MUST include explanatory comments where non-obvious
- Code style guidelines MUST be followed:
  - Web: `apps/web/docs/code-style.md`
  - Mobile: `apps/mobile/docs/code-style.md`

## Governance

### Amendment Process

This constitution supersedes all other development practices and guidelines.

**Amendment Requirements:**

1. Proposed changes MUST be documented with rationale
2. Proposed changes MUST include impact analysis on existing principles
3. Amendments MUST be reviewed and approved by repository maintainers
4. Version MUST be incremented following semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes or principle removals
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements
5. Dependent templates (plan, spec, tasks, commands) MUST be updated for consistency
6. Migration plan MUST be provided for breaking changes

### Compliance Review

- All PRs MUST verify compliance with constitutional principles
- Complexity that violates principles MUST be explicitly justified in plan documentation
- Pre-commit and pre-push hooks enforce automated compliance for type-checking, linting, and formatting
- Constitution violations discovered post-merge MUST be addressed with high priority

### Runtime Guidance

- AI contributors MUST reference `AGENTS.md` for comprehensive development guidelines
- `CLAUDE.md` provides quick-reference instructions for critical workflows
- Constitution provides non-negotiable principles; guidance files provide implementation patterns

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-01-08
