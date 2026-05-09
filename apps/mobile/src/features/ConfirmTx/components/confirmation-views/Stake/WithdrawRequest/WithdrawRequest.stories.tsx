import type { Meta, StoryObj } from '@storybook/react'
import { StakingWithdrawRequest } from './WithdrawRequest'
import {
  NativeStakingValidatorsExitTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock data for NativeStakingValidatorsExitTransactionInfo
const mockWithdrawRequestInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit',
  humanDescription: 'Request withdrawal of staked tokens',
  status: 'ACTIVE',
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 2 * 86400000, // 2 days in milliseconds
  value: '32000000000000000000', // 32 ETH in wei
  numValidators: 1,
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

const meta: Meta<typeof StakingWithdrawRequest> = {
  title: 'ConfirmTx/StakingWithdrawRequest',
  component: StakingWithdrawRequest,
  argTypes: {},
  args: {
    txInfo: mockWithdrawRequestInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-withdraw-request-tx-id',
  },
}

export default meta

type Story = StoryObj<typeof StakingWithdrawRequest>

export const Default: Story = {
  args: {
    txInfo: mockWithdrawRequestInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-withdraw-request-tx-id',
  },
}

export const MultipleValidators: Story = {
  args: {
    txInfo: {
      ...mockWithdrawRequestInfo,
      numValidators: 5,
      value: '160000000000000000000', // 160 ETH for 5 validators
    },
    executionInfo: mockExecutionInfo,
    txId: 'test-withdraw-request-multi-tx-id',
  },
}
