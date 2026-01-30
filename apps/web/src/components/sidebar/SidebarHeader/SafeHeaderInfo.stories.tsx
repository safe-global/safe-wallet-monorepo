import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import SafeHeaderInfo from './SafeHeaderInfo'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { TokenType } from '@safe-global/store/gateway/types'

type StoryArgs = {
  stateOverrides?: Record<string, unknown>
}

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_OWNER_1 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const MOCK_OWNER_2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

// Mock balance data
const defaultMockBalances = {
  fiatTotal: '142567.89',
  items: [
    {
      tokenInfo: {
        type: TokenType.NATIVE_TOKEN,
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        symbol: 'ETH',
        name: 'Ether',
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
      },
      balance: '50000000000000000000',
      fiatBalance: '125000.00',
      fiatConversion: '2500.00',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
        decimals: 18,
        symbol: 'SAFE',
        name: 'Safe Token',
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png',
      },
      balance: '100000000000000000000000',
      fiatBalance: '17567.89',
      fiatConversion: '0.175679',
    },
  ],
}

const createInitialState = (overrides: Record<string, unknown> = {}) => ({
  balances: {
    data: defaultMockBalances,
    loading: false,
    loaded: true,
    error: undefined,
  },
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: {
      copy: true,
      qr: true,
    },
    theme: {
      darkMode: false,
    },
    env: {
      tenderly: {
        url: '',
        accessToken: '',
      },
      rpc: {},
    },
    signing: {
      onChainSigning: false,
      blindSigning: false,
    },
    transactionExecution: true,
  },
  chains: {
    data: [
      {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
      },
    ],
  },
  safeInfo: {
    data: {
      address: { value: MOCK_SAFE_ADDRESS },
      chainId: '1',
      owners: [{ value: MOCK_OWNER_1 }, { value: MOCK_OWNER_2 }],
      threshold: 2,
      deployed: true,
      nonce: 42,
    },
    loading: false,
    loaded: true,
  },
  ...overrides,
})

const meta: Meta<StoryArgs> = {
  title: 'Components/Sidebar/SafeHeaderInfo',
  component: SafeHeaderInfo,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const stateOverrides = (context.args as StoryArgs)?.stateOverrides || {}
      return (
        <StoreDecorator initialState={createInitialState(stateOverrides)} context={context}>
          <Paper sx={{ padding: 2, minWidth: 280 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<StoryArgs>

/**
 * Default SafeHeaderInfo showing a deployed Safe with balance.
 */
export const Default: Story = {}

/**
 * Loading state with skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    stateOverrides: {
      safeInfo: {
        data: undefined,
        loading: true,
        loaded: false,
      },
      balances: {
        data: { fiatTotal: '', items: [] },
        loading: true,
        loaded: false,
      },
    },
  },
}

/**
 * Safe with a large total balance (whale account).
 */
export const LargeBalance: Story = {
  args: {
    stateOverrides: {
      balances: {
        data: {
          fiatTotal: '142567891.23',
          items: defaultMockBalances.items,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * Safe with zero balance (empty state).
 */
export const ZeroBalance: Story = {
  args: {
    stateOverrides: {
      balances: {
        data: {
          fiatTotal: '0',
          items: [
            {
              tokenInfo: {
                type: TokenType.NATIVE_TOKEN,
                address: '0x0000000000000000000000000000000000000000',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ether',
                logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
              },
              balance: '0',
              fiatBalance: '0',
              fiatConversion: '2500.00',
            },
          ],
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * Safe with multiple owners (3-of-5 multisig).
 */
export const MultipleOwners: Story = {
  args: {
    stateOverrides: {
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '1',
          owners: [
            { value: '0x1111111111111111111111111111111111111111' },
            { value: '0x2222222222222222222222222222222222222222' },
            { value: '0x3333333333333333333333333333333333333333' },
            { value: '0x4444444444444444444444444444444444444444' },
            { value: '0x5555555555555555555555555555555555555555' },
          ],
          threshold: 3,
          deployed: true,
          nonce: 100,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * Counterfactual (not yet deployed) Safe showing native token balance.
 */
export const Counterfactual: Story = {
  args: {
    stateOverrides: {
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '1',
          owners: [{ value: MOCK_OWNER_1 }],
          threshold: 1,
          deployed: false,
          nonce: 0,
        },
        loading: false,
        loaded: true,
      },
      balances: {
        data: {
          fiatTotal: '500.00',
          items: [
            {
              tokenInfo: {
                type: TokenType.NATIVE_TOKEN,
                address: '0x0000000000000000000000000000000000000000',
                decimals: 18,
                symbol: 'ETH',
                name: 'Ether',
                logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
              },
              balance: '200000000000000000',
              fiatBalance: '500.00',
              fiatConversion: '2500.00',
            },
          ],
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * Safe on a different chain (Polygon).
 */
export const PolygonChain: Story = {
  args: {
    stateOverrides: {
      chains: {
        data: [
          {
            chainId: '137',
            chainName: 'Polygon',
            shortName: 'matic',
            nativeCurrency: { symbol: 'MATIC', decimals: 18, name: 'Matic' },
          },
        ],
      },
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '137',
          owners: [{ value: MOCK_OWNER_1 }, { value: MOCK_OWNER_2 }],
          threshold: 2,
          deployed: true,
          nonce: 15,
        },
        loading: false,
        loaded: true,
      },
      balances: {
        data: {
          fiatTotal: '1234.56',
          items: [
            {
              tokenInfo: {
                type: TokenType.NATIVE_TOKEN,
                address: '0x0000000000000000000000000000000000000000',
                decimals: 18,
                symbol: 'MATIC',
                name: 'Matic',
                logoUri: 'https://safe-transaction-assets.safe.global/chains/137/currency_logo.png',
              },
              balance: '1000000000000000000000',
              fiatBalance: '1234.56',
              fiatConversion: '1.23',
            },
          ],
        },
        loading: false,
        loaded: true,
      },
    },
  },
}
