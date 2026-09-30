import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import TxDetail from '@/pages/transactions/tx'

/**
 * Transaction Detail page - displays a specific transaction.
 * Shows transaction data, confirmations, and execution status.
 */

// The tx detail page reads the transaction id from the router query and fetches its details.
// The default `txDetailsHandler` (see stories/mocks/handlers) returns a mock for any id;
// an id containing "abc1" yields an awaiting ERC-20 transfer (shows the Confirm/Execute actions).
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/tx',
  query: { id: 'multisig_0x1234_0xabc1' },
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
