# Quick Start Guide

## Installation

The tool is already installed as a workspace. From the repository root:

```bash
# Build the tool (only needed once or after changes)
yarn workspace @safe-wallet/migrate-feature-codemod build
```

## Basic Usage

### 1. See what needs migration

```bash
node tools/codemods/migrate-feature/dist/index.js list
```

This shows all features and their migration status.

### 2. Analyze a feature

```bash
node tools/codemods/migrate-feature/dist/index.js analyze hypernative
```

This will:

- Scan the feature directory
- Discover all exports (components, hooks, services)
- Find all consumer files
- Prompt to save config to `.codemod/hypernative.config.json`

### 3. Review the generated config

```bash
cat .codemod/hypernative.config.json
```

Edit if needed to:

- Adjust which exports are public
- Change the feature flag name
- Add notes

### 4. Execute migration (dry run first)

```bash
node tools/codemods/migrate-feature/dist/index.js execute hypernative --dry-run
```

This previews what will change without modifying files.

### 5. Execute for real

```bash
node tools/codemods/migrate-feature/dist/index.js execute hypernative
```

This will:

- Create `contract.ts`, `feature.ts`, `index.ts`
- Reorganize files into proper folders
- Update import statements in consumers
- Add TODO comments for manual steps

### 6. Complete manual migration

The tool adds TODO comments in consumer files showing what needs to be done:

```typescript
// Before (old way)
import { MyComponent } from '@/features/myfeature/components/MyComponent'

// After (new way with useLoadFeature)
import { MyFeature } from '@/features/myfeature'
import { useLoadFeature } from '@/features/__core__'

const feature = useLoadFeature(MyFeature)
return <feature.MyComponent />
```

### 7. Verify

```bash
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test
```

## Common Scenarios

### Interactive mode (recommended for first use)

```bash
node tools/codemods/migrate-feature/dist/index.js analyze --interactive
```

### Migrate multiple features

```bash
# Analyze each feature
for feature in hypernative safe-shield swap; do
  node tools/codemods/migrate-feature/dist/index.js analyze $feature
done

# Review configs, then execute
for feature in hypernative safe-shield swap; do
  node tools/codemods/migrate-feature/dist/index.js execute $feature
done
```

### Custom config location

```bash
node tools/codemods/migrate-feature/dist/index.js analyze myfeature -o custom-config.json
node tools/codemods/migrate-feature/dist/index.js execute --config custom-config.json
```

## Troubleshooting

### "Feature not found"

Make sure you're in the repository root and the feature exists in `apps/web/src/features/`.

### "Failed to transform imports"

Some complex import patterns may not be handled automatically. Check the console output for details and update those files manually.

### Type errors after migration

This is expected. You need to:

1. Complete the consumer file migrations (replace direct imports with feature handle)
2. Ensure all imports in `feature.ts` are correct
3. Run `yarn workspace @safe-global/web type-check` to see all errors

## What the Tool Does

**Automatically:**

- ✅ Creates boilerplate files (`contract.ts`, `feature.ts`, `index.ts`)
- ✅ Organizes files into `components/`, `hooks/`, `services/` folders
- ✅ Updates import statements to remove internal paths
- ✅ Adds feature handle import
- ✅ Adds TODO comments for manual steps

**Manually required:**

- ⚠️ Update consumer components to use `useLoadFeature()`
- ⚠️ Replace direct component/hook usage with feature handle
- ⚠️ Fix type errors
- ⚠️ Update tests to mock the feature handle
- ⚠️ Verify everything works

## Next Steps

For complete documentation, see:

- `README.md` - Full tool documentation
- `apps/web/docs/feature-architecture.md` - Architecture guide

## Tips

1. **Start small**: Migrate simple features first to get familiar with the process
2. **One at a time**: Don't migrate multiple features simultaneously
3. **Dry run first**: Always use `--dry-run` to preview changes
4. **Review diffs**: Use git to review all changes before committing
5. **Test thoroughly**: Run tests after each migration
