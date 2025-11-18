# AI Contributor Guidelines

This repository uses a Yarn-based monorepo structure. Follow these rules when proposing changes via an AI agent.

## General Principles

- Follow the DRY principle
- Cover your changes with unit tests
- Run type-check, lint, prettier and unit tests before each commit

Specifically for the web app:

- When making a new component, create a Storybook story file for it
- Use theme variables from vars.css instead of hard-coded CSS values
- Use MUI components and the Safe MUI theme

## Workflow

1. **Install dependencies**: `yarn install` (from the repository root).
2. **Pre-commit hooks**: The repository uses Husky for git hooks:
   - **pre-commit**: Automatically runs `lint-staged` (prettier) and type-check on staged TypeScript files
   - **pre-push**: Runs linting before pushing
   - These hooks ensure code quality before commits reach the repository
3. **Formatting**: run `yarn prettier:fix` before committing (also handled automatically by pre-commit hook).
4. **Linting and tests**: when you change any source code under `apps/` or `packages/`, execute, for web:
   ```bash
   yarn workspace @safe-global/web type-check
   yarn workspace @safe-global/web lint
   yarn workspace @safe-global/web prettier
   yarn workspace @safe-global/web test
   ```
   For mobile:
   ```bash
   yarn workspace @safe-global/mobile lint
   yarn workspace @safe-global/mobile prettier
   yarn workspace @safe-global/mobile test
   ```
5. **Commit messages**: use [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) as described in `CONTRIBUTING.md`.
6. **Code style**: follow the guidelines in:
   - `apps/web/docs/code-style.md` for the web app.
   - `apps/mobile/docs/code-style.md` for the mobile app.
7. **Pull requests**: fill out the PR template and ensure all checks pass.

Use Yarn 4 (managed via `corepack`) for all scripts. Refer to the workspace READMEs for environment details.

**Environment Variables** – Web apps use `NEXT_PUBLIC_*` prefix, mobile apps use `EXPO_PUBLIC_*` prefix for environment variables.

## Testing Guidelines

- When writing Redux tests, verify resulting state changes rather than checking
  that specific actions were dispatched.
- **Avoid `any` type assertions** – Create properly typed test helpers instead of using `as any`. For example, when testing Redux slices with a minimal store, create a helper function that properly types the state:

  ```typescript
  // Good: Properly typed helper
  type TestRootState = ReturnType<ReturnType<typeof createTestStore>['getState']>
  const getSafeState = (state: TestRootState, chainId: string, safeAddress: string) => {
    return state[sliceName][`${chainId}:${safeAddress}`]
  }

  // Bad: Using 'any'
  const state = store.getState() as any
  ```

- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network
  requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly
- Create test data with helpers with faker @https://fakerjs.dev/
- Ensure shared package tests work for both web and mobile environments

## Mobile Development (Expo + Tamagui)

- **UI Components** – Use Tamagui components for styling and theming. Import from `tamagui` not React Native directly when possible.
- **Theme System** – Follow the custom theme configuration in `src/theme/tamagui.config.ts`. Use theme tokens like `$background`, `$primary`, etc.
- **Component Structure** – Follow container/presentation pattern. See `apps/mobile/docs/code-style.md` for detailed component organization.
- **Font Management** – Use the configured DM Sans font family. Custom icons go through `SafeFontIcon` component.
- **Expo Plugins** – Custom Expo config plugins are in the `expo-plugins/` directory.

## Shared Packages

- **Cross-Platform Code** – Shared logic goes in `packages/` directory. Consider both web and mobile when making changes.
- **Environment Handling** – Use dual environment variable patterns (`NEXT_PUBLIC_*` || `EXPO_PUBLIC_*`) in shared packages.
- **Store Management** – Redux store is shared between web and mobile. State changes should work for both platforms.

## Security & Safe Wallet Patterns

- **Safe Address Validation** – Always validate Ethereum addresses using established utilities.
- **Transaction Building** – Follow Safe SDK patterns for building multi-signature transactions.
- **Wallet Provider Integration** – Follow established patterns for wallet connection and Web3 provider setup.

## Environment Configuration

- **Local Development** – Points to staging backend by default
- **Environment Branches** – PRs get deployed automatically for testing
- **RPC Configuration** – Infura integration for Web3 RPC calls (requires `INFURA_TOKEN`)
