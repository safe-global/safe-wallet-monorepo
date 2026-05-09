import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import History from '@/pages/transactions/history'

/**
 * Transaction History page - displays completed transactions.
 * Shows executed transactions with details and status.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/history',
})

const meta = {
  title: 'Pages/Core/Transactions/History',
  component: History,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof History>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
