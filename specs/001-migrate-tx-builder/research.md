# Research: Migrate tx-builder to safe-wallet-monorepo

**Phase**: 0 - Research
**Date**: 2026-01-12

## Research Topics

### 1. MUI v4 to v6 Migration

**Decision**: Migrate all `@material-ui/*` imports to `@mui/material` v6

**Rationale**:

- Monorepo uses MUI v6 (`@mui/material: ^6.3.0`)
- Current tx-builder has mixed imports (theme uses v6, components use v4)
- MUI v6 has improved theming, better TypeScript support

**Migration Strategy**:

1. Replace `@material-ui/core` → `@mui/material`
2. Replace `@material-ui/icons` → `@mui/icons-material`
3. Replace `@material-ui/lab` → `@mui/lab`
4. Update component APIs (minimal changes v4→v6 for most components)
5. Update theme configuration to use v6 `createTheme` API

**Key API Changes**:

- `makeStyles` deprecated → use `styled` or `sx` prop
- `fade()` → `alpha()`
- Some prop renames (e.g., `disableElevation` → `disableElevation` unchanged)
- Grid v2 available but v1 syntax still works

**Alternatives Considered**:

- Keep MUI v4: Rejected - inconsistent with monorepo, v4 is legacy
- Use Tamagui: Rejected - web app pattern is MUI, Tamagui is for mobile

---

### 2. React 17 to 19 Migration

**Decision**: Upgrade to React 19.1.0 (matching monorepo)

**Rationale**:

- Monorepo uses React 19.1.0
- React 19 has improved performance, concurrent features
- `react-dom/client` API required

**Migration Strategy**:

1. Update `ReactDOM.render()` → `createRoot().render()`
2. Review useEffect dependencies (stricter in React 18+)
3. Update event handler types if needed
4. Test Suspense boundaries if any

**Breaking Changes**:

- `ReactDOM.render` deprecated - must use `createRoot`
- Automatic batching (usually beneficial, rarely breaking)
- Stricter hydration warnings (not applicable - SPA)

**Alternatives Considered**:

- React 18: Rejected - monorepo already on 19, no reason to stay behind

---

### 3. ethers v5 to v6 Migration

**Decision**: Upgrade to ethers 6.14.3 (matching monorepo)

**Rationale**:

- Monorepo uses ethers 6.14.3 (enforced via resolutions)
- ethers v6 has better tree-shaking, improved types
- Safe SDKs require consistent ethers version

**Migration Strategy**:

1. `ethers.providers.Web3Provider` → `ethers.BrowserProvider`
2. `ethers.utils.isAddress` → `ethers.isAddress`
3. `BigNumber` class removed → use native `bigint`
4. `Contract` instantiation API changes
5. Update ABI handling

**Key API Changes**:

```typescript
// v5
import { ethers } from 'ethers'
const provider = new ethers.providers.Web3Provider(window.ethereum)
const address = ethers.utils.getAddress(addr)
const isValid = ethers.utils.isAddress(addr)

// v6
import { ethers, BrowserProvider, getAddress, isAddress } from 'ethers'
const provider = new BrowserProvider(window.ethereum)
const address = getAddress(addr)
const isValid = isAddress(addr)
```

**Alternatives Considered**:

- viem: Rejected - would require rewrite of all web3 code, monorepo uses ethers

---

### 4. CRA to Vite Migration

**Decision**: Use Vite 6.x as bundler

**Rationale**:

- CRA (react-scripts) is deprecated/unmaintained
- Vite has fast HMR, modern ESM-first approach
- Better build performance
- Simpler configuration

**Migration Strategy**:

1. Create `vite.config.ts` with React plugin
2. Move `public/index.html` → `index.html` (root level)
3. Rename entry `src/index.tsx` → `src/main.tsx`
4. Replace `REACT_APP_*` env vars → `VITE_*`
5. Update import.meta.env usage
6. Configure path aliases if needed
7. Remove react-scripts, react-app-rewired, config-overrides.js

**Vite Configuration**:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tx-builder/',
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
})
```

**Environment Variables**:

- `REACT_APP_TENDERLY_*` → `VITE_TENDERLY_*`
- Access via `import.meta.env.VITE_*` instead of `process.env.REACT_APP_*`

**Alternatives Considered**:

- Next.js: Rejected - tx-builder is a SPA, Next.js is overkill for iframe app
- Keep CRA: Rejected - deprecated, slow, no active maintenance

---

### 5. Safe Apps SDK Compatibility

**Decision**: Upgrade to @safe-global/safe-apps-sdk ^9.1.0

**Rationale**:

- Monorepo uses ^9.1.0
- Current tx-builder uses ^8.1.0 (via safe-react-apps root)
- Need consistent SDK version for proper Safe integration

**Migration Strategy**:

1. Update `@safe-global/safe-apps-sdk` to ^9.1.0
2. Update `@safe-global/safe-apps-react-sdk` to compatible version
3. Review SDK API changes (mostly additive, few breaking)
4. Update `SafeProvider` usage if needed

**API Changes (v8 → v9)**:

- Mostly additive (new methods)
- `sdk.txs.send()` signature unchanged
- New chain support methods

**Alternatives Considered**:

- Keep v8: Rejected - would create version conflicts with monorepo packages

---

### 6. styled-components vs Emotion

**Decision**: Keep styled-components initially, consider emotion migration later

**Rationale**:

- Current codebase uses styled-components extensively
- MUI v6 uses emotion internally
- Full migration would be significant effort
- styled-components and emotion can coexist

**Migration Strategy**:

1. Keep styled-components for existing component styling
2. Use MUI's `sx` prop and `styled` for new components
3. Consider gradual migration to emotion if maintenance issues arise

**Alternatives Considered**:

- Migrate all to emotion: Rejected - too much scope for initial migration
- Migrate all to Tailwind: Rejected - inconsistent with monorepo patterns

---

### 7. GitHub Actions Workflow Design

**Decision**: Create independent tx-builder deployment workflow

**Rationale**:

- tx-builder should release independently from web app
- PR previews needed for testing
- Staging/production deployment via S3

**Workflow Design**:

```yaml
# .github/workflows/tx-builder-deploy.yml
name: tx-builder Deploy

on:
  pull_request:
    paths:
      - apps/tx-builder/**
  push:
    branches: [dev, main]
    paths:
      - apps/tx-builder/**

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/yarn
      - name: Build tx-builder
        run: yarn workspace @safe-global/tx-builder build
        env:
          VITE_TENDERLY_ORG_NAME: ${{ secrets.TENDERLY_ORG_NAME }}
          # ... other env vars

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: build
    # Deploy to S3 preview bucket

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: build
    # Deploy to staging bucket

  deploy-dev:
    if: github.ref == 'refs/heads/dev'
    needs: build
    # Deploy to dev bucket
```

**Alternatives Considered**:

- Deploy with web app: Rejected - different release cadence needed
- Use Vercel/Netlify: Rejected - existing S3 infrastructure preferred

---

### 8. Testing Infrastructure Migration

**Decision**: Migrate all unit tests and Cypress E2E tests to the monorepo

**Rationale**:

- Existing tests provide critical regression coverage
- 17 E2E tests cover all major user flows
- Unit tests validate form logic and utilities
- Tests ensure migration doesn't break functionality

**Unit Test Migration Strategy**:

1. **Copy test files** with source files (colocated pattern)
2. **Update test-utils.tsx** for React 19:

   ```typescript
   // Before (React 17)
   import { render } from '@testing-library/react'
   return render(<Providers>{children}</Providers>)

   // After (React 19) - no change needed for render, but providers may need updates
   ```

3. **Replace axios mocks with MSW** (per constitution):

   ```typescript
   // Before
   jest.mock('axios', () => ({ get: jest.fn() }))

   // After
   import { setupServer } from 'msw/node'
   import { http, HttpResponse } from 'msw'

   const server = setupServer(http.get('/api/*', () => HttpResponse.json({ data: [] })))
   ```

4. **Update MUI component testing**:
   - MUI v6 may have different DOM structure
   - Use `data-testid` attributes where possible
   - Avoid relying on MUI-specific class names

**Cypress E2E Migration Strategy**:

1. **Copy test files and fixtures** to `apps/tx-builder/cypress/`
2. **Update cypress.config.ts** for Vite:

   ```typescript
   import { defineConfig } from 'cypress'

   export default defineConfig({
     e2e: {
       baseUrl: 'http://localhost:3000',
       env: {
         TX_BUILDER_URL: 'http://localhost:3000/tx-builder',
       },
     },
   })
   ```

3. **Preserve iframe helpers** - these are critical for Safe App testing
4. **Update environment variables** in CI workflow

**Test Dependencies to Add**:

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "@faker-js/faker": "^9.0.3",
    "msw": "^2.7.3",
    "cypress": "^13.15.2",
    "cypress-file-upload": "^5.0.8"
  }
}
```

**Alternatives Considered**:

- Skip E2E tests: Rejected - too much coverage would be lost
- Rewrite tests: Rejected - existing tests are comprehensive and working

---

## Dependency Version Matrix

| Package                    | Current (safe-react-apps) | Target (monorepo)         |
| -------------------------- | ------------------------- | ------------------------- |
| react                      | 17.0.2                    | 19.1.0                    |
| react-dom                  | 17.0.2                    | 19.1.0                    |
| @mui/material              | @material-ui/core 4.12.4  | 6.3.0                     |
| @mui/icons-material        | @material-ui/icons 4.11.3 | 6.1.6                     |
| ethers                     | 5.7.2                     | 6.14.3                    |
| typescript                 | 4.9.4                     | 5.9.2                     |
| @safe-global/safe-apps-sdk | 8.1.0                     | 9.1.0                     |
| styled-components          | 5.3.6                     | 5.3.6 (keep)              |
| react-router-dom           | 6.4.3                     | 6.4.3 (compatible)        |
| react-hook-form            | 7.39.1                    | 7.41.1 (monorepo version) |

---

## Risk Assessment

| Risk                          | Impact | Likelihood | Mitigation                                       |
| ----------------------------- | ------ | ---------- | ------------------------------------------------ |
| MUI v4→v6 styling breaks      | Medium | High       | Incremental migration, visual regression testing |
| React 19 compatibility issues | Medium | Low        | Well-documented upgrade path                     |
| ethers v6 breaks web3 code    | High   | Medium     | Thorough testing of all transaction flows        |
| Build performance regression  | Low    | Low        | Vite is faster than CRA                          |
| Safe Apps SDK incompatibility | High   | Low        | SDK is backward compatible                       |

---

## Open Questions Resolved

All research questions have been resolved. No NEEDS CLARIFICATION items remain.
