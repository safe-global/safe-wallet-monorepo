# Feature Migration Codemod

A two-phase tool for migrating features to the v3 architecture (lazy loading + feature handles).

## Overview

This tool helps automate the migration of features from the old architecture to the new v3 architecture documented in `apps/web/docs/feature-architecture.md`.

### What it does

**Phase 1 (Analyze):**

- Scans a feature directory
- Discovers all exports (components, hooks, services)
- Finds all consumer files
- Analyzes current structure
- Generates a migration config for review

**Phase 2 (Execute):**

- Creates boilerplate files (`contract.ts`, `feature.ts`, `index.ts`)
- Reorganizes file structure (moves files to appropriate folders)
- Updates import statements in consumer files
- Adds TODO comments for manual migration steps

### What requires manual cleanup

- Adjusting the public API in `contract.ts` (components and services only, NO hooks)
- Completing the migration in consumer files:
  - Adding `useLoadFeature()` calls for components/services
  - Importing hooks directly from feature index
  - Converting component usage to `feature.Component`
  - Converting service usage to `feature.service?.method()` with `$isReady` checks
  - Removing unnecessary null checks for components
- Keeping hooks lightweight (minimal imports, heavy logic in services)
- Fixing type errors
- Updating tests

## Installation

From the repository root:

```bash
cd tools/codemods/migrate-feature
yarn install
yarn build
```

## Usage

### List all features

See which features are migrated and which aren't:

```bash
yarn migrate list
```

### Phase 1: Analyze a feature

Interactive mode (recommended):

```bash
yarn migrate analyze --interactive
```

Analyze a specific feature:

```bash
yarn migrate analyze hypernative
```

This will:

1. Scan the feature
2. Show analysis results
3. Prompt to save config to `.codemod/{feature}.config.json`

### Phase 2: Execute migration

After reviewing the config, execute the migration:

```bash
yarn migrate execute hypernative
```

Or specify a custom config file:

```bash
yarn migrate execute --config .codemod/hypernative.config.json
```

Dry run (preview changes without modifying files):

```bash
yarn migrate execute hypernative --dry-run
```

## Example Workflow

```bash
# 1. List features to see what needs migration
yarn migrate list

# 2. Analyze a feature
yarn migrate analyze hypernative

# 3. Review the generated config
cat .codemod/hypernative.config.json

# 4. Edit the config if needed (adjust public API, feature flag, etc.)
vim .codemod/hypernative.config.json

# 5. Execute migration (dry run first)
yarn migrate execute hypernative --dry-run

# 6. Execute for real
yarn migrate execute hypernative

# 7. Manual cleanup
# - Review generated files
# - Complete consumer file migrations
# - Fix type errors
# - Update tests

# 8. Verify
cd ../../..
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test
```

## Config File Format

The analysis phase generates a config file like this:

```json
{
  "featureName": "hypernative",
  "featureFlag": "HYPERNATIVE",
  "publicAPI": {
    "components": ["HnMiniTxBanner", "HnQueueAssessmentBanner"],
    "hooks": ["useHnScanner", "useHnAssessment"],
    "services": ["hypernativeService"],
    "types": ["HnAssessment", "HnSeverity"],
    "constants": ["HN_API_URL"]
  },
  "structure": {
    "hasComponentsFolder": true,
    "hasHooksFolder": true,
    "hasServicesFolder": true,
    "hasStoreFolder": true,
    "hasUtilsFolder": false,
    "hasContextsFolder": false,
    "hasTypesFile": true,
    "hasConstantsFile": true,
    "hasReadme": true
  },
  "consumers": [
    {
      "filePath": "/path/to/consumer.tsx",
      "imports": [
        {
          "name": "HnMiniTxBanner",
          "type": "component",
          "importPath": "@/features/hypernative/components/HnMiniTxBanner",
          "isDefault": false,
          "isTypeOnly": false
        }
      ]
    }
  ]
}
```

You can edit this config before running the execute phase to:

- Adjust which exports are public
- Change the feature flag name
- Skip certain files
- Add custom notes

## Manual Steps After Migration

After running the migration tool, you'll need to:

### 1. Review Generated Files

Check `contract.ts`, `feature.ts`, and `index.ts` to ensure they match your needs.

### 2. Complete Consumer Migrations

The tool adds TODO comments in consumer files. You need to:

```typescript
// Before
import { MyComponent } from '@/features/myfeature/components/MyComponent'
import { useMyHook } from '@/features/myfeature/hooks/useMyHook'

function Consumer() {
  const data = useMyHook()
  return <MyComponent data={data} />
}

// After
import { MyFeature, useMyHook } from '@/features/myfeature'
import { useLoadFeature } from '@/features/__core__'

function Consumer() {
  const feature = useLoadFeature(MyFeature)

  // Hooks are imported directly (always loaded, not lazy)
  const data = useMyHook()

  // Components render via feature handle (lazy-loaded)
  // No null checks needed - proxy stubs handle it
  return <feature.MyComponent data={data} />
}
```

**Important:** Hooks are exported directly from `index.ts` (not lazy-loaded) to avoid Rules of Hooks violations. Services are accessed via the feature handle and should check `$isReady` before calling.

### 3. Fix Type Errors

Run type-check and fix any errors:

```bash
yarn workspace @safe-global/web type-check
```

### 4. Update Tests

Update test mocks to use the flat structure:

```typescript
jest.mock('@/features/myfeature', () => ({
  MyFeature: {
    name: 'myfeature',
    useIsEnabled: () => true,
    load: () => Promise.resolve({
      default: {
        // Flat structure - components and services only (NO hooks)
        MyComponent: () => <div>Mock</div>,
        myService: jest.fn(),
      },
    }),
  },
  // Hooks are exported directly (always loaded, not in lazy-loaded feature)
  useMyHook: jest.fn(() => ({ data: 'mock' })),
}))
```

### 5. Run Tests

```bash
yarn workspace @safe-global/web test
```

### 6. Lint

```bash
yarn workspace @safe-global/web lint
```

## Architecture Reference

For the complete architecture guide, see:

- `apps/web/docs/feature-architecture.md`

Key principles:

- **Flat structure** - no nested `components`/`services` in contract (hooks exported separately)
- **Hooks are NOT lazy-loaded** - exported directly from `index.ts` to avoid Rules of Hooks violations
- **Proxy-based stubs** - always returns an object for components/services, never null
- **Naming conventions** - `PascalCase` (component), `camelCase` (service)
- **One dynamic import** - `feature.ts` is lazy-loaded, use direct imports inside it (NO hooks in feature.ts)
- **typeof pattern** - use `typeof` in contracts for IDE navigation

## Troubleshooting

### "Feature not found"

Make sure you're running the command from the repository root and the feature exists in `apps/web/src/features/`.

### "Failed to transform imports"

The jscodeshift transform might fail on complex import patterns. You'll need to manually update those files.

### Type errors after migration

This is expected. The tool generates boilerplate but you need to:

1. Ensure all imports in `feature.ts` are correct
2. Update consumer files to use the feature handle
3. Fix any type mismatches

## Development

To modify the tool:

1. Edit TypeScript files in `src/`
2. Rebuild: `yarn build`
3. Test: `yarn migrate --help`

### File Structure

```
migrate-feature/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── types.ts           # Type definitions
│   ├── utils.ts           # Utility functions
│   ├── analyze.ts         # Phase 1: Analysis
│   ├── execute.ts         # Phase 2: Execution
│   ├── templates.ts       # Boilerplate generators
│   └── transforms/
│       ├── fileStructure.ts  # File reorganization
│       └── imports.ts        # Import updates
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

When enhancing the tool:

- Add new transforms to `transforms/`
- Update templates in `templates.ts`
- Add new CLI commands in `index.ts`
- Update this README with new features
