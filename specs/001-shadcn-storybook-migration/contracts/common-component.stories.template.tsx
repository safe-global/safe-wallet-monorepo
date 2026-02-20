/**
 * Story Template: Common Component (with data/store dependencies)
 *
 * Use this template for components in /components/common/ or feature components
 * that require Redux state, API mocking, or other context providers.
 *
 * PLACEHOLDERS TO REPLACE:
 * - ComponentName → Your actual component name
 * - ENDPOINT_PATH → Your API endpoint path (e.g., "balances", "transactions")
 * - "Component description" → Brief description of your component
 *
 * CONTEXT PROVIDERS (add as needed based on component dependencies):
 * - StoreDecorator: Required for components using Redux (useSelector, useDispatch)
 * - WalletContext.Provider: Required for components using useWallet/useWalletContext/CheckWallet
 * - TxModalContext.Provider: Required for components using setTxFlow (transaction flows)
 * - MockSDKProvider: Required for components using useSafeSDK
 * - RouterDecorator: Required for components using useRouter
 *
 * MSW BEST PRACTICES:
 * - Use regex patterns for URL matching (wildcard strings don't work reliably)
 * - Add mswLoader to both meta and individual stories for docs mode to work
 * - Ensure safeInfo.data has deployed: true for RTK Query to fire
 * - See msw-fixtures.md for detailed patterns
 *
 * See research.md section 6 for full context provider patterns.
 */

import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { StoreDecorator } from '@/stories/storeDecorator'
import ComponentName from './ComponentName'
// Uncomment as needed:
// import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
// import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
// import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

// ============================================================================
// Mock Data
// Use deterministic values for consistent snapshots (no faker/random data)
// ============================================================================

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_CHAIN_ID = '1'

// Replace with your endpoint path (e.g., 'balances', 'transactions')
const ENDPOINT_PATH = 'endpoint'

const mockSuccessResponse = {
  // Define mock response structure
  data: {
    // ...
  },
}

const mockEmptyResponse = {
  data: [],
}

// ============================================================================
// Context Mocks (uncomment as needed)
// ============================================================================

// const mockConnectedWallet: WalletContextType = {
//   connectedWallet: {
//     address: MOCK_ADDRESS,
//     chainId: MOCK_CHAIN_ID,
//     label: 'MetaMask',
//     provider: null as never,
//   },
//   signer: {
//     address: MOCK_ADDRESS,
//     chainId: MOCK_CHAIN_ID,
//     provider: null,
//   },
//   setSignerAddress: () => {},
// }

// const mockTxModalContext: TxModalContextType = {
//   txFlow: undefined,
//   setTxFlow: () => {},
//   setFullWidth: () => {},
// }

// const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
//   useEffect(() => {
//     setSafeSDK({} as never)
//     return () => setSafeSDK(undefined)
//   }, [])
//   return <>{children}</>
// }

// ============================================================================
// MSW Handler Factory
// ============================================================================

// Create regex pattern for endpoint matching
const createEndpointPattern = (endpoint: string) => new RegExp(`/v1/chains/\\d+/${endpoint}`)

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Common/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  // IMPORTANT: mswLoader is required for MSW to work in docs mode
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description',
      },
    },
    // Default MSW handlers for all stories
    // Use regex patterns - wildcard strings don't work reliably in MSW v2
    msw: {
      handlers: [
        http.get(createEndpointPattern(ENDPOINT_PATH), () => {
          return HttpResponse.json(mockSuccessResponse)
        }),
      ],
    },
  },
  argTypes: {
    // Define controls for component props
  },
  decorators: [
    (Story) => (
      // Wrap with additional providers as needed (outermost to innermost):
      // <MockSDKProvider>
      //   <WalletContext.Provider value={mockConnectedWallet}>
      //     <TxModalContext.Provider value={mockTxModalContext}>
      <StoreDecorator
        initialState={{
          // Minimal Redux state needed for component
          chains: {
            data: [{ chainId: MOCK_CHAIN_ID }],
          },
          safeInfo: {
            data: {
              address: { value: MOCK_ADDRESS },
              chainId: MOCK_CHAIN_ID,
              owners: [{ value: MOCK_ADDRESS }],
              threshold: 1,
              deployed: true,
            },
            loading: false,
            loaded: true,
          },
        }}
      >
        <Paper sx={{ padding: 2, minWidth: 300 }}>
          <Story />
        </Paper>
      </StoreDecorator>
      //     </TxModalContext.Provider>
      //   </WalletContext.Provider>
      // </MockSDKProvider>
    ),
  ],
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state with successful data fetch
 */
export const Default: Story = {
  args: {
    // Add component props here
  },
  // IMPORTANT: Add loaders to each story for docs mode
  loaders: [mswLoader],
}

/**
 * Loading state - API request pending
 * Useful for verifying loading indicators
 */
export const Loading: Story = {
  args: {},
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        http.get(createEndpointPattern(ENDPOINT_PATH), async () => {
          // Simulate long-running request
          await new Promise((resolve) => setTimeout(resolve, 100000))
          return HttpResponse.json(mockSuccessResponse)
        }),
      ],
    },
  },
}

/**
 * Error state - API request failed
 * Useful for verifying error handling and UI
 */
export const Error: Story = {
  args: {},
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        http.get(createEndpointPattern(ENDPOINT_PATH), () => {
          return HttpResponse.json({ message: 'Internal server error', code: 500 }, { status: 500 })
        }),
      ],
    },
  },
}

/**
 * Empty state - No data returned
 * Useful for verifying empty state UI
 */
export const Empty: Story = {
  args: {},
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        http.get(createEndpointPattern(ENDPOINT_PATH), () => {
          return HttpResponse.json(mockEmptyResponse)
        }),
      ],
    },
  },
}

/**
 * Network error - Request failed to connect
 */
export const NetworkError: Story = {
  args: {},
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        http.get(createEndpointPattern(ENDPOINT_PATH), () => {
          return HttpResponse.error()
        }),
      ],
    },
  },
}

// ============================================================================
// Additional Stories (customize as needed)
// ============================================================================

/**
 * Alternative chain configuration
 */
export const AlternativeChain: Story = {
  args: {},
  loaders: [mswLoader],
}

/**
 * Disabled state (if applicable)
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  loaders: [mswLoader],
}
