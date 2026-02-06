import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Queue from '@/pages/transactions/queue'

/**
 * Transaction Queue page - displays pending transactions awaiting signatures or execution.
 * Includes batch execution controls and recovery list.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/queue',
})

const meta = {
  title: 'Pages/Core/Transactions/Queue',
  component: Queue,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Queue>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
