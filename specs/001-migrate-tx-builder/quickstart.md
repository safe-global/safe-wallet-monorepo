# Quickstart: tx-builder Development

## Prerequisites

- Node.js >= 18
- Yarn 4.x (via corepack)
- Git

## Setup

### 1. Clone and Install

```bash
# Clone the monorepo
git clone https://github.com/safe-global/safe-wallet-monorepo.git
cd safe-wallet-monorepo

# Enable corepack for Yarn 4
corepack enable

# Install all dependencies
yarn install
```

### 2. Environment Variables

Create `apps/tx-builder/.env` (or use `.env.local`):

```bash
# Required for transaction simulation
VITE_TENDERLY_ORG_NAME=your-org
VITE_TENDERLY_PROJECT_NAME=your-project
VITE_TENDERLY_SIMULATE_ENDPOINT_URL=https://api.tenderly.co/api/v1/...

# Optional
VITE_ETHERSCAN_API_KEY=your-key
```

### 3. Run Development Server

```bash
# Start tx-builder dev server
yarn workspace @safe-global/tx-builder dev

# Opens at http://localhost:3000/tx-builder
```

### 4. Test in Safe{Wallet}

tx-builder runs as a Safe App inside Safe{Wallet}. To test:

1. Go to https://app.safe.global (or local dev instance)
2. Connect a Safe
3. Go to Apps → Add Custom App
4. Enter: `http://localhost:3000/tx-builder/manifest.json`
5. Load the app

## Common Commands

```bash
# Development
yarn workspace @safe-global/tx-builder dev        # Start dev server
yarn workspace @safe-global/tx-builder build      # Production build
yarn workspace @safe-global/tx-builder preview    # Preview production build

# Quality Gates
yarn workspace @safe-global/tx-builder type-check # TypeScript check
yarn workspace @safe-global/tx-builder lint       # ESLint
yarn workspace @safe-global/tx-builder prettier   # Prettier check
yarn workspace @safe-global/tx-builder test       # Jest tests

# Fix issues
yarn workspace @safe-global/tx-builder lint:fix   # Auto-fix lint issues
yarn prettier:fix                                  # Fix formatting (root)
```

## Project Structure

```
apps/tx-builder/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── components/           # UI components
│   ├── pages/                # Route pages
│   ├── hooks/                # Custom hooks
│   ├── store/                # React Context
│   ├── lib/                  # Business logic
│   └── theme/                # MUI theme
├── public/
│   └── manifest.json         # Safe App manifest
├── vite.config.ts            # Vite configuration
└── package.json
```

## Safe App Manifest

Located at `public/manifest.json`:

```json
{
  "name": "Transaction Builder",
  "description": "Compose custom contract interactions and batch them into a single transaction",
  "iconPath": "tx-builder.png"
}
```

## Testing Transactions

### Local Safe (Recommended for Development)

1. Use the Safe{Wallet} dev environment
2. Connect a test Safe on a testnet (Goerli, Sepolia)
3. Use test contracts for transaction building

### Mocking the Safe Context

For unit tests without the Safe iframe:

```typescript
import { render } from '@testing-library/react'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'

const mockSafe = {
  safeAddress: '0x...',
  chainId: 1,
  threshold: 2,
  owners: ['0x...', '0x...'],
  isReadOnly: false,
}

// Tests can mock the SDK context
```

## Troubleshooting

### "Not connected to a Safe"

- Ensure you're loading tx-builder through Safe{Wallet}, not directly
- Check the manifest.json is accessible at the correct URL

### Vite HMR Not Working

- Clear browser cache
- Restart dev server
- Check console for WebSocket errors

### Type Errors After Migration

```bash
# Regenerate types
yarn workspace @safe-global/tx-builder type-check

# Clear TypeScript cache
rm -rf apps/tx-builder/node_modules/.cache
```

### MUI Styling Issues

- Ensure all imports use `@mui/material` (not `@material-ui`)
- Check theme provider is wrapping the app correctly
- Verify styled-components ThemeProvider receives MUI theme
