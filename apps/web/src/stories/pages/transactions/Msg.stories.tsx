import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import MsgDetail from '@/pages/transactions/msg'

/**
 * Message Detail page - displays a specific message.
 * Shows message content, signatures, and status.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/msg',
})

const meta = {
  title: 'Pages/Core/Transactions/MessageDetail',
  component: MsgDetail,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof MsgDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
