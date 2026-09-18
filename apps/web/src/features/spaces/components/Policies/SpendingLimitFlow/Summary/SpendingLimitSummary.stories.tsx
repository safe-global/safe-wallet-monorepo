import type { Meta, StoryObj } from '@storybook/react'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockStory } from '@/stories/mocks'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import SpendingLimitSummary from './index'
import type { LimitSummary, LimitSummaryToken, SpendingLimitSummaryModel, SpenderSummary } from './types'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const ALICE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const BOB = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const CAROL = '0x86753fE4B8e29Ce8A38cDf9559D80E05B00cDbA0'
const UNNAMED = '0x9F7dfAb2222A473284205cdDF08a677726d786A0'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const ETHEREUM = '1'
const SEPOLIA = '11155111'

const ETH: LimitSummaryToken = {
  address: ZERO_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
}
const USDC_TOKEN: LimitSummaryToken = {
  address: USDC,
  symbol: 'USDC',
  decimals: 6,
  logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
}

const treasury = (chainId = ETHEREUM): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, EF_SAFE),
  chainId,
  address: EF_SAFE,
  name: 'Treasury',
  threshold: 3,
  owners: 5,
  eligibility: 'signer',
  chain:
    chainId === SEPOLIA
      ? { chainId, chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' }
      : { chainId, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  fiatTotal: '123720',
})

const spender = (address: string, name: string | undefined, limits: LimitSummary[]): SpenderSummary => ({
  address,
  name,
  limits,
})

/** The Figma frame: one-time ETH for Alice, weekly ETH and monthly USDC for Bob — no single frequency to name. */
const mixed: SpendingLimitSummaryModel = {
  safe: treasury(),
  spenders: [
    spender(ALICE, 'Alice', [{ token: ETH, amount: '0.5466', resetTimeMin: '0' }]),
    spender(BOB, 'Bob', [
      { token: ETH, amount: '0.5466', resetTimeMin: '10080' },
      { token: USDC_TOKEN, amount: '250', resetTimeMin: '43200' },
    ]),
  ],
}

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', layout: 'none', shadcn: true })

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitSummary',
  component: SpendingLimitSummary,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [
    setup.decorator,
    // Caps at the tx-flow card column, but shrinks so the viewport addon exercises narrow widths.
    (Story) => (
      <div className="w-full max-w-[577px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: { policy: mixed },
} satisfies Meta<typeof SpendingLimitSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Mixed: Story = {}

/** One spender, one limit: the callout names the frequency and speaks in the singular. */
export const SingleLimit: Story = {
  args: {
    policy: {
      safe: treasury(),
      spenders: [spender(ALICE, 'Alice', [{ token: ETH, amount: '0.5466', resetTimeMin: '0' }])],
    },
  },
}

/** Every limit shares one canonical period, so the adjective survives in the plural. */
export const UniformWeekly: Story = {
  args: {
    policy: {
      safe: treasury(),
      spenders: [
        spender(ALICE, 'Alice', [{ token: ETH, amount: '0.5466', resetTimeMin: '10080' }]),
        spender(BOB, 'Bob', [{ token: USDC_TOKEN, amount: '250', resetTimeMin: '10080' }]),
      ],
    },
  },
}

/** Three spenders read as `Alice, Bob and Carol`. */
export const ThreeSpenders: Story = {
  args: {
    policy: {
      safe: treasury(),
      spenders: [
        spender(ALICE, 'Alice', [{ token: ETH, amount: '0.5466', resetTimeMin: '0' }]),
        spender(BOB, 'Bob', [{ token: ETH, amount: '1', resetTimeMin: '0' }]),
        spender(CAROL, 'Carol', [{ token: USDC_TOKEN, amount: '500', resetTimeMin: '0' }]),
      ],
    },
  },
}

/** No address-book entry: the shortened address stands in for the name, in the callout and on the card. */
export const UnnamedSpender: Story = {
  args: {
    policy: {
      safe: treasury(),
      spenders: [
        spender(ALICE, 'Alice', [{ token: ETH, amount: '0.5466', resetTimeMin: '1440' }]),
        spender(UNNAMED, undefined, [{ token: USDC_TOKEN, amount: '100', resetTimeMin: '1440' }]),
      ],
    },
  },
}

/** A Sepolia test period has no Figma wording: the row shows the dropdown label and the callout drops the adjective. */
export const TestPeriodOnSepolia: Story = {
  args: {
    policy: {
      safe: treasury(SEPOLIA),
      spenders: [spender(ALICE, 'Alice', [{ token: ETH, amount: '0.01', resetTimeMin: '30' }])],
    },
  },
}
