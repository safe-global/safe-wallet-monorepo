# AI Contributor Guidelines

This repository is the Safe{Wallet} monorepo, containing both web and mobile applications for Safe (formerly Gnosis Safe), a multi-signature smart contract wallet on Ethereum and other EVM chains. The repository uses a Yarn 4 workspace-based monorepo structure. Follow these rules when proposing changes via an AI agent.

## Quick Start

Common commands for getting started:

```bash
# Install dependencies (uses Yarn 4 via corepack)
yarn install

# Run web app in development mode
yarn workspace @safe-global/web dev

# Run mobile app in development mode
yarn workspace @safe-global/mobile start

# Run tests for web
yarn workspace @safe-global/web test

# Run Storybook for web
yarn workspace @safe-global/web storybook
```

## Architecture Overview

- **apps/web** - Next.js web application
- **apps/mobile** - Expo/React Native mobile application
- **packages/** - Shared libraries (store, utils, etc.) used by both platforms
- **config/** - Shared configuration files

The monorepo uses **Yarn 4 workspaces** to manage dependencies and enables sharing code between web and mobile applications.

## General Principles

- Follow the DRY principle
- Cover your changes with unit tests
- Run type-check, lint, prettier and unit tests before each commit
- Never use the `any` type!

Specifically for the web app:

- When making a new component, create a Storybook story file for it
- Use theme variables from vars.css instead of hard-coded CSS values
- Use MUI components and the Safe MUI theme

## Workflow

1. **Install dependencies**: `yarn install` (from the repository root).

   - Uses Yarn 4 (managed via `corepack`)
   - Automatically runs `yarn after-install` for the web workspace, which generates TypeScript types from contract ABIs

2. **Pre-commit hooks**: The repository uses Husky for git hooks:

   - **pre-commit**: Automatically runs `lint-staged` (prettier) and type-check on staged TypeScript files
   - **pre-push**: Runs linting before pushing
   - These hooks ensure code quality before commits reach the repository
   - **If hooks fail**: Fix the reported issues and try committing again. Common issues:
     - Type errors: Run `yarn workspace @safe-global/web type-check` to see all errors
     - Formatting: Run `yarn prettier:fix` to auto-fix
     - Linting: Run `yarn workspace @safe-global/web lint:fix` to auto-fix where possible

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

   - Examples: `feat: add transaction history`, `fix: resolve wallet connection bug`, `refactor: simplify address validation`

6. **Code style**: follow the guidelines in:

   - `apps/web/docs/code-style.md` for the web app.
   - `apps/mobile/docs/code-style.md` for the mobile app.

7. **Pull requests**: fill out the PR template and ensure all checks pass.

**Environment Variables** – Web apps use `NEXT_PUBLIC_*` prefix, mobile apps use `EXPO_PUBLIC_*` prefix for environment variables. In shared packages, check for both prefixes.

## Testing Guidelines

### Unit Tests

- When writing Redux tests, verify resulting state changes rather than checking that specific actions were dispatched.
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

- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly
- Create test data with helpers using [faker](https://fakerjs.dev/)
- Ensure shared package tests work for both web and mobile environments
- Test files should be colocated with source files using the `*.test.ts(x)` naming convention

### E2E Tests (Web only)

- Located in `apps/web/cypress/e2e/`
- Run with `yarn workspace @safe-global/web cypress:open` for interactive mode
- Run with `yarn workspace @safe-global/web cypress:run` for headless mode
- Smoke tests in `cypress/e2e/smoke/` are run in CI

### Test Coverage

- Aim for comprehensive test coverage of business logic and critical paths
- Run `yarn workspace @safe-global/web test:coverage` to generate coverage reports
- Coverage reports help identify untested code paths

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

## Storybook (Web only)

Storybook is used for developing and documenting UI components in isolation.

### Running Storybook

```bash
yarn workspace @safe-global/web storybook
# Runs on http://localhost:6006
```

### Creating Stories

When creating a new component, always create a corresponding `.stories.tsx` file:

```typescript
// Example: MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './MyComponent'

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // component props
  },
}
```

### Story Guidelines

- Place story files next to the component they document
- Use descriptive story names (Default, WithError, Loading, etc.)
- Include all important component states and variations
- Use the `autodocs` tag for automatic documentation generation
- Story files are located throughout `apps/web/src/` alongside components

## Security & Safe Wallet Patterns

Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet that requires multiple signatures to execute transactions.

### Key Concepts

- **Safe Account** – A smart contract wallet requiring M-of-N signatures to execute transactions
- **Owners** – Addresses that can sign transactions for a Safe
- **Threshold** – Minimum number of signatures required to execute a transaction
- **Transaction Building** – Follow Safe SDK patterns for building multi-signature transactions using `@safe-global/protocol-kit`

### Best Practices

- **Safe Address Validation** – Always validate Ethereum addresses using established utilities (ethers.js `isAddress`)
- **Chain-Specific Safes** – Safe addresses are unique per chain; always include chainId when referencing a Safe
- **Transaction Building** – Use the Safe SDK (`@safe-global/protocol-kit`, `@safe-global/api-kit`) for transaction creation
- **Wallet Provider Integration** – Follow established patterns for wallet connection and Web3 provider setup (Web3-Onboard)
- **Never hardcode private keys or sensitive data** – Use environment variables and secure key management

## Environment Configuration

- **Local Development** – Points to staging backend by default
- **Environment Branches** – PRs get deployed automatically for testing
- **RPC Configuration** – Infura integration for Web3 RPC calls (requires `INFURA_TOKEN`)
- **Chain Configuration** – Chain configs are managed through the Safe Config Service

## Common Pitfalls

Avoid these common mistakes when contributing:

1. **Using `any` type** – Always properly type your code, create interfaces/types as needed
2. **Forgetting to run tests** – Always run tests before committing (`yarn workspace @safe-global/web test`)
3. **Breaking mobile when changing shared code** – Shared packages (`packages/**`) affect both web and mobile
4. **Hardcoding values** – Use theme variables from `vars.css` (web) or Tamagui tokens (mobile)
5. **Modifying generated files** – Files in `packages/utils/src/types/contracts/` are auto-generated from ABIs
6. **Not handling chain-specific logic** – Always consider multi-chain scenarios
7. **Skipping Storybook stories** – New components should have stories for documentation
8. **Incomplete error handling** – Always handle loading, error, and empty states in UI components

## Debugging Tips

- **Type errors**: Run `yarn workspace @safe-global/web type-check` to see all TypeScript errors
- **Test failures**: Run tests in watch mode with `yarn workspace @safe-global/web test --watch`
- **RPC issues**: Check that `INFURA_TOKEN` or other RPC provider env vars are set correctly
- **Build errors**: Check `.next` cache – sometimes `rm -rf apps/web/.next` helps
- **Storybook issues**: Try `rm -rf node_modules/.cache/storybook`
