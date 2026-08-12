import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from '@mui/material'
import SubscriptionSection from './sections/SubscriptionSection'
import PlanCard from './sections/PlansSection/PlanCard'
import StarterUpsellBanner from './StarterUpsellBanner'
import CheckoutReturnBanner from './CheckoutReturnBanner'
import { paymentLinkFixture, subscriptionFixture } from '../../hooks/billing/testFixtures'

const meta = {
  title: 'Features/Spaces/Billing',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

export const Starter: Story = {
  render: () => <StarterUpsellBanner onUpgrade={() => {}} />,
}

export const ActiveSubscription: Story = {
  render: () => <SubscriptionSection subscription={subscriptionFixture()} state="active" />,
}

export const PaymentFailed: Story = {
  render: () => (
    <SubscriptionSection subscription={subscriptionFixture({ status: 'past_due' })} state="payment_failed" />
  ),
}

export const Canceled: Story = {
  render: () => (
    <SubscriptionSection
      subscription={subscriptionFixture({ status: 'canceled', cancelAt: 1_800_000_000, validUntil: null })}
      state="canceled"
    />
  ),
}

export const PlanCards: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <PlanCard
        paymentLink={paymentLinkFixture({
          metadata: { planName: 'Pro', FEATURE_NUMBER_OF_SAFES: '25' },
          lineItems: [{ price: { unitAmount: 4900, currency: 'usd', recurring: { interval: 'month' } }, quantity: 1 }],
        })}
      />
      <PlanCard
        paymentLink={paymentLinkFixture({
          metadata: { planName: 'Business', FEATURE_NUMBER_OF_SAFES: '100' },
          lineItems: [{ price: { unitAmount: 59900, currency: 'usd', recurring: { interval: 'month' } }, quantity: 1 }],
        })}
        isCurrent
      />
    </Stack>
  ),
}

export const CheckoutStates: Story = {
  render: () => (
    <Stack spacing={2}>
      <CheckoutReturnBanner status="processing" />
      <CheckoutReturnBanner status="activating" />
      <CheckoutReturnBanner status="complete" />
      <CheckoutReturnBanner status="timeout" />
      <CheckoutReturnBanner status="error" />
    </Stack>
  ),
}
