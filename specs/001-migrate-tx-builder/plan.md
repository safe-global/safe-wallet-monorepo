# Implementation Plan: Migrate tx-builder to safe-wallet-monorepo

**Branch**: `001-migrate-tx-builder` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migrate-tx-builder/spec.md`

## Summary

Migrate the tx-builder Safe App from safe-react-apps repository to safe-wallet-monorepo as a standalone Vite-powered SPA. The migration includes updating React 17→19, standardizing on MUI v6 (current codebase has mixed v4/v6 imports), ethers v5→v6, and creating an independent CI/CD deployment workflow.

## Technical Context

**Language/Version**: TypeScript 5.9 (matching monorepo)
**Primary Dependencies**:

- React 19.1.0 (from monorepo)
- MUI v6 (`@mui/material` ^6.3.0)
- ethers 6.14.3 (from monorepo)
- Vite 6.x (bundler)
- react-router-dom ^6.x
- react-hook-form ^7.x
- @safe-global/safe-apps-sdk ^9.1.0
- @safe-global/safe-apps-react-sdk (latest compatible)
- styled-components ^5.x or migrate to emotion

**Storage**: Browser localStorage (via localforage for transaction library)
**Testing**: Jest + MSW + React Testing Library (matching monorepo patterns)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Standalone SPA within monorepo (apps/tx-builder)
**Performance Goals**: Build < 3 min, dev server start < 30s, bundle size within 20% of current
**Constraints**: Must work as Safe App in iframe, preserve all existing functionality
**Scale/Scope**: ~104 TSX files, 6 pages, 46 components with MUI dependencies

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle               | Status     | Notes                                                                                |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------ |
| I. Type Safety          | ✅ PASS    | Will use TypeScript 5.9, no `any` types, proper interfaces                           |
| II. Branch Protection   | ✅ PASS    | Working on feature branch `001-migrate-tx-builder`                                   |
| III. Cross-Platform     | ✅ PASS    | tx-builder is web-only, no shared package changes                                    |
| IV. Testing Discipline  | ✅ PASS    | Will use MSW for network mocks, faker for test data                                  |
| V. Feature Organization | ⚠️ N/A     | tx-builder is standalone app, not a feature in web app                               |
| VI. Theme System        | ⚠️ PARTIAL | tx-builder has its own theme; can adopt `@safe-global/theme` tokens later (P3 story) |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-tx-builder/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Safe Apps SDK interface)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/tx-builder/
├── package.json              # @safe-global/tx-builder workspace package
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config extending monorepo
├── cypress.config.ts         # Cypress E2E configuration
├── index.html                # Vite entry HTML
├── public/
│   ├── manifest.json         # Safe App manifest
│   └── tx-builder.png        # App icon
├── src/
│   ├── main.tsx              # App entry (renamed from index.tsx)
│   ├── App.tsx               # Router setup
│   ├── vite-env.d.ts         # Vite type declarations
│   ├── test-utils.tsx        # Test render helpers with providers
│   ├── components/           # UI components (migrated from MUI v4 to v6)
│   │   ├── buttons/
│   │   ├── forms/
│   │   │   ├── SolidityForm.tsx
│   │   │   ├── SolidityForm.test.tsx    # Colocated test
│   │   │   ├── validations/
│   │   │   │   └── validations.test.ts  # Colocated test
│   │   │   └── fields/
│   │   │       └── fields.test.ts       # Colocated test
│   │   ├── modals/
│   │   ├── Header.tsx
│   │   ├── Header.test.tsx              # Colocated test
│   │   ├── Icon/
│   │   └── FixedIcon/
│   ├── pages/                # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── CreateTransactions.tsx
│   │   ├── ReviewAndConfirm.tsx
│   │   ├── TransactionLibrary.tsx
│   │   ├── SaveTransactionLibrary.tsx
│   │   └── EditTransactionLibrary.tsx
│   ├── hooks/                # Custom React hooks
│   ├── store/                # React Context providers (not Redux)
│   ├── lib/                  # Business logic
│   │   ├── batches/
│   │   ├── simulation/
│   │   ├── checksum.ts
│   │   ├── checksum.test.ts             # Colocated test (convert from .js)
│   │   └── storage.ts
│   ├── theme/                # MUI v6 theme configuration
│   ├── routes/               # Route definitions
│   ├── typings/              # TypeScript type definitions
│   ├── utils/
│   │   ├── utils.ts
│   │   └── utils.test.ts                # Colocated test
│   └── mocks/                # MSW handlers (new)
│       └── handlers.ts
├── cypress/                  # E2E tests
│   ├── e2e/
│   │   └── tx-builder.spec.cy.ts        # Main E2E test (17 cases)
│   ├── fixtures/
│   │   ├── test-working-batch.json
│   │   ├── test-mainnet-batch.json
│   │   ├── test-modified-batch.json
│   │   ├── test-invalid-batch.json
│   │   └── test-empty-batch.json
│   └── support/
│       ├── e2e.ts
│       ├── iframe.ts                    # Safe App iframe helpers
│       └── commands.ts

.github/workflows/
├── tx-builder-deploy.yml     # New workflow for tx-builder deployment
└── tx-builder-checks.yml     # PR checks (type-check, lint, test)
```

**Structure Decision**: tx-builder is a standalone Vite SPA in `apps/tx-builder`, following the monorepo pattern for apps. It does NOT integrate into Next.js web app since it runs as a Safe App in an iframe.

## Complexity Tracking

No constitution violations requiring justification.

## Testing Migration

### Unit Tests (6 files to migrate)

| File                                                   | Description            | Migration Notes              |
| ------------------------------------------------------ | ---------------------- | ---------------------------- |
| `src/utils.test.ts`                                    | Utility function tests | Direct copy, update imports  |
| `src/lib/checksum.test.js`                             | Checksum validation    | Convert to TypeScript        |
| `src/components/forms/validations/validations.test.ts` | Form validation tests  | Update MUI component mocks   |
| `src/components/forms/fields/fields.test.ts`           | Form field tests       | Update MUI component mocks   |
| `src/components/forms/SolidityForm.test.tsx`           | SolidityForm component | Update test-utils, MUI mocks |
| `src/components/Header.test.tsx`                       | Header component       | Update test-utils, MUI mocks |

**Test Infrastructure to Migrate**:

- `src/test-utils.tsx` - Custom render with providers (needs React 19 + MUI v6 updates)

**Current Test Patterns**:

```typescript
// Uses custom render with all providers
import { render } from '../test-utils'

// Mocks axios (should migrate to MSW per constitution)
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}))
```

**Migration Changes Required**:

1. Update `test-utils.tsx` for React 19 (`createRoot`) and MUI v6 theme
2. Replace `jest.mock('axios')` with MSW handlers (per constitution IV)
3. Update MUI component selectors (v4 → v6 class names may differ)
4. Add `@faker-js/faker` for test data generation

### Cypress E2E Tests

**Main Test File**: `cypress/e2e/tx-builder/tx-builder.spec.cy.js` (413 lines, 17 test cases)

| Test Case                            | Coverage              |
| ------------------------------------ | --------------------- |
| Create and send simple batch         | Core flow             |
| Create and send complex batch        | Multi-transaction     |
| ENS name resolution                  | Address lookup        |
| ABI-based transaction                | Manual ABI entry      |
| Custom data transaction              | Raw data mode         |
| Cancel batch flow                    | User cancellation     |
| Revert cancel and continue           | Flow recovery         |
| Navigation with data preservation    | State management      |
| Invalid address validation           | Error handling        |
| Missing asset amount validation      | Form validation       |
| Missing method data validation       | Form validation       |
| Upload, save, download, remove batch | Library CRUD          |
| Chain mismatch warning               | Cross-chain detection |
| Modified batch error                 | Integrity check       |
| Invalid batch rejection              | Validation            |
| Empty batch rejection                | Validation            |
| Simulate valid batch                 | Tenderly success      |
| Simulate invalid batch               | Tenderly failure      |

**Cypress Support Files to Migrate**:

```
cypress/
├── e2e/tx-builder/
│   └── tx-builder.spec.cy.js     # Main test file
├── fixtures/
│   ├── test-working-batch.json   # Valid batch for testing
│   ├── test-mainnet-batch.json   # Wrong chain batch
│   ├── test-modified-batch.json  # Tampered batch
│   ├── test-invalid-batch.json   # Malformed batch
│   └── test-empty-batch.json     # Empty batch
├── support/
│   ├── e2e.js                    # Custom commands setup
│   ├── iframe.js                 # Safe App iframe helpers
│   └── commands.js               # cypress-file-upload
└── lib/
    └── slack.js                  # Slack notifications (optional)
```

**Target Structure in Monorepo**:

```
apps/tx-builder/
├── cypress/
│   ├── e2e/
│   │   └── tx-builder.spec.cy.js
│   ├── fixtures/
│   │   └── [batch JSON files]
│   └── support/
│       ├── e2e.js
│       ├── iframe.js
│       └── commands.js
├── cypress.config.ts              # Vite-compatible config
└── package.json                   # cypress devDependency
```

**Cypress Configuration Updates**:

1. Convert `cypress.config.js` → `cypress.config.ts`
2. Update environment variables: `CYPRESS_TX_BUILDER_URL` for local dev
3. Ensure iframe commands work with Safe{Wallet} test environment
4. Add to monorepo CI workflow

---

## Migration Scope Analysis

### Current State (safe-react-apps)

| Aspect     | Current             | Issue                                                         |
| ---------- | ------------------- | ------------------------------------------------------------- |
| React      | 17.0.2              | Outdated, missing React 18/19 features                        |
| MUI        | Mixed v4/v6         | `package.json` has v4, theme imports v6, components import v4 |
| ethers     | v5                  | Breaking changes to v6                                        |
| TypeScript | 4.9                 | Missing newer features                                        |
| Bundler    | CRA (react-scripts) | Deprecated, slow builds                                       |
| Env vars   | `REACT_APP_*`       | CRA pattern                                                   |

### Target State (safe-wallet-monorepo)

| Aspect     | Target   | Benefit                                 |
| ---------- | -------- | --------------------------------------- |
| React      | 19.1.0   | Concurrent features, better performance |
| MUI        | v6       | Modern API, better theming              |
| ethers     | 6.14.3   | Consistent with monorepo                |
| TypeScript | 5.9      | Const type parameters, decorators       |
| Bundler    | Vite 6.x | Fast HMR, modern ESM                    |
| Env vars   | `VITE_*` | Vite pattern                            |

### Files Requiring Migration Changes

1. **46 files** importing from `@material-ui/*` → `@mui/*`
2. **Entry point** `index.tsx` → `main.tsx` (Vite convention)
3. **Environment variables** `REACT_APP_*` → `VITE_*`
4. **Build configuration** CRA → Vite
5. **ethers usage** v5 API → v6 API (breaking changes in providers, utils)
