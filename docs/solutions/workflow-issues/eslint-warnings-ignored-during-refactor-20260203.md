---
module: System
date: 2026-02-03
problem_type: workflow_issue
component: development_workflow
symptoms:
  - "ESLint warnings for feature being refactored were dismissed as 'pre-existing'"
  - 'Refactor completed but ESLint warnings for the modified feature remained'
  - 'Internal imports not converted to relative paths despite lint warnings'
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: medium
tags: [eslint, refactoring, feature-architecture, code-review, quality-assurance]
---

# Troubleshooting: ESLint Warnings Ignored During Feature Refactor

## Problem

During the swap feature v3 architecture migration, ESLint warnings specific to the feature being refactored were incorrectly dismissed as "pre-existing warnings from other features." This resulted in an incomplete refactor that required a second pass to fix.

## Environment

- Module: System-wide workflow issue
- Affected Component: Feature migration workflow
- Date: 2026-02-03

## Symptoms

- Ran ESLint after completing the refactor
- Saw warnings like:
  ```
  @/features/swap/components/OrderId import is restricted...
  @/features/swap/components/StatusLabel import is restricted...
  @/features/swap/hooks/useIsExpiredSwap import is restricted...
  ```
- Dismissed these as "pre-existing warnings from other features"
- User had to point out that these warnings were for the feature being refactored

## What Didn't Work

**Attempted Solution 1:** Running ESLint and visually scanning output

- **Why it failed:** Warnings were present but incorrectly attributed to other features, not the one being refactored

**Root issue:** No systematic verification that ESLint warnings for the specific feature being modified were addressed.

## Solution

### 1. Always filter ESLint output for the feature being modified

After completing a refactor, run ESLint with grep to filter for the specific feature:

```bash
# For swap feature migration
yarn workspace @safe-global/web lint 2>&1 | grep -i swap

# Generic pattern
yarn workspace @safe-global/web lint 2>&1 | grep -i [feature-name]
```

### 2. Run ESLint specifically on the feature directory

```bash
# Check the feature directory itself for any issues
yarn workspace @safe-global/web lint src/features/swap/

# Check for any consumers importing incorrectly
yarn workspace @safe-global/web lint 2>&1 | grep "@/features/swap"
```

### 3. Verify zero warnings for the feature

Before considering a refactor complete, ensure:

```bash
# This should return NO results if refactor is complete
yarn workspace @safe-global/web lint 2>&1 | grep "@/features/[feature-name]" | grep -v "node_modules"
```

### 4. Create a verification checklist

For feature architecture migrations:

- [ ] All internal imports use relative paths (not `@/features/[name]/...`)
- [ ] All external consumers import from barrel (`@/features/[name]`)
- [ ] Run `lint | grep [feature-name]` returns zero warnings
- [ ] Run `lint | grep "@/features/[name]/"` returns zero warnings (note the trailing slash)

## Why This Works

1. **Root Cause**: The mistake was assuming ESLint warnings in the output were from other features, not the one being modified. This assumption was wrong.

2. **Verification Gap**: There was no explicit step to verify that ESLint warnings for the specific feature being refactored were resolved.

3. **Cognitive Bias**: When seeing many warnings, it's easy to assume they're pre-existing rather than verifying each one.

## Prevention

1. **ALWAYS filter lint output for the feature being modified** - Never assume warnings are from other features
2. **Run feature-specific lint checks** - Use grep or path-specific linting
3. **Zero tolerance for feature warnings** - A refactor is not complete until the feature has zero related ESLint warnings
4. **Include lint verification in migration checklist** - Add explicit lint check step to feature migration documentation
5. **When in doubt, investigate** - If a warning mentions the feature being refactored, it's almost certainly related to the refactor

## Checklist for Future Feature Migrations

Add this to the end of any feature architecture migration:

```bash
# Final verification - must return empty
FEATURE_NAME="swap"  # Change for each migration
yarn workspace @safe-global/web lint 2>&1 | grep -i "$FEATURE_NAME" && echo "WARNINGS FOUND - FIX BEFORE COMPLETING" || echo "No warnings - migration complete"
```

## Related Issues

- See also: [feature-v3-migration-swap-20260203.md](../best-practices/feature-v3-migration-swap-20260203.md) - The successful migration after fixing the overlooked warnings
