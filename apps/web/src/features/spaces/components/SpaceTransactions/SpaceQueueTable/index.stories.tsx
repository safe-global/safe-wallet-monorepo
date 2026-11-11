import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import { createMockStory } from '@/stories/mocks'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import SpaceQueueTable from '.'

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
      missingSigners: confirmations < 2 ? [{ value: RECIPIENT }] : [],
    },
    txHash: null,
  } as TransactionQueuedItem['transaction'],
})

const SECTIONS: SpaceQueueSection[] = [
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

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/SpaceQueueTable',
  component: SpaceQueueTable,
  args: { sections: SECTIONS },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceQueueTable>

export default meta
type Story = StoryObj<typeof meta>

/** Safes grouped by chain: a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}
