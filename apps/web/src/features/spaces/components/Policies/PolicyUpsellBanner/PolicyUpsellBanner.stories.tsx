import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import PolicyUpsellBanner from './index'

const meta = {
  title: 'Features/Spaces/Policies/PolicyUpsellBanner',
  component: PolicyUpsellBanner,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onUpgrade: fn() },
} satisfies Meta<typeof PolicyUpsellBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Starter: Story = {
  args: { planName: 'Starter', workspaceName: 'Acme Inc' },
}

/** A long workspace name must wrap under the badge, not push the button off the card. */
export const LongWorkspaceName: Story = {
  args: { planName: 'Starter', workspaceName: 'The International Society for the Preservation of Very Long Names' },
}
