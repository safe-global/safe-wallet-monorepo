import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { StoreDecorator } from '@/stories/storeDecorator'
import QrModal from './QrModal'
import { TOKEN_LISTS } from '@/store/settingsSlice'

type StoryArgs = {
  onClose: () => void
  stateOverrides?: Record<string, unknown>
}

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_OWNER = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const createInitialState = (overrides: Record<string, unknown> = {}) => ({
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: {
      copy: true,
      qr: false,
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
    ...((overrides.settings as Record<string, unknown>) || {}),
  },
  chains: {
    data: [
      {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
        theme: {
          backgroundColor: '#E8E7E6',
          textColor: '#001428',
        },
      },
    ],
  },
  safeInfo: {
    data: {
      address: { value: MOCK_SAFE_ADDRESS },
      chainId: '1',
      owners: [{ value: MOCK_OWNER }],
      threshold: 1,
      deployed: true,
    },
    loading: false,
    loaded: true,
  },
  ...overrides,
})

const meta: Meta<StoryArgs> = {
  title: 'Components/Sidebar/QrModal',
  component: QrModal,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const stateOverrides = (context.args as StoryArgs)?.stateOverrides || {}
      return (
        <StoreDecorator initialState={createInitialState(stateOverrides)} context={context}>
          <Story />
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
  argTypes: {
    onClose: {
      action: 'closed',
      description: 'Callback when the modal is closed',
    },
  },
}

export default meta
type Story = StoryObj<StoryArgs>

/**
 * Default QR modal without chain prefix in QR code.
 */
export const Default: Story = {
  args: {
    onClose: fn(),
  },
}

/**
 * QR modal with chain prefix enabled (eth:0x...).
 */
export const WithChainPrefix: Story = {
  args: {
    onClose: fn(),
    stateOverrides: {
      settings: {
        shortName: {
          copy: true,
          qr: true,
        },
      },
    },
  },
}

/**
 * QR modal for Polygon network.
 */
export const PolygonNetwork: Story = {
  args: {
    onClose: fn(),
    stateOverrides: {
      chains: {
        data: [
          {
            chainId: '137',
            chainName: 'Polygon',
            shortName: 'matic',
            nativeCurrency: { symbol: 'MATIC', decimals: 18, name: 'Matic' },
            theme: {
              backgroundColor: '#8247E5',
              textColor: '#FFFFFF',
            },
          },
        ],
      },
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '137',
          owners: [{ value: MOCK_OWNER }],
          threshold: 1,
          deployed: true,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * QR modal for Arbitrum network.
 */
export const ArbitrumNetwork: Story = {
  args: {
    onClose: fn(),
    stateOverrides: {
      chains: {
        data: [
          {
            chainId: '42161',
            chainName: 'Arbitrum One',
            shortName: 'arb1',
            nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
            theme: {
              backgroundColor: '#28A0F0',
              textColor: '#FFFFFF',
            },
          },
        ],
      },
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '42161',
          owners: [{ value: MOCK_OWNER }],
          threshold: 1,
          deployed: true,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * QR modal for Optimism network with chain prefix enabled.
 */
export const OptimismWithPrefix: Story = {
  args: {
    onClose: fn(),
    stateOverrides: {
      settings: {
        shortName: {
          copy: true,
          qr: true,
        },
      },
      chains: {
        data: [
          {
            chainId: '10',
            chainName: 'Optimism',
            shortName: 'oeth',
            nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
            theme: {
              backgroundColor: '#FF0420',
              textColor: '#FFFFFF',
            },
          },
        ],
      },
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '10',
          owners: [{ value: MOCK_OWNER }],
          threshold: 1,
          deployed: true,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}

/**
 * QR modal for Base network.
 */
export const BaseNetwork: Story = {
  args: {
    onClose: fn(),
    stateOverrides: {
      chains: {
        data: [
          {
            chainId: '8453',
            chainName: 'Base',
            shortName: 'base',
            nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
            theme: {
              backgroundColor: '#0052FF',
              textColor: '#FFFFFF',
            },
          },
        ],
      },
      safeInfo: {
        data: {
          address: { value: MOCK_SAFE_ADDRESS },
          chainId: '8453',
          owners: [{ value: MOCK_OWNER }],
          threshold: 1,
          deployed: true,
        },
        loading: false,
        loaded: true,
      },
    },
  },
}
