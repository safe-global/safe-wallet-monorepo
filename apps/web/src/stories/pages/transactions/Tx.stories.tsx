import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import TxDetail from '@/pages/transactions/tx'

/**
 * Transaction Detail page - displays a specific transaction.
 * Shows transaction data, confirmations, and execution status.
 */

const meta = {
  title: 'Pages/Core/Transactions/Detail',
  component: TxDetail,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TxDetail>

export default meta
type Story = StoryObj<typeof meta>

// The tx detail page reads the transaction id from the router query and fetches its details.
// The default `txDetailsHandler` (see stories/mocks/handlers) returns a mock for any id: an id containing
// "abc1" yields an awaiting ERC-20 transfer, one containing "exec1" the same transfer executed.
const txDetailStory = (id: string): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'fullPage',
    pathname: '/transactions/tx',
    query: { id },
  })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
}

export const Default: Story = txDetailStory('multisig_0x1234_0xabc1')

export const Executed: Story = txDetailStory('multisig_0x1234_0xexec1')
