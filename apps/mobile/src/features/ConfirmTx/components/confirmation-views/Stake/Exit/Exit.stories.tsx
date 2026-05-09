import type { Meta, StoryObj } from '@storybook/react'
import { StakingExit } from './Exit'
import {
  NativeStakingWithdrawTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock data for NativeStakingWithdrawTransactionInfo
const mockExitInfo: NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw',
  humanDescription: 'Exit staked tokens',
  value: '32000000000000000000', // 32 ETH in wei
  tokenInfo: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    name: 'Ethereum',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x123...abc'],
}

const mockExecutionInfo: MultisigExecutionDetails = {
  type: 'MULTISIG',
  nonce: 42,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: {
    value: '0x0000000000000000000000000000000000000000',
    name: null,
    logoUri: null,
  },
  safeTxHash: '0x123abc456def',
  submittedAt: Date.now() - 3600000, // 1 hour ago
  signers: [],
  confirmationsRequired: 2,
  confirmations: [],
  rejectors: [],
  executor: null,
  gasTokenInfo: null,
  trusted: true,
}

const meta: Meta<typeof StakingExit> = {
  title: 'ConfirmTx/StakingExit',
  component: StakingExit,
  argTypes: {},
  args: {
    txInfo: mockExitInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-exit-tx-id',
  },
}

export default meta

type Story = StoryObj<typeof StakingExit>

export const Default: Story = {
  args: {
    txInfo: mockExitInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-exit-tx-id',
  },
}

export const LargeAmount: Story = {
  args: {
    txInfo: {
      ...mockExitInfo,
      value: '100000000000000000000', // 100 ETH
    },
    executionInfo: mockExecutionInfo,
    txId: 'test-exit-large-tx-id',
  },
}
