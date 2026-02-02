import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { createMockStory } from '@/stories/mocks'
import QrModal from './QrModal'

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_OWNER = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  store: {
    settings: {
      shortName: { copy: true, qr: false },
    },
  },
})

const meta: Meta<typeof QrModal> = {
  title: 'Components/Sidebar/QrModal',
  component: QrModal,
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
  argTypes: {
    onClose: {
      action: 'closed',
      description: 'Callback when the modal is closed',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

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
export const WithChainPrefix: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    store: {
      settings: {
        shortName: { copy: true, qr: true },
      },
    },
  })
  return {
    args: { onClose: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * QR modal for Polygon network.
 */
export const PolygonNetwork: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    store: {
      settings: {
        shortName: { copy: true, qr: false },
      },
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
  })
  return {
    args: { onClose: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * QR modal for Arbitrum network.
 */
export const ArbitrumNetwork: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    store: {
      settings: {
        shortName: { copy: true, qr: false },
      },
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
  })
  return {
    args: { onClose: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * QR modal for Optimism network with chain prefix enabled.
 */
export const OptimismWithPrefix: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    store: {
      settings: {
        shortName: { copy: true, qr: true },
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
  })
  return {
    args: { onClose: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * QR modal for Base network.
 */
export const BaseNetwork: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    store: {
      settings: {
        shortName: { copy: true, qr: false },
      },
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
  })
  return {
    args: { onClose: fn() },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
