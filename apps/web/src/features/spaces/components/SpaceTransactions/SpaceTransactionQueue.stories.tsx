import type { Meta, StoryObj } from '@storybook/react'
import { delay, http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import { createMockStory } from '@/stories/mocks'
import SpaceTransactionQueue from './SpaceTransactionQueue'

const SPACE_ID = '1'
const SAFE_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const SAFE_B = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const RECIPIENT = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const TIMESTAMP = 1_767_225_600_000

const transfer = (safeAddress: string, nonce: number, confirmations: number): TransactionQueuedItem => ({
  type: TransactionListItemType.TRANSACTION,
  conflictType: 'None',
  transaction: {
    id: `multisig_${safeAddress}_${nonce}`,
    timestamp: TIMESTAMP,
    txStatus: confirmations < 2 ? TransactionStatus.AWAITING_CONFIRMATIONS : TransactionStatus.AWAITING_EXECUTION,
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      sender: { value: safeAddress },
      recipient: { value: RECIPIENT, name: 'Treasury' },
      direction: TransferDirection.OUTGOING,
      transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
    },
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce,
      confirmationsRequired: 2,
      confirmationsSubmitted: confirmations,
      missingSigners: confirmations < 2 ? [{ value: RECIPIENT }] : [],
    },
    txHash: null,
  } as TransactionQueuedItem['transaction'],
})

const page = (results: SpaceQueuedItemPage['results'], count: number): SpaceQueuedItemPage => ({
  count,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: {
    total: count,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
})

const CAPPED_RESULTS: SpaceQueuedItemPage['results'] = {
  [SAFE_A]: {
    '1': [
      { type: TransactionListItemType.LABEL, label: 'Next' },
      transfer(SAFE_A, 56, 2),
      { type: TransactionListItemType.LABEL, label: 'Queued' },
      transfer(SAFE_A, 57, 1),
    ],
  },
  [SAFE_B]: { '1': [{ type: TransactionListItemType.LABEL, label: 'Next' }, transfer(SAFE_B, 4, 1)] },
}

const QUEUE_URL = /\/v1\/spaces\/[^/]+\/transactions\/queued/

const storyWith = (handler: ReturnType<typeof http.get>): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    authenticated: true,
    layout: 'paper',
    shadcn: true,
    handlers: [handler],
  })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
}

const meta = {
  title: 'Features/Spaces/Transactions/SpaceTransactionQueue',
  component: SpaceTransactionQueue,
  args: { spaceId: SPACE_ID },
} satisfies Meta<typeof SpaceTransactionQueue>

export default meta
type Story = StoryObj<typeof meta>

/** No Safe of the Workspace has a pending transaction. */
export const Empty: Story = storyWith(http.get(QUEUE_URL, () => HttpResponse.json(page({}, 0))))

/** The first queue never arrives, so the pulsing skeleton rows stay on screen. */
export const Loading: Story = {
  ...storyWith(
    http.get(QUEUE_URL, async () => {
      await delay('infinite')
      return HttpResponse.json(page({}, 0))
    }),
  ),
  tags: ['skip-visual-test'],
}

/** The gateway read only part of the queue: the note above the table says how much is shown. */
export const Capped: Story = storyWith(http.get(QUEUE_URL, () => HttpResponse.json(page(CAPPED_RESULTS, 742))))
