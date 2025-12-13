# Storybook Snapshot Testing

This project uses Jest snapshot testing with Storybook's Portable Stories API to automatically generate JSON snapshots for all Storybook stories.

## Overview

The snapshot testing setup automatically discovers all `.stories.tsx` files in the codebase and generates JSON snapshots of their rendered output. This ensures that component changes are tracked and can be reviewed in pull requests.

## How It Works

1. **Story Discovery**: The test file (`src/__tests__/storybook.test.tsx`) automatically finds all `*.stories.tsx` files
2. **Story Composition**: Using `@storybook/react`'s `composeStories`, each story is composed with its args, decorators, and parameters
3. **Snapshot Generation**: Each story is rendered and a JSON snapshot is captured of the resulting DOM structure
4. **CI Integration**: Snapshots are automatically tested in CI via GitHub Actions

## Running Tests Locally

```bash
# Run all snapshot tests
yarn test:storybook

# Run in CI mode (no watch, silent)
yarn test:storybook:ci

# Update snapshots when changes are intentional
yarn test:storybook -u
```

## Snapshot Files

Snapshots are stored in:
```
src/__tests__/__snapshots__/storybook.test.tsx.snap
```

## CI Pipeline

The GitHub Actions workflow runs on:
- Pull requests that modify `apps/web/**`
- Pushes to `main` branch

Workflow file: `.github/workflows/web-storybook-tests.yml`

## When Snapshots Fail

Snapshot tests will fail when:
1. Component rendering output changes
2. New stories are added
3. Story configurations change

### If the changes are intentional:
```bash
yarn test:storybook -u
```
Then commit the updated snapshot file.

### If the changes are unintentional:
Review the diff and fix the component code to match the expected output.

## Benefits

- **Regression Detection**: Catch unintended UI changes
- **Review Aid**: Snapshot diffs show exactly what changed in components
- **Documentation**: Snapshots serve as a record of component output
- **Fast Execution**: Jest snapshots are much faster than visual regression tests
- **Version Control**: Snapshot files are tracked in git for full history

## Technical Details

- **Framework**: Jest with React Testing Library
- **Storybook Integration**: Portable Stories API (`@storybook/react`)
- **Test Environment**: jest-fixed-jsdom (required for MSW compatibility)
- **Story Discovery**: Glob pattern matching for `*.stories.tsx`

## Related Commands

```bash
# View all Storybook stories in development mode
yarn storybook

# Build static Storybook
yarn build-storybook

# Run regular Jest unit tests
yarn test

# Run all tests with coverage
yarn test:coverage
```
