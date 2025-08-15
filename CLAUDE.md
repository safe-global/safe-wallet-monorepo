# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a **Safe{Wallet} monorepo** built with Yarn v4 workspaces, containing both web (Next.js) and mobile (Expo/React Native) applications with shared packages.

### Structure

- **apps/web**: Next.js web application using MUI for UI components
- **apps/mobile**: Expo React Native app using Tamagui for UI components
- **packages/**: Shared libraries and utilities (store, utils)
- **config/**: Shared configuration files (TypeScript, testing presets)
- **expo-plugins/**: Custom Expo config plugins

### Key Technologies

- **Frontend**: React 19, TypeScript, Redux Toolkit (RTK)
- **Web**: Next.js, MUI, ethers.js 6.14.3
- **Mobile**: Expo, React Native, Tamagui, ethers.js 6.14.3
- **Blockchain**: Safe ecosystem (Protocol Kit, API Kit), Web3/Ethereum integrations
- **State**: Redux with RTK Query for data fetching and caching
- **Testing**: Jest, React Testing Library, Cypress (web), Maestro (mobile e2e)
- **Package Manager**: Yarn v4 with workspaces

## Development Commands

### Monorepo-wide Commands

```bash
# Install dependencies
yarn install

# Run linting across all workspaces
yarn lint

# Run tests across all workspaces
yarn test

# Format code with Prettier
yarn prettier:fix
```

### Web App (apps/web)

```bash
# Development server
yarn workspace @safe-global/web dev

# Build for production
yarn workspace @safe-global/web build

# Run linting with TypeScript check
yarn workspace @safe-global/web lint

# Run tests with coverage
yarn workspace @safe-global/web test:coverage

# Run Cypress e2e tests
yarn workspace @safe-global/web cypress:open
yarn workspace @safe-global/web cypress:run

# Generate TypeScript types from contracts
yarn workspace @safe-global/web generate-types

# Serve static build
yarn workspace @safe-global/web static-serve
```

### Mobile App (apps/mobile)

```bash
# Start development server
yarn workspace @safe-global/mobile start

# Run on iOS simulator
yarn workspace @safe-global/mobile start:ios

# Run on Android emulator
yarn workspace @safe-global/mobile start:android

# Run tests
yarn workspace @safe-global/mobile test
yarn workspace @safe-global/mobile test:coverage

# Linting (includes TypeScript check)
yarn workspace @safe-global/mobile lint

# Storybook development
yarn workspace @safe-global/mobile storybook:web
yarn workspace @safe-global/mobile storybook:ios

# E2E testing with Maestro
yarn workspace @safe-global/mobile e2e:run
```

### Global Commands (work from any workspace)

Due to Yarn's colon command handling, you can run certain commands globally:

- `yarn cypress:open` (equivalent to `yarn workspace @safe-global/web cypress:open`)
- `yarn test:coverage`
- `yarn lint`

## Code Style & Conventions

### TypeScript

- Use interfaces over types for object shapes
- Avoid `any` type - follow strict TypeScript rules
- Use Zod for schema validation and type inference
- Prefer `const` over `function` for pure functions
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)

### React/Components

- Use functional components with TypeScript interfaces for props
- Prefer named exports for components and functions
- Use declarative JSX with clear, readable structure
- Follow established patterns in each app's components directory

### State Management

- Use Redux Toolkit (RTK) for state management
- Use RTK Query for data fetching, caching, and synchronization
- Minimize `useEffect` usage - prefer derived state and memoization
- Test actual state changes over mock function calls

### Testing

- Use Jest and React Testing Library for unit/integration tests
- Use Faker.js for generating test data
- Prefer Mock Service Worker (MSW) over mocking function calls for network tests
- Write tests for critical components with proper coverage

### Web3 Integration

- ethers.js v6.14.3 is used across both apps (locked via resolutions)
- Safe Protocol Kit and API Kit for Safe-specific functionality
- Follow existing patterns for wallet connections and transaction handling

## Development Notes

### Environment Setup

- Node.js 18+ required
- Yarn v4.6.0 managed via Corepack (`corepack enable`)
- Both apps support environment-specific configurations

### Package Management

- Dependencies are hoisted at the monorepo level where possible
- Use `workspace:^` notation for internal package dependencies
- Yarn patches are used for specific package modifications

### Pre-commit Hooks

- Husky runs linting and formatting checks
- Ensure all lint and test checks pass before committing

### Storybook

- Both apps include Storybook for component development
- Web: `yarn workspace @safe-global/web storybook`
- Mobile: `yarn workspace @safe-global/mobile storybook:web`

## Common Workflows

### Adding New Dependencies

```bash
# Add to specific workspace
yarn workspace <workspace-name> add <package>

# Add dev dependency
yarn workspace <workspace-name> add -D <package>
```

### Creating Cross-platform Features

- Shared business logic goes in `packages/`
- Platform-specific UI implementations in respective `apps/`
- Use workspace references for internal dependencies

### Running Single Tests

```bash
# Web
yarn workspace @safe-global/web test -- --testNamePattern="MyTest"

# Mobile
yarn workspace @safe-global/mobile test -- --testNamePattern="MyTest"
```

# Developer notes to remember

- As you implement something make sure to check tests and add new tests for business logic
- don't run prettier or commit things that are not part of the current implementation.
- check the current code and implementation before doing changes to avoid duplication.
