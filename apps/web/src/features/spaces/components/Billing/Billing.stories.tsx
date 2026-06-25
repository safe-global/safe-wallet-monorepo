import type { Meta, StoryObj, Decorator } from '@storybook/react'
import Billing from './index'
import { BillingDataProvider } from './BillingDataContext'
import { createPaidBillingState, createStarterBillingState } from './mocks'

const withStarter: Decorator = (Story) => (
  <BillingDataProvider value={createStarterBillingState()}>
    <Story />
  </BillingDataProvider>
)

const withinLimit: Decorator = (Story) => (
  <BillingDataProvider value={createPaidBillingState('within_limit')}>
    <Story />
  </BillingDataProvider>
)

const approachingLimit: Decorator = (Story) => (
  <BillingDataProvider value={createPaidBillingState('approaching_limit')}>
    <Story />
  </BillingDataProvider>
)

const limitReached: Decorator = (Story) => (
  <BillingDataProvider value={createPaidBillingState('limit_reached')}>
    <Story />
  </BillingDataProvider>
)

const paymentFailed: Decorator = (Story) => (
  <BillingDataProvider value={createPaidBillingState('payment_failed')}>
    <Story />
  </BillingDataProvider>
)

const meta = {
  title: 'Features/Spaces/Billing',
  component: Billing,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Billing>

export default meta
type Story = StoryObj<typeof meta>

export const Starter: Story = {
  decorators: [withStarter],
}

export const WithSubscription: Story = {
  decorators: [withinLimit],
}

export const ApproachingLimit: Story = {
  decorators: [approachingLimit],
}

export const LimitReached: Story = {
  decorators: [limitReached],
}

export const PaymentFailed: Story = {
  decorators: [paymentFailed],
}
