# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a Yarn v4 monorepo containing two main applications:

- **apps/web/**: Next.js web application for Safe{Wallet} web app
- **apps/mobile/**: Expo React Native mobile application for Safe{Wallet} mobile app
- **packages/**: Shared libraries and utilities
- **config/**: Configuration files for the monorepo
- **expo-plugins/**: Custom Expo config plugins

## Development Commands

### Root Level Commands
- `yarn` - Install dependencies for all workspaces
- `yarn lint` - Run linting across all workspaces
- `yarn test` - Run tests across all workspaces
- `yarn prettier` - Check formatting across all files
- `yarn prettier:fix` - Fix formatting across all files

### Web Application (apps/web)
- `yarn workspace @safe-global/web dev` - Start development server
- `yarn workspace @safe-global/web build` - Build for production
- `yarn workspace @safe-global/web lint` - Run TypeScript check and ESLint
- `yarn workspace @safe-global/web test` - Run Jest tests
- `yarn workspace @safe-global/web test:coverage` - Run tests with coverage
- `yarn workspace @safe-global/web cypress:open` - Open Cypress for E2E tests

### Mobile Application (apps/mobile)
- `yarn workspace @safe-global/mobile start` - Start Expo development server
- `yarn workspace @safe-global/mobile start:ios` - Run on iOS simulator
- `yarn workspace @safe-global/mobile start:android` - Run on Android emulator
- `yarn workspace @safe-global/mobile test` - Run Jest tests
- `yarn workspace @safe-global/mobile test:coverage` - Run tests with coverage
- `yarn workspace @safe-global/mobile lint` - Run TypeScript check and ESLint
- `yarn workspace @safe-global/mobile storybook:web` - Run Storybook for components

### Workspace Commands
Since Yarn treats commands with colons as global, you can also run:
- `yarn dev` (equivalent to `yarn workspace @safe-global/web dev`)
- `yarn cypress:open` (equivalent to `yarn workspace @safe-global/web cypress:open`)

## Architecture Overview

### Technology Stack
- **Web**: Next.js 15, React 19, TypeScript, Material-UI, Redux Toolkit, Ethers.js
- **Mobile**: Expo, React Native, TypeScript, Tamagui, Redux Toolkit, Ethers.js
- **State Management**: Redux with RTK Query for data fetching
- **Blockchain**: Ethers.js v6, Safe Protocol Kit, Safe API Kit
- **Testing**: Jest, React Testing Library, Cypress (web), Storybook

### Key Libraries
- **Safe Ecosystem**: `@safe-global/protocol-kit`, `@safe-global/api-kit`, `@safe-global/safe-gateway-typescript-sdk`
- **Wallet Integration**: `@web3-onboard/core`, `@reown/walletkit`
- **Form Handling**: `react-hook-form` with `@hookform/resolvers`
- **Schema Validation**: Zod
- **Date Handling**: `date-fns`

### Code Style Guidelines
- Use TypeScript for all code; prefer interfaces over types
- Use functional components with hooks
- Use `const` instead of `function` for pure functions
- Prefer named exports over default exports
- Use Zod for schema validation and type inference
- Follow the established patterns in `.cursor/rules/safe-monorepo.mdc`
- Use Redux for state management, RTK Query for API calls
- Minimize `useEffect` usage; prefer derived state and memoization
- Handle errors early with guard clauses and early returns

### Project-Specific Patterns
- Web app uses Material-UI for components and styling
- Mobile app uses Tamagui for UI components and styling
- Both apps share common utilities and types from `packages/`
- Use Mock Service Worker (MSW) for API mocking in tests
- Use Faker.js for generating test data
- Test Redux state changes rather than mocking calls
- Mobile app uses Expo Router for navigation
- Web app uses Next.js App Router

### Testing Strategy
- Unit tests with Jest and React Testing Library
- E2E tests with Cypress (web) and Maestro (mobile)
- Component stories with Storybook
- Test coverage reporting available via `test:coverage` commands
- Mock external APIs with MSW rather than mocking function calls