import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Messages from '@/pages/transactions/messages'

/**
 * Messages page - displays off-chain messages.
 * Shows signed messages and EIP-712 typed data.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/messages',
})

const meta = {
  title: 'Pages/Core/Transactions/Messages',
  component: Messages,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Messages>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
