import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import SafeHeaderInfo from './SafeHeaderInfo'
import { TokenType } from '@safe-global/store/gateway/types'

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_OWNER_1 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const MOCK_OWNER_2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  layout: 'paper',
})

const meta: Meta<typeof SafeHeaderInfo> = {
  title: 'Components/Sidebar/SafeHeaderInfo',
  component: SafeHeaderInfo,
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default SafeHeaderInfo showing a deployed Safe with balance.
 */
export const Default: Story = {}

/**
 * Loading state with skeleton placeholders.
 */
export const Loading: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
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
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Safe with a large total balance (whale account).
 */
export const LargeBalance: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
      balances: {
        data: {
          fiatTotal: '142567891.23',
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
          ],
        },
        loading: false,
        loaded: true,
      },
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Safe with zero balance (empty state).
 */
export const ZeroBalance: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
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
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Safe with multiple owners (3-of-5 multisig).
 */
export const MultipleOwners: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
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
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Counterfactual (not yet deployed) Safe showing native token balance.
 */
export const Counterfactual: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
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
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Safe on a different chain (Polygon).
 */
export const PolygonChain: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    layout: 'paper',

    store: {
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
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
