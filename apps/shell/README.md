# Safe Shell App

The Shell application for the Safe{Wallet} micro-frontend architecture.

## Overview

This app provides:

- Authentication and wallet connection
- Global navigation and layout (header + sidebar)
- Onboarding flow
- Account app embedding via iframe

## Development

```bash
# Install dependencies
yarn install

# Run development server
yarn workspace @safe-global/shell dev

# Build for production
yarn workspace @safe-global/shell build

# Serve production build
yarn workspace @safe-global/shell serve
```

The shell app runs on port 3001 by default to avoid conflicts with the account app (port 3000).

## Architecture

- **Shell routes** (`/`, `/welcome`, `/new-safe`) - Rendered directly by shell
- **Account routes** (with `?safe=...`) - Rendered via iframe from account app
- **Communication** - Shell and account app communicate via postMessage using `@safe-global/shell-protocol`

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_ACCOUNT_APP_URL` - URL of the account app (default: `/account-app`)
- `NEXT_PUBLIC_WC_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_INFURA_TOKEN` - Infura API token (optional)
