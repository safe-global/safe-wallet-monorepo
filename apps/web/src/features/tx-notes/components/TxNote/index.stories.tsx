import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { withMockProvider } from '@/storybook/preview'
import { safeFixtures } from '../../../../../../../config/test/msw/fixtures'
import TxNote from './index'

const safeData = safeFixtures.efSafe

// TxNote renders the note attached to a transaction, with a tooltip crediting
// the proposer. It renders nothing when the details carry no note.
const createTxDetails = (note: string): TransactionDetails => ({
  safeAddress: safeData.address.value,
  txId: 'multisig_0x9fC3_0xnote1',
  executedAt: null,
  txStatus: 'AWAITING_CONFIRMATIONS',
  txHash: null,
  safeAppInfo: null,
  note,
  txInfo: {
    type: 'Transfer',
    humanDescription: null,
    sender: { value: safeData.address.value, name: null, logoUri: null },
    recipient: { value: '0x1234567890123456789012345678901234567890', name: 'vitalik.eth', logoUri: null },
    direction: 'OUTGOING',
    transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000' },
  },
  txData: null,
  detailedExecutionInfo: {
    type: 'MULTISIG',
    submittedAt: 1750000000000,
    nonce: 42,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    fee: '0',
    payment: '0',
    refundReceiver: { value: '0x0000000000000000000000000000000000000000', name: null, logoUri: null },
    safeTxHash: `0x${'11'.repeat(32)}`,
    executor: null,
    signers: safeData.owners,
    confirmationsRequired: safeData.threshold,
    confirmations: [],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: safeData.owners[0],
    proposedByDelegate: null,
  },
})

const meta = {
  title: 'Features/TxNotes/TxNote',
  component: TxNote,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true, withPaper: true })],
} satisfies Meta<typeof TxNote>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txDetails: createTxDetails('Monthly contributor payroll, batch 2 of 3'),
  },
}

export const LongNote: Story = {
  args: {
    txDetails: createTxDetails('Rebalancing treasury: moving stables to the yield vault after DAO vote #128'),
  },
}
