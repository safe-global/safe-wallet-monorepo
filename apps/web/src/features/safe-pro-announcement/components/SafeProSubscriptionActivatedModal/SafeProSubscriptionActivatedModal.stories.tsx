import type { Meta, StoryObj } from '@storybook/react'
import SafeProSubscriptionActivatedModal from './index'

const meta = {
  component: SafeProSubscriptionActivatedModal,
  title: 'Features/SafePro/SafeProSubscriptionActivatedModal',
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: () => {},
    planName: 'Business',
    price: 499,
    currency: 'eur',
    billingCycle: 'month',
    nextBillingAt: Date.UTC(2026, 9, 1),
  },
} satisfies Meta<typeof SafeProSubscriptionActivatedModal>

export default meta

export const Default: StoryObj<typeof meta> = {}

export const Yearly: StoryObj<typeof meta> = { args: { price: 5389, billingCycle: 'year' } }
