import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { OperationType } from '@safe-global/types-kit'
import { createMockStory } from '@/stories/mocks'
import { SAFE_ADDRESSES } from '../../../../../../../config/test/msw/fixtures'
import type { BatchTxsState, CallOnlyTxData } from '../../store/batchSlice'
import BatchSidebar from './index'

/**
 * BatchSidebar Stories
 *
 * The slide-over sheet that lists the transactions queued into a draft batch for
 * the connected Safe. It reads the batch from the Redux `batch` slice (keyed by
 * chainId + Safe address) via `useDraftBatch`, and renders one of two states:
 *
 * - Empty — the `EmptyBatch` explainer with a single "New transaction" CTA.
 * - Populated — the numbered `BatchTxList` plus "Add new transaction" and
 *   "Confirm batch" actions.
 *
 * The sheet is portalled to the document body, so it fills the preview when open.
 * Both stories connect an owner wallet so the CTAs are enabled. In Storybook the
 * per-item decoded preview (an RTK Query call) does not resolve, so populated
 * rows show their loading skeletons — the surrounding batch chrome still renders.
 */

const { address: SAFE_ADDRESS, chainId: CHAIN_ID } = SAFE_ADDRESSES.efSafe

const tx = (to: string, value: string, data = '0x'): CallOnlyTxData => ({
  to,
  value,
  data,
  operation: OperationType.Call,
})

const draftItem = (id: string, txData: CallOnlyTxData) => ({
  id,
  timestamp: Date.now(),
  txData,
})

const batchState = (...txs: CallOnlyTxData[]): BatchTxsState => ({
  [CHAIN_ID]: {
    [SAFE_ADDRESS]: txs.map((txData, index) => draftItem(`draft-${index}`, txData)),
  },
})

const baseSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const meta = {
  title: 'Features/Batching/BatchSidebar',
  component: BatchSidebar,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...baseSetup.parameters,
  },
  args: {
    isOpen: true,
    onToggle: () => {},
  },
} satisfies Meta<typeof BatchSidebar>

export default meta

type Story = StoryObj<typeof meta>

/**
 * No transactions queued yet — the sidebar shows the empty-state explainer and a
 * single "New transaction" call to action.
 */
export const Empty: Story = {
  decorators: [createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true }).decorator],
}

/**
 * A populated batch with several queued transactions. The list renders numbered
 * rows (with loading skeletons for the decoded preview) alongside the "Add new
 * transaction" and "Confirm batch" actions.
 */
export const WithTransactions: Story = {
  decorators: [
    createMockStory({
      scenario: 'efSafe',
      wallet: 'owner',
      shadcn: true,
      store: {
        batch: batchState(
          tx('0x1234567890123456789012345678901234567890', '1000000000000000000'),
          tx('0xAbCdEf0000000000000000000000000000000001', '0'),
          tx('0xAbCdEf0000000000000000000000000000000002', '500000000000000000'),
        ),
      },
    }).decorator,
  ],
}
