import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import SpendingLimitReviewDetails from './SpendingLimitReviewDetails'

const setup = createMockStory({ scenario: 'efSafe', shadcn: true })

const USDC = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  logoUri: '',
  name: 'USD Coin',
  symbol: 'USDC',
  type: 'ERC20' as const,
}

const meta = {
  title: 'Features/SpendingLimits/SpendingLimitReviewDetails',
  component: SpendingLimitReviewDetails,
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    tokenInfo: USDC,
    amountInWei: '1500000',
    beneficiary: '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F',
    resetTime: '1 day',
    isOneTime: false,
  },
} satisfies Meta<typeof SpendingLimitReviewDetails>

export default meta
type Story = StoryObj<typeof meta>

export const NewLimit: Story = {}

export const OneTimeLimit: Story = {
  args: {
    resetTime: 'One-time spending limit',
    isOneTime: true,
  },
}

export const ReplacesLimit: Story = {
  args: {
    replaces: { previousAmount: '1', previousResetTime: '1 week' },
  },
}

export const ReplacesLimitWithSameResetTime: Story = {
  args: {
    replaces: { previousAmount: '1' },
  },
}
