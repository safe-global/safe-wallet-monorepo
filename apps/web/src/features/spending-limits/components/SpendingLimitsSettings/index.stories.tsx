import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SpendingLimitState } from '../../types'
import SpendingLimitsSettings from './index'

const spendingLimits: SpendingLimitState[] = [
  {
    beneficiary: '0x1f2504De05f5167650bE5B28c472601Be434b60A',
    token: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
    },
    amount: '1000000000000000000',
    nonce: '0',
    resetTimeMin: '10080',
    lastResetMin: '27000000',
    spent: '250000000000000000',
  },
  {
    beneficiary: '0x220866B1A2219f40e72f5c628B65D54268cA3A9D',
    token: {
      address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
      symbol: 'AWETH',
      decimals: 18,
      logoUri: 'https://assets.coingecko.com/coins/images/32882/thumb/WETH_%281%29.png?1699716492',
    },
    amount: '5000000000000000000',
    nonce: '1',
    resetTimeMin: '0',
    lastResetMin: '0',
    spent: '0',
  },
]

const spendingLimitsSlice = (data: SpendingLimitState[], loading: boolean) => ({
  spendingLimits: { data, loaded: !loading, loading, error: undefined },
})

// Feature enabled, store empty and not loading -> renders the "how it works" explainer
const emptySetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/settings/spending-limits',
  shadcn: true,
  store: spendingLimitsSlice([], false),
})

const meta = {
  title: 'Features/SpendingLimits/SpendingLimitsSettings',
  component: SpendingLimitsSettings,
  loaders: [mswLoader],
  decorators: [emptySetup.decorator],
  parameters: {
    layout: 'padded',
    ...emptySetup.parameters,
  },
} satisfies Meta<typeof SpendingLimitsSettings>

export default meta

type Story = StoryObj<typeof meta>

/** No spending limits configured yet — shows the explainer of what a spending limit is. */
export const Empty: Story = {}

/** Existing spending limits are listed in the table with beneficiary, spent amount and reset time. */
const populatedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/settings/spending-limits',
  shadcn: true,
  store: spendingLimitsSlice(spendingLimits, false),
})

export const WithLimits: Story = {
  decorators: [populatedSetup.decorator],
  parameters: {
    layout: 'padded',
    ...populatedSetup.parameters,
  },
}

/** Limits are still loading — the table renders skeleton placeholder rows. */
const loadingSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/settings/spending-limits',
  shadcn: true,
  store: spendingLimitsSlice(spendingLimits, true),
})

export const Loading: Story = {
  decorators: [loadingSetup.decorator],
  parameters: {
    layout: 'padded',
    ...loadingSetup.parameters,
  },
}
