import type { Meta, StoryObj, Decorator } from '@storybook/react'
import Billing from './index'
import { BillingDataProvider } from './BillingDataContext'
import { createPaidBillingState, createStarterBillingState } from './mocks'

const withStarter: Decorator = (Story) => (
  <BillingDataProvider value={createStarterBillingState()}>
    <Story />
  </BillingDataProvider>
)

const withSubscription: Decorator = (Story) => (
  <BillingDataProvider value={createPaidBillingState()}>
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

// Empty / Starter: no subscription header — upsell banner + Plans only.
export const Starter: Story = {
  decorators: [withStarter],
}

// Paid: subscription/usage section on top, Plans below.
export const WithSubscription: Story = {
  decorators: [withSubscription],
}
