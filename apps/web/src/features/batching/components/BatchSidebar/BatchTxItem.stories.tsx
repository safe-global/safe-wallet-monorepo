import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { MultiSend, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OperationType } from '@safe-global/types-kit'
import { createMockStory } from '@/stories/mocks'
import type { CallOnlyTxData } from '../../store/batchSlice'
import BatchTxItem from './BatchTxItem'

const RECIPIENT = '0x1234567890123456789012345678901234567890'
const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001'

// A decoded ERC-20 `transfer(address,uint256)` call, as the batch item would receive it.
const transferTxData: CallOnlyTxData = {
  to: TOKEN_ADDRESS,
  value: '0',
  data: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000016345785d8a0000',
  operation: OperationType.Call,
}

const transferTxDecoded: MultiSend = {
  operation: 0,
  to: TOKEN_ADDRESS,
  value: '0',
  data: transferTxData.data,
  dataDecoded: {
    method: 'transfer',
    parameters: [
      { name: 'to', type: 'address', value: RECIPIENT },
      { name: 'value', type: 'uint256', value: '100000000000000000' },
    ],
  },
}

// A decoded contract interaction against a named contract.
const contractTxData: CallOnlyTxData = {
  to: CONTRACT_ADDRESS,
  value: '0',
  data: '0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000',
  operation: OperationType.Call,
}

const contractTxDecoded: MultiSend = {
  operation: 0,
  to: CONTRACT_ADDRESS,
  value: '0',
  data: contractTxData.data,
  dataDecoded: {
    method: 'swapExactTokensForTokens',
    parameters: [{ name: 'amountIn', type: 'uint256', value: '100000000000000000' }],
  },
}

const addressInfoIndex: TransactionData['addressInfoIndex'] = {
  [CONTRACT_ADDRESS]: { value: CONTRACT_ADDRESS, name: 'Uniswap V2 Router' },
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const meta = {
  title: 'Features/Batching/BatchTxItem',
  component: BatchTxItem,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof BatchTxItem>

export default meta

type Story = StoryObj<typeof meta>

/**
 * A decoded ERC-20 transfer, numbered as the first item in a batch, with a
 * delete action wired up (deleting prompts a confirm dialog before firing
 * `onDelete`).
 */
export const TokenTransfer: Story = {
  args: {
    id: 'tx-1',
    timestamp: Date.now(),
    count: 1,
    txData: transferTxData,
    txDecoded: transferTxDecoded,
    addressInfoIndex: {},
    tokenInfoIndex: {},
    onDelete: (id: string) => alert(`Delete ${id}`),
  },
}

/**
 * A decoded contract interaction whose target address resolves to a known
 * label via `addressInfoIndex`, shown as a later item in the batch.
 */
export const NamedContractInteraction: Story = {
  args: {
    id: 'tx-2',
    timestamp: Date.now(),
    count: 3,
    txData: contractTxData,
    txDecoded: contractTxDecoded,
    addressInfoIndex,
    tokenInfoIndex: {},
    onDelete: (id: string) => alert(`Delete ${id}`),
  },
}

/**
 * While the transaction is still being decoded, `txDecoded` is undefined and
 * the item renders a skeleton placeholder in place of the accordion.
 */
export const Loading: Story = {
  args: {
    id: 'tx-3',
    timestamp: Date.now(),
    count: 2,
    txData: transferTxData,
    txDecoded: undefined,
    addressInfoIndex: {},
    tokenInfoIndex: {},
  },
}
