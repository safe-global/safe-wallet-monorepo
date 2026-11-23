import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { createChainData, createChainsPageData, createChainsPageDataV2 } from '@/stories/mocks/chains'
import { createMockStory } from '@/stories/mocks/createMockStory'
import {
  BLOCKED_SECTIONS,
  getPendingTxs,
  PENDING_SECTIONS,
  QUEUE_SECTIONS,
  TX_DETAILS_HANDLER,
} from '../SpaceTransactionQueue.storyData'
import SpaceQueueTable from '.'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/SpaceQueueTable',
  component: SpaceQueueTable,
  args: { sections: QUEUE_SECTIONS, groupBy: 'safe' },
  // Ahead of the defaults, which already answer every transaction details request
  parameters: { ...setup.parameters, msw: { handlers: [TX_DETAILS_HANDLER, ...setup.handlers] } },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceQueueTable>

export default meta
type Story = StoryObj<typeof meta>

/** Safes grouped by chain: a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}

/** Grouped by status: one list, most urgent first, each row naming its Safe. */
export const ByStatus: Story = { args: { groupBy: 'status' } }

/** Grouped by network: a band per network, its Safes' transactions in nonce order. */
export const ByNetwork: Story = { args: { groupBy: 'network' } }

/** Up next: the next transaction of each Safe on each network, then the ones behind it. */
export const UpNext: Story = { args: { groupBy: 'next' } }

/**
 * Rows behind the next nonce the wallet can't act on read "Blocked by #n": Safe B #17 (fully signed) and #18 (waiting on
 * others) wait on a #16 the wallet signs, while #19, the wallet's to sign, keeps Sign. Safe A rows wait on a #1233 to
 * execute. A click scrolls up to #n and highlights it, expanding its band when collapsed.
 */
export const BlockedBy: Story = { args: { sections: BLOCKED_SECTIONS } }

/** Up next: the blocked rows sit behind it, so a click opens Next in line when it is collapsed. */
export const BlockedByUpNext: Story = { args: { sections: BLOCKED_SECTIONS, groupBy: 'next' } }

// Speed up is off in the default chain config
const speedUpChain = createChainData()
speedUpChain.features = [...speedUpChain.features, FEATURES.SPEED_UP_TX]
// Ahead of the defaults: MSW answers with the first matching handler
const speedUpChainHandlers = [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(speedUpChain)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(speedUpChain))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(speedUpChain))),
]
const executing = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
  shadcn: true,
  store: { pendingTxs: getPendingTxs(Date.now()) },
})

/**
 * Executing: Safe A #42 shows "Processing 1:22" where its button was, and the other option at #42 a disabled Sign
 * ("Available if #42 fails."). Safe A on Sepolia #12 is in a block, "Indexing". Safe B #4, sent by the story wallet
 * 5 minutes ago, offers Speed up. The counters tick, so it is kept out of the visual snapshots.
 */
export const Executing: Story = {
  args: { sections: PENDING_SECTIONS },
  parameters: {
    ...executing.parameters,
    msw: { handlers: [TX_DETAILS_HANDLER, ...speedUpChainHandlers, ...executing.handlers] },
  },
  decorators: [executing.decorator],
  tags: ['skip-visual-test'],
}
