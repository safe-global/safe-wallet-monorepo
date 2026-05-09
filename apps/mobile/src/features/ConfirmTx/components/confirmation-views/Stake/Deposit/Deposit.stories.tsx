import type { Meta, StoryObj } from '@storybook/react'
import { StakingDeposit } from './Deposit'
import {
  NativeStakingDepositTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock data for NativeStakingDepositTransactionInfo
const mockStakingDepositInfo: NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit',
  humanDescription: 'Deposit ETH for staking',
  status: 'ACTIVE',
  estimatedEntryTime: 86400000, // 1 day in milliseconds
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 32 * 86400000, // 32 days in milliseconds
  fee: 0.0127, // 1.27% fee
  monthlyNrr: 4.2, // 4.2% monthly return
  annualNrr: 5.04, // 5.04% annual return
  value: '32000000000000000000', // 32 ETH in wei
  numValidators: 1,
  expectedAnnualReward: '1612800000000000000', // ~1.6 ETH
  expectedMonthlyReward: '134400000000000000', // ~0.13 ETH
  expectedFiatAnnualReward: 4838.4, // ~$4,838 assuming 1 ETH = $3000
  expectedFiatMonthlyReward: 403.2, // ~$403
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
  signers: [
    {
      value: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Alice',
      logoUri: null,
    },
    {
      value: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'Bob',
      logoUri: null,
    },
  ],
  confirmationsRequired: 2,
  confirmations: [
    {
      signer: {
        value: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Alice',
        logoUri: null,
      },
      signature: null,
      submittedAt: Date.now() - 3600000,
    },
  ],
  rejectors: [],
  executor: null,
  gasTokenInfo: null,
  trusted: true,
}

const meta: Meta<typeof StakingDeposit> = {
  title: 'ConfirmTx/StakingDeposit',
  component: StakingDeposit,
  argTypes: {},
  args: {
    txInfo: mockStakingDepositInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-staking-tx-id',
  },
}

export default meta

type Story = StoryObj<typeof StakingDeposit>

export const Default: Story = {
  args: {
    txInfo: mockStakingDepositInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-staking-tx-id',
  },
}

export const MultipleValidators: Story = {
  args: {
    txInfo: {
      ...mockStakingDepositInfo,
      numValidators: 3,
      value: '96000000000000000000', // 96 ETH for 3 validators
    },
    executionInfo: mockExecutionInfo,
    txId: 'test-staking-tx-multi',
  },
}
