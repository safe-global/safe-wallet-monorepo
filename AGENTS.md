# AI Contributor Guidelines

This repository uses a Yarn-based monorepo structure. Follow these rules when proposing changes via an AI agent.

## General Principles

- **Solve the Right Problem** – confirm the purpose of your change with the issue or request before modifying code.
- **Design Before You Code** – think through data flow, APIs and security implications before implementing.
- **Keep It Simple** – prefer straightforward solutions over clever or unnecessary abstractions.
- **Fail Fast, Fail Loud** – surface errors early; avoid silent failures.
- **Write Clean, Readable Code** – meaningful names and concise comments help maintainers understand your work.
- **Test Thoroughly** – add or update unit and integration tests when changing functionality.
- **Minimize Technical Debt** – document trade‑offs and avoid quick hacks.
- **Prioritize Maintainability** – keep modules small and reusable.

## Workflow

1. **Install dependencies**: `yarn install` (from the repository root).
2. **Formatting**: run `yarn prettier:fix` before committing.
3. **Linting and tests**: when you change any source code under `apps/` or `packages/`, execute:
   ```bash
   yarn lint
   yarn test
   ```
   Skip these steps only if your changes are limited to comments or documentation.
4. **Commit messages**: use [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) as described in `CONTRIBUTING.md`.
5. **Code style**: follow the guidelines in:
   - `apps/web/docs/code-style.md` for the web app.
   - `apps/mobile/docs/code-style.md` for the mobile app.
6. **Pull requests**: fill out the PR template and ensure all checks pass.

Use Yarn 4 (managed via `corepack`) for all scripts. Refer to the workspace READMEs for environment details.

**Environment Variables** – Web apps use `NEXT_PUBLIC_*` prefix, mobile apps use `EXPO_PUBLIC_*` prefix for environment variables.

## Testing Guidelines

- When writing Redux tests, verify resulting state changes rather than checking
  that specific actions were dispatched.
- Use [Mock Service Worker](https://mswjs.io/) (MSW) for tests involving network
  requests instead of mocking `fetch`. Use MSW for mocking blockchain RPC calls instead of mocking ethers.js directly
- Create test data with helpers with faker @https://fakerjs.dev/
- Ensure shared package tests work for both web and mobile environments

## Web3/Blockchain Development Guidelines

- **Safe Ecosystem Focus** – This is a Safe wallet project. Understand Safe's multi-signature concepts and the Safe{Core} SDK when making changes.
- **Chain Support** – The app supports multiple EVM chains (Ethereum, Polygon, Arbitrum, etc.). Always consider multi-chain implications.
- **Ethers.js Usage** – Use ethers v6. Follow existing patterns for provider creation and RPC management.

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
