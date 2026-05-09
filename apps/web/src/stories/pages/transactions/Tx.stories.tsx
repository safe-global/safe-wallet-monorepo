import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import TxDetail from '@/pages/transactions/tx'

/**
 * Transaction Detail page - displays a specific transaction.
 * Shows transaction data, confirmations, and execution status.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/tx',
})

const meta = {
  title: 'Pages/Core/Transactions/Detail',
  component: TxDetail,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof TxDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
