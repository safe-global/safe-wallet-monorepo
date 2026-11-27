import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import { http, HttpResponse } from 'msw'
import { getFixtureData } from '@/stories/mocks/handlers'
import { PendingStatus, PendingTxType, type PendingTxsState } from '@/store/pendingTxsSlice'
import type { SpaceQueueSection } from '../../hooks/useSpaceQueue'

export const SPACE_QUEUE_URL = /\/v1\/spaces\/[^/]+\/transactions\/queued/

const SAFE_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const SAFE_B = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const RECIPIENT = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const TIMESTAMP = 1_767_225_600_000
// The story wallet last: it never signs, so rows still missing a signature are its to sign
const STORY_WALLET = getFixtureData('efSafe').safeData.owners[0]
const OWNERS = [
  { value: '0x1F2a3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C', name: 'Ana' },
  { value: '0x2A3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C5D', name: 'Max' },
  { value: RECIPIENT, name: 'Treasury' },
  STORY_WALLET,
]

const transfer = (
  id: string,
  nonce: number,
  confirmations: number,
  status = TransactionStatus.AWAITING_CONFIRMATIONS,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
): TransactionQueuedItem => ({
  type: TransactionListItemType.TRANSACTION,
  conflictType,
  transaction: {
    id,
    timestamp: TIMESTAMP,
    txStatus: status,
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      sender: { value: SAFE_A },
      recipient: { value: RECIPIENT, name: 'Treasury' },
      direction: TransferDirection.OUTGOING,
      transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
    },
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce,
      confirmationsRequired: 2,
      confirmationsSubmitted: confirmations,
      missingSigners: confirmations < 2 ? [{ value: RECIPIENT }, { value: STORY_WALLET.value }] : [],
    },
    txHash: null,
  } as TransactionQueuedItem['transaction'],
})

export const QUEUE_SECTIONS: SpaceQueueSection[] = [
  {
    safeAddress: SAFE_A,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('a-1-56', 56, 2, TransactionStatus.AWAITING_EXECUTION),
          { type: TransactionListItemType.LABEL, label: 'Queued' },
          { type: TransactionListItemType.CONFLICT_HEADER, nonce: 57 },
          transfer('a-1-57a', 57, 1, TransactionStatus.AWAITING_CONFIRMATIONS, 'HasNext'),
          transfer('a-1-57b', 57, 0, TransactionStatus.AWAITING_CONFIRMATIONS, 'End'),
        ],
      },
      {
        chainId: '11155111',
        items: [{ type: TransactionListItemType.LABEL, label: 'Next' }, transfer('a-11155111-12', 12, 1)],
      },
    ],
  },
  {
    safeAddress: SAFE_B,
    chains: [
      {
        chainId: '1',
        items: [{ type: TransactionListItemType.LABEL, label: 'Next' }, transfer('b-1-4', 4, 1)],
      },
    ],
  },
]

// Still missing a signature, but not the story wallet's
const waitingOnOthers = (item: TransactionQueuedItem): TransactionQueuedItem => ({
  ...item,
  transaction: {
    ...item.transaction,
    executionInfo: { ...item.transaction.executionInfo, missingSigners: [{ value: RECIPIENT }] },
  } as TransactionQueuedItem['transaction'],
})

/** Rows behind the next nonce the wallet can't act on: Safe A waits on a #1233 to execute, Safe B on a #16 the story wallet signs */
export const BLOCKED_SECTIONS: SpaceQueueSection[] = [
  {
    safeAddress: SAFE_B,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('b-1-16', 16, 1),
          { type: TransactionListItemType.LABEL, label: 'Queued' },
          transfer('b-1-17', 17, 2, TransactionStatus.AWAITING_EXECUTION),
          waitingOnOthers(transfer('b-1-18', 18, 1)),
          transfer('b-1-19', 19, 1),
        ],
      },
    ],
  },
  {
    safeAddress: SAFE_A,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('a-1-1233', 1233, 2, TransactionStatus.AWAITING_EXECUTION),
          { type: TransactionListItemType.LABEL, label: 'Queued' },
          ...Array.from({ length: 24 }, (_, index) =>
            transfer(`a-1-${1234 + index}`, 1234 + index, 2, TransactionStatus.AWAITING_EXECUTION),
          ),
        ],
      },
    ],
  },
]

/** Executing: Safe A #42 and its other option, Safe A on Sepolia indexing, Safe B #4 slow enough to speed up */
export const PENDING_SECTIONS: SpaceQueueSection[] = [
  {
    safeAddress: SAFE_A,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          { type: TransactionListItemType.CONFLICT_HEADER, nonce: 42 },
          transfer('p-1-42a', 42, 2, TransactionStatus.AWAITING_EXECUTION, 'HasNext'),
          transfer('p-1-42b', 42, 1, TransactionStatus.AWAITING_CONFIRMATIONS, 'End'),
        ],
      },
      {
        chainId: '11155111',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('p-11155111-12', 12, 2, TransactionStatus.AWAITING_EXECUTION),
        ],
      },
    ],
  },
  {
    safeAddress: SAFE_B,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('p-b-1-4', 4, 2, TransactionStatus.AWAITING_EXECUTION),
        ],
      },
    ],
  },
]

/** What this browser is executing in PENDING_SECTIONS, relative to `now` so the counters start where described */
export const getPendingTxs = (now: number): PendingTxsState => ({
  'p-1-42a': {
    chainId: '1',
    safeAddress: SAFE_A,
    nonce: 42,
    status: PendingStatus.PROCESSING,
    txType: PendingTxType.SAFE_TX,
    txHash: `0x${'1'.repeat(64)}`,
    submittedAt: now - 82_000,
    signerNonce: 3,
    // Another signer executed it, so the story wallet can't speed it up
    signerAddress: RECIPIENT,
  },
  'p-11155111-12': { chainId: '11155111', safeAddress: SAFE_A, nonce: 12, status: PendingStatus.INDEXING },
  'p-b-1-4': {
    chainId: '1',
    safeAddress: SAFE_B,
    nonce: 4,
    status: PendingStatus.PROCESSING,
    txType: PendingTxType.SAFE_TX,
    txHash: `0x${'2'.repeat(64)}`,
    submittedAt: now - 5 * 60_000,
    signerNonce: 7,
    signerAddress: STORY_WALLET.value,
    gasLimit: '150000',
  },
})

const countTransactions = (sections: SpaceQueueSection[]): number =>
  sections
    .flatMap((section) => section.chains.flatMap((chain) => chain.items))
    .filter((item) => item.type === TransactionListItemType.TRANSACTION).length

/** The gateway's answer for these sections, with every count at zero but the total */
export const toQueuePage = (sections: SpaceQueueSection[]): SpaceQueuedItemPage => {
  const total = countTransactions(sections)
  return {
    count: total,
    next: null,
    previous: null,
    results: Object.fromEntries(
      sections.map(({ safeAddress, chains }) => [
        safeAddress,
        Object.fromEntries(chains.map(({ chainId, items }) => [chainId, items])),
      ]),
    ),
    unavailableSafes: [],
    counts: {
      total,
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
  }
}

/** The details behind each queued transaction, signed by as many owners as its summary counts */
export const TX_DETAILS_HANDLER = http.get(/\/v1\/chains\/[^/]+\/transactions\/([^/]+)$/, ({ request }) => {
  const id = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  const item = [...QUEUE_SECTIONS, ...BLOCKED_SECTIONS, ...PENDING_SECTIONS]
    .flatMap(({ chains }) => chains.flatMap(({ items }) => items))
    .find(
      (entry): entry is TransactionQueuedItem =>
        entry.type === TransactionListItemType.TRANSACTION && entry.transaction.id === id,
    )
  const executionInfo = item?.transaction.executionInfo
  if (!item || executionInfo?.type !== DetailedExecutionInfoType.MULTISIG)
    return new HttpResponse(null, { status: 404 })
  return HttpResponse.json({
    txId: id,
    txStatus: item.transaction.txStatus,
    txInfo: item.transaction.txInfo,
    detailedExecutionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: executionInfo.nonce,
      signers: OWNERS,
      confirmationsRequired: executionInfo.confirmationsRequired,
      confirmations: OWNERS.slice(0, executionInfo.confirmationsSubmitted).map((signer) => ({
        signer,
        signature: '0x',
        submittedAt: TIMESTAMP,
      })),
    },
  })
})
