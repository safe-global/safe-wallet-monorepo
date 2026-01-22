# AI Contributor Guidelines

**📖 Read @AGENTS.md for comprehensive guidelines on contributing to this repository.**

## 🚨 Critical Git Workflow Rules

**NEVER push directly to `dev` (default branch) or `main` (production branch).**

Always create a feature branch and submit a pull request:

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and ALWAYS run tests before committing
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test

# Commit only after tests pass
git add .
git commit -m "feat: your change description"

# Semantic commit prefixes:
# - feat: new features
# - fix: bug fixes
# - chore: CI/CD, build, config changes (NEVER use feat/fix for CI)
# - tests: changes in unit or e2e tests (NEVER use feat/fix for tests)
# - refactor: code refactoring
# - docs: documentation

# Push to your branch
git push -u origin feature/your-feature-name

# Create a PR via GitHub UI or gh CLI
gh pr create
```

**All tests must pass before committing. Never commit failing code.**

Use `@AGENTS.md` in your prompts to include the full guidelines, which cover:

- Quick start commands
- Architecture overview
- Workflow and testing guidelines
- Storybook usage
- Security and Safe-specific patterns
- Common pitfalls and debugging tips

## 🚨 Feature Architecture Import Rules

**When working with code in `apps/web/src/features/`:**

Features use a lazy-loading architecture to optimize bundle size. ESLint warns about these import restrictions (warnings until all features are migrated):

### Allowed Imports

```typescript
import { SomeType, useLightweightHook } from '@/features/myfeature' // Feature barrel
import { someSlice, selectSomething } from '@/features/myfeature/store' // Redux store
import { lightweightUtil } from '@/features/myfeature/services' // Services barrel
```

### Forbidden Imports (ESLint will warn)

```typescript
// ❌ NEVER import components directly - defeats lazy loading
import { MyComponent } from '@/features/myfeature/components'
import MyComponent from '@/features/myfeature/components/MyComponent'

// ❌ NEVER import hooks from internal folder - use barrel
import { useMyHook } from '@/features/myfeature/hooks/useMyHook'

// ❌ NEVER import internal service files - use barrel or useLoadFeature
import { heavyService } from '@/features/myfeature/services/heavyService'
```

### Accessing Feature Components

Use the `useLoadFeature` hook to access lazy-loaded components:

```typescript
import { useLoadFeature } from '@/features/__core__'
import { MyFeature } from '@/features/myfeature'

function ParentComponent() {
  const feature = useLoadFeature(MyFeature)
  if (!feature) return null
  return <feature.components.MyComponent />
}
```

**📖 See `apps/web/docs/feature-architecture.md` for the complete guide including the two-tier handle pattern and bundle leak pitfalls.**

## Active Technologies

- TypeScript 5.x (Next.js 14.x) + Next.js (dynamic imports), ESLint (import restrictions), Redux Toolkit (state management) (001-feature-architecture)
- N/A (architecture pattern, no new data storage) (001-feature-architecture)

## Recent Changes

- 001-feature-architecture: Added TypeScript 5.x (Next.js 14.x) + Next.js (dynamic imports), ESLint (import restrictions), Redux Toolkit (state management)
