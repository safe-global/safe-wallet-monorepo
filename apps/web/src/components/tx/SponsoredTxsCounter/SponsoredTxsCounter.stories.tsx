import type { Meta, StoryObj } from '@storybook/react'
import SponsoredTxsCounter from './index'

const meta = {
  title: 'Components/Tx/SponsoredTxsCounter',
  component: SponsoredTxsCounter,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[500px] overflow-hidden rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SponsoredTxsCounter>

export default meta
type Story = StoryObj<typeof meta>

export const SafePro: Story = {
  args: { left: 30, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z', isPro: true },
}

export const SafeProExhausted: Story = {
  args: { left: 0, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z', isPro: true },
}

export const SafeProUnlimited: Story = {
  args: { left: null, quota: null, resetsAt: null, isPro: true },
}

export const Free: Story = {
  args: { left: 5, quota: null, resetsAt: null, isPro: false },
}
