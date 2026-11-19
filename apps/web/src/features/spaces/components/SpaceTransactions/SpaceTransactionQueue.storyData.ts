import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import type { SpaceQueueSection } from '../../hooks/useSpaceQueue'

export const SPACE_QUEUE_URL = /\/v1\/spaces\/[^/]+\/transactions\/queued/

const SAFE_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const SAFE_B = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const RECIPIENT = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const TIMESTAMP = 1_767_225_600_000

const transfer = (
  id: string,
  nonce: number,
  confirmations: number,
  status = TransactionStatus.AWAITING_CONFIRMATIONS,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
  recipient: { value: string; name?: string } = { value: RECIPIENT, name: 'Treasury' },
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
      recipient,
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

const UNNAMED = { value: '0xa2130cA1aB1F8A8A1B0E2a8F0C2D5e1b3c4d379f' }
const AWAITING = TransactionStatus.AWAITING_CONFIRMATIONS

/** The same unnamed address in rows of two Safes, beside a named one, for the add-to-address-book action */
export const UNNAMED_COUNTERPARTY_SECTIONS: SpaceQueueSection[] = [
  {
    safeAddress: SAFE_A,
    chains: [
      {
        chainId: '1',
        items: [
          { type: TransactionListItemType.LABEL, label: 'Next' },
          transfer('a-1-56', 56, 2, TransactionStatus.AWAITING_EXECUTION, 'None', UNNAMED),
          { type: TransactionListItemType.LABEL, label: 'Queued' },
          transfer('a-1-57', 57, 1, AWAITING, 'None', UNNAMED),
          transfer('a-1-58', 58, 0),
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
          transfer('b-1-4', 4, 1, AWAITING, 'None', UNNAMED),
        ],
      },
    ],
  },
]

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
