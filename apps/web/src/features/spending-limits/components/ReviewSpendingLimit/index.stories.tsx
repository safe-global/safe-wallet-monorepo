import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import ReviewSpendingLimit from './index'

// ReviewSpendingLimit reads its `data` (amount/beneficiary/token/resetTime) from
// TxFlowContext and builds the on-chain tx via SafeTxProvider's setSafeTx. In the
// story harness neither provider is mounted, so both fall back to their default
// no-op contexts: `data` is undefined and setSafeTx never populates a safeTx.
// The wrapping ReviewTransaction therefore renders its self-contained
// "building transaction" skeleton — fully renderable in isolation without a live
// wallet or an in-flight tx flow. This mirrors the sibling RemoveSpendingLimitReview
// story, which relies on the same behaviour.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/balances/settings',
  shadcn: true,
})

const meta = {
  title: 'Features/SpendingLimits/ReviewSpendingLimit',
  component: ReviewSpendingLimit,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  args: {
    onSubmit: () => {},
  },
} satisfies Meta<typeof ReviewSpendingLimit>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
