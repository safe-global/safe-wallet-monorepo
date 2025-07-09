# Safe Wallet Monorepo - Claude Reference Guide

This document provides a comprehensive reference guide for AI assistants working with the Safe Wallet monorepo. It supplements the existing `AGENTS.md` file with detailed technical information about the codebase architecture, patterns, and development practices.

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Monorepo Architecture](#monorepo-architecture)
3. [Web Application Architecture](#web-application-architecture)
4. [Mobile Application Architecture](#mobile-application-architecture)
5. [Shared Packages](#shared-packages)
6. [Testing Strategy](#testing-strategy)
7. [Development Workflow](#development-workflow)
8. [Common Tasks & Patterns](#common-tasks--patterns)
9. [Troubleshooting](#troubleshooting)

## Repository Overview

The Safe Wallet is a **Yarn 4 monorepo** containing:
- **Web Application** (Next.js 15 + TypeScript)
- **Mobile Application** (Expo 53 + React Native + Tamagui)
- **Shared Packages** (`@safe-global/store`, `@safe-global/utils`)
- **Configuration Packages** (TypeScript, Jest, ESLint configs)
- **Expo Plugins** (Custom native integrations)

### Key Technologies

- **Package Manager**: Yarn 4 (Berry) with PnP (Plug'n'Play)
- **Build System**: Next.js for web, Expo for mobile
- **Languages**: TypeScript 5.8.3, JavaScript ES2022
- **UI Libraries**: MUI (web), Tamagui (mobile)
- **State Management**: Redux Toolkit with RTK Query
- **Testing**: Jest, React Testing Library, Cypress (web), Maestro (mobile)
- **Blockchain**: Ethers.js v6, Safe Protocol Kit
- **Analytics**: Mixpanel, Google Analytics, Firebase Analytics

## Monorepo Architecture

### Directory Structure

```
safe-wallet-monorepo/
├── apps/
│   ├── web/                    # Next.js web application
│   └── mobile/                 # Expo React Native mobile app
├── packages/
│   ├── store/                  # Shared Redux store & API client
│   └── utils/                  # Shared utilities & blockchain logic
├── config/
│   ├── tsconfig/              # TypeScript configurations
│   └── test/                  # Jest presets & testing configs
├── expo-plugins/              # Custom Expo plugins
├── codemods/                  # Code transformation scripts
├── .yarn/                     # Yarn 4 configuration
├── package.json               # Root package.json with workspaces
├── yarn.lock                  # Dependency lock file
├── AGENTS.md                  # AI contributor guidelines
└── CLAUDE.md                  # This file
```

### Workspace Configuration

```json
{
  "workspaces": [
    "expo-plugins/*",
    "apps/*",
    "config/*",
    "packages/*"
  ]
}
```

### Key Scripts

- `yarn install` - Install all dependencies
- `yarn lint` - Run linting across all workspaces
- `yarn test` - Run tests across all workspaces
- `yarn prettier:fix` - Format code across all workspaces

## Web Application Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router (Static Export)
- **UI Library**: MUI v6 with custom theming
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: CSS Modules + MUI styled components
- **Testing**: Jest + React Testing Library + Cypress
- **Build**: Webpack with custom optimizations

### Key Architectural Patterns

#### 1. Feature-Based Architecture
```
src/
├── components/           # Reusable UI components
├── features/            # Feature-specific modules
│   ├── recovery/        # Account recovery feature
│   ├── staking/         # Staking feature
│   └── swap/           # Token swap feature
├── hooks/              # Custom React hooks
├── services/           # Business logic services
├── store/              # Redux slices
└── utils/              # Utility functions
```

#### 2. Component Organization
```
components/
├── common/             # Shared UI components
├── new-safe/          # Safe creation components
├── transactions/      # Transaction components
├── settings/          # Settings components
└── theme/            # Theme components
```

#### 3. Hook-Based Architecture
- **70+ custom hooks** for specific functionality
- **Loadable hooks** for data fetching with caching
- **Wallet hooks** for blockchain interactions
- **Safe-specific hooks** for Safe Protocol operations

### State Management

#### Redux Store Structure
```typescript
// Main store slices
├── safeInfoSlice       # Safe-specific information
├── balancesSlice       # Asset balances
├── txHistorySlice      # Transaction history
├── txQueueSlice        # Pending transactions
├── addressBookSlice    # Contact management
├── settingsSlice       # User preferences
├── authSlice          # Authentication state
└── batchSlice         # Transaction batching
```

#### RTK Query API Slices
- Auto-generated from OpenAPI specifications
- Separate endpoints for each domain (balances, transactions, etc.)
- Caching and invalidation strategies

### Key Services

#### Analytics Services
- **Mixpanel**: User behavior tracking
- **Google Analytics**: Web analytics
- **Spindl**: Attribution tracking

#### Blockchain Services
- **Web3 Provider**: Custom ethers.js providers
- **Safe Protocol Kit**: Safe-specific operations
- **Contract Services**: Smart contract interactions

#### External Integrations
- **Safe Apps**: Third-party app integration
- **WalletConnect**: Wallet connection protocol
- **Firebase**: Push notifications

### Development Commands

```bash
# Development
yarn dev                 # Start development server
yarn build              # Build for production
yarn start              # Start production server

# Testing
yarn test               # Run Jest tests
yarn test:coverage      # Run tests with coverage
yarn cypress:open       # Open Cypress test runner
yarn cypress:run        # Run Cypress tests headlessly

# Code Quality
yarn lint               # Run TypeScript + ESLint
yarn prettier:fix       # Format code
```

## Mobile Application Architecture

### Technology Stack

- **Framework**: Expo 53 with React Native 0.79.2
- **UI Library**: Tamagui with custom theme
- **Navigation**: Expo Router v5 (file-based routing)
- **State Management**: Redux Toolkit with Redux Persist
- **Storage**: MMKV for high-performance storage
- **Testing**: Jest + React Native Testing Library + Maestro

### Key Features

#### 1. Tamagui Theming System
```typescript
// Theme configuration
theme/
├── tamagui.config.ts   # Main theme configuration
├── tokens.ts          # Design tokens
└── navigation.ts      # Navigation theming
```

#### 2. File-Based Routing (Expo Router)
```
app/
├── _layout.tsx         # Root layout with providers
├── (tabs)/            # Tab navigation group
├── (import-accounts)/ # Account import flow
├── onboarding.tsx     # Onboarding screen
├── biometrics-opt-in.tsx # Biometrics setup
└── notifications-opt-in.tsx # Notifications setup
```

#### 3. Component Architecture
```
components/
├── Alert/             # Alert components
├── SafeButton/        # Custom button components
├── SafeInput/         # Input components
├── Identicon/         # Address identicons
└── LoadingScreen/     # Loading states
```

### State Management

#### Redux Store (Mobile)
```typescript
store/
├── activeSafeSlice     # Currently active Safe
├── safesSlice          # All Safes data
├── signersSlice        # Signer management
├── settingsSlice       # App settings
├── notificationsSlice  # Notification state
└── txHistorySlice      # Transaction history
```

#### Persistence Strategy
- **MMKV**: High-performance key-value storage
- **Redux Persist**: Automatic state persistence
- **Encryption**: Sensitive data encryption

### Mobile-Specific Services

#### Security Services
- **Biometrics**: Face ID/Touch ID integration
- **Keychain**: Secure credential storage
- **Device Info**: Device-specific information

#### Platform Services
- **Camera**: QR code scanning
- **Share**: Native sharing functionality
- **Notifications**: Push notification handling

### Development Commands

```bash
# Development
yarn start              # Start Expo development server
yarn start:ios          # Start iOS simulator
yarn start:android      # Start Android emulator

# Testing
yarn test               # Run Jest tests
yarn test:coverage      # Run tests with coverage
yarn e2e:run           # Run Maestro E2E tests

# Build
yarn build              # Build for production
yarn eas:build          # Build with EAS
```

## Shared Packages

### @safe-global/store

**Purpose**: Shared Redux store and API client generation

#### Key Features
- **Auto-generated API Client**: RTK Query client from OpenAPI specs
- **Gateway Integration**: Safe Client Gateway (CGW) API
- **Environment Configuration**: Multi-environment support

#### Build Process
```bash
yarn fetch-schema      # Fetch OpenAPI schema
yarn generate-api      # Generate TypeScript API client
```

#### Key Exports
```typescript
import { setBaseUrl, cgwClient } from '@safe-global/store'

// Configure API base URL
setBaseUrl('https://safe-client.gnosis.io')

// Use generated API hooks
const { data: safes } = cgwClient.useGetSafesQuery()
```

### @safe-global/utils

**Purpose**: Cross-platform utilities and blockchain logic

#### Key Utilities

##### Address Management
```typescript
import { 
  checksumAddress, 
  sameAddress, 
  isValidAddress 
} from '@safe-global/utils'
```

##### Formatters & Validation
```typescript
import { 
  safeFormatUnits, 
  validateAmount, 
  isValidURL 
} from '@safe-global/utils'
```

##### Security Modules
```typescript
import { 
  ApprovalModule, 
  BlockaidModule, 
  DelegateCallModule 
} from '@safe-global/utils'
```

##### Contract Interactions
```typescript
import { 
  multicall, 
  getMultiCallAddress 
} from '@safe-global/utils'
```

### Cross-Platform Patterns

#### Environment Variables
```typescript
// Dual environment variable support
const INFURA_TOKEN = 
  process.env.NEXT_PUBLIC_INFURA_TOKEN ||      // Web
  process.env.EXPO_PUBLIC_INFURA_TOKEN ||      // Mobile
  ''
```

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "paths": {
      "@safe-global/store/*": ["./packages/store/src/*"],
      "@safe-global/utils/*": ["./packages/utils/src/*"]
    }
  }
}
```

## Testing Strategy

### Web Application Testing

#### Jest Configuration
- **Environment**: `jest-fixed-jsdom` for MSW compatibility
- **Module Mapping**: Monorepo package resolution
- **Coverage**: Path ignoring for generated code

#### Cypress E2E Testing
- **Test Organization**: Smoke, regression, and happy path tests
- **Visual Regression**: Screenshot comparison testing
- **Cross-Browser**: Chrome, Firefox, Edge support

### Mobile Application Testing

#### Jest Configuration
- **Preset**: `jest-expo` for React Native
- **Transform Patterns**: Handle React Native modules
- **Coverage**: Comprehensive coverage reporting

#### Maestro E2E Testing
- **Platform Support**: iOS and Android
- **Test Flows**: User onboarding, transaction flows
- **CI Integration**: Automated testing pipeline

### Shared Package Testing

#### Test Utilities
```typescript
// Test builders
import { Builder } from '@safe-global/utils/tests'

const mockSafe = new Builder()
  .with({ address: '0x123...' })
  .with({ owners: ['0x456...'] })
  .build()
```

#### Mock Service Worker (MSW)
- **API Mocking**: Consistent API responses
- **Request Handlers**: Domain-specific handlers
- **Test Isolation**: Isolated test environments

## Development Workflow

### Environment Setup

#### Prerequisites
```bash
# Install Node.js 18+
node --version

# Enable Corepack for Yarn 4
corepack enable

# Install dependencies
yarn install
```

#### Environment Variables
```bash
# Web (apps/web/.env.local)
NEXT_PUBLIC_INFURA_TOKEN=your_infura_token
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Mobile (apps/mobile/.env.local)
EXPO_PUBLIC_INFURA_TOKEN=your_infura_token
EXPO_PUBLIC_WC_PROJECT_ID=your_walletconnect_id
```

### Code Quality Workflow

#### Pre-commit Hooks
```bash
# Husky + lint-staged configuration
yarn prettier:fix       # Format code
yarn lint               # Run linting
yarn test               # Run tests
```

#### Commit Message Format
```
feat(web): add dark mode toggle
fix(mobile): resolve camera permission issue
docs(shared): update API documentation
test(utils): add address validation tests
```

### Pull Request Process

1. **Branch Creation**: `feature/feature-name` or `fix/bug-description`
2. **Code Changes**: Follow existing patterns and conventions
3. **Testing**: Add/update tests for new functionality
4. **Linting**: Run `yarn lint` and fix any issues
5. **PR Creation**: Use provided PR template
6. **Review**: Address feedback and ensure CI passes

## Common Tasks & Patterns

### Adding a New Component

#### Web Component
```typescript
// src/components/common/NewComponent/index.tsx
import { Box, Typography } from '@mui/material'
import type { ReactElement } from 'react'

interface NewComponentProps {
  title: string
  children: ReactElement
}

export const NewComponent = ({ title, children }: NewComponentProps): ReactElement => {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      {children}
    </Box>
  )
}
```

#### Mobile Component
```typescript
// apps/mobile/src/components/NewComponent/index.tsx
import { YStack, Text } from 'tamagui'
import type { ReactNode } from 'react'

interface NewComponentProps {
  title: string
  children: ReactNode
}

export const NewComponent = ({ title, children }: NewComponentProps) => {
  return (
    <YStack space="$2">
      <Text fontSize="$6" fontWeight="600">
        {title}
      </Text>
      {children}
    </YStack>
  )
}
```

### Adding a New Hook

```typescript
// src/hooks/useNewFeature.ts
import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store'

export const useNewFeature = () => {
  const [state, setState] = useState<string>('')
  const safeAddress = useAppSelector(state => state.safeInfo.address)

  useEffect(() => {
    // Hook logic here
  }, [safeAddress])

  return {
    state,
    setState,
  }
}
```

### Adding a New Redux Slice

```typescript
// src/store/newFeatureSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface NewFeatureState {
  data: string[]
  loading: boolean
  error: string | null
}

const initialState: NewFeatureState = {
  data: [],
  loading: false,
  error: null,
}

export const newFeatureSlice = createSlice({
  name: 'newFeature',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<string[]>) => {
      state.data = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setData, setLoading } = newFeatureSlice.actions
export default newFeatureSlice.reducer
```

### Adding API Integration

```typescript
// packages/store/src/gateway/newFeature.ts
import { cgwClient } from './cgwClient'

export const newFeatureApi = cgwClient.injectEndpoints({
  endpoints: (build) => ({
    getNewFeatureData: build.query<NewFeatureResponse, { address: string }>({
      query: ({ address }) => ({
        url: `/safes/${address}/new-feature`,
        method: 'GET',
      }),
      providesTags: ['NewFeature'],
    }),
  }),
})

export const { useGetNewFeatureDataQuery } = newFeatureApi
```

### Adding Tests

#### Component Test
```typescript
// src/components/NewComponent/NewComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { NewComponent } from './index'

describe('NewComponent', () => {
  it('renders title and children', () => {
    render(
      <NewComponent title="Test Title">
        <div>Test Content</div>
      </NewComponent>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
```

#### Hook Test
```typescript
// src/hooks/useNewFeature.test.ts
import { renderHook } from '@testing-library/react'
import { useNewFeature } from './useNewFeature'

describe('useNewFeature', () => {
  it('returns expected state', () => {
    const { result } = renderHook(() => useNewFeature())

    expect(result.current.state).toBe('')
    expect(typeof result.current.setState).toBe('function')
  })
})
```

### Environment Configuration

#### Adding New Environment Variable
1. **Web**: Add to `apps/web/.env.example` with `NEXT_PUBLIC_` prefix, create `apps/web/.env.local` for local development
2. **Mobile**: Add to `apps/mobile/.env.example` with `EXPO_PUBLIC_` prefix, create `apps/mobile/.env.local` for local development
3. **Shared**: Use dual environment pattern in `packages/utils/src/config/constants.ts`

#### Chain Configuration
```typescript
// packages/utils/src/config/chains.ts
export const CHAIN_CONFIG = {
  [ChainId.ETHEREUM]: {
    name: 'Ethereum',
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_TOKEN}`,
    explorer: 'https://etherscan.io',
  },
  // Add new chains here
}
```

## Troubleshooting

### Common Issues

#### Yarn Installation Issues
```bash
# Clear yarn cache
yarn cache clean

# Reinstall dependencies
rm -rf node_modules .yarn/cache
yarn install
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
yarn tsc --noEmit

# Clear TypeScript cache
rm -rf .next .expo tsconfig.tsbuildinfo
```

#### Test Failures
```bash
# Update snapshots
yarn test -u

# Run specific test
yarn test NewComponent.test.tsx

# Debug test
yarn test --watch --verbose
```

#### Build Issues
```bash
# Clear build cache
rm -rf .next out dist

# Rebuild
yarn build
```

### Environment Variable Issues

#### Web App (Next.js)
- Variables must have `NEXT_PUBLIC_` prefix for client-side access
- Create `.env.local` file in `apps/web/` directory (NOT at monorepo root)
- Restart development server after changes

#### Mobile App (Expo)
- Variables must have `EXPO_PUBLIC_` prefix for client-side access
- Create `.env.local` file in `apps/mobile/` directory (NOT at monorepo root)
- Clear Expo cache: `expo start --clear`

### Infura Token Issues

The warning "Infura token not set in .env" appears when:
1. Token is missing from environment variables
2. Token is invalid or expired
3. RPC endpoint requires authentication but token is empty

**Solution**:
```bash
# Check environment file in the correct location
cat apps/web/.env.local

# Verify token format
NEXT_PUBLIC_INFURA_TOKEN=your_32_character_token

# NOTE: .env.local must be in apps/web/ directory, not at monorepo root
```

### Debugging Tips

#### Web Application
- Use Redux DevTools Extension
- Check browser console for errors
- Use Next.js built-in debugging
- Monitor network requests in DevTools

#### Mobile Application
- Use React Native Debugger
- Check Metro bundler logs
- Use Expo DevTools
- Monitor device logs (iOS Console, Android Logcat)

#### Shared Packages
- Use `console.log` for debugging
- Check package resolution: `yarn why package-name`
- Verify TypeScript paths are correct

### Performance Optimization

#### Web Performance
- Use React DevTools Profiler
- Analyze bundle with `yarn analyze`
- Check Core Web Vitals
- Monitor Redux store size

#### Mobile Performance
- Use React Native Performance Monitor
- Profile with Flipper
- Check memory usage
- Optimize image loading

---

This reference guide should help you navigate the Safe Wallet monorepo effectively. Always refer to the existing code patterns and conventions when making changes, and don't hesitate to ask for clarification on specific implementation details.