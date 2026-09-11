import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SpendingLimitState } from '../../types'
import RemoveSpendingLimitReview from './index'

// The efSafe fixture has `modules: null`, so the review's effect early-returns
// (no spending-limit module deployed → no on-chain tx is built). The component
// therefore renders its real "building transaction" loading state via
// ReviewTransaction, which is fully self-contained and renderable in isolation.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/balances/settings',
  shadcn: true,
})

const params: SpendingLimitState = {
  beneficiary: '0x1234567890123456789012345678901234567890',
  token: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    decimals: 18,
  },
  amount: '1000000000000000000',
  nonce: '0',
  resetTimeMin: '0',
  lastResetMin: '0',
  spent: '0',
}

const meta = {
  title: 'Features/SpendingLimits/RemoveSpendingLimitReview',
  component: RemoveSpendingLimitReview,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  args: {
    params,
    onSubmit: () => {},
  },
} satisfies Meta<typeof RemoveSpendingLimitReview>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
