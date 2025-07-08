import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingDeposit } from './Deposit'
import {
  NativeStakingDepositTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockTxInfo: NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit',
  humanDescription: 'Deposit tokens for staking',
  status: 'ACTIVE',
  estimatedEntryTime: 86400000, // 1 day in milliseconds
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 32 * 86400000, // 32 days in milliseconds
  fee: 0.05, // 5% fee
  monthlyNrr: 4.2,
  annualNrr: 50.4,
  value: '32000000000000000000', // 32 ETH in wei
  numValidators: 1,
  expectedAnnualReward: '1612800000000000000',
  expectedMonthlyReward: '134400000000000000',
  expectedFiatAnnualReward: 4838.4,
  expectedFiatMonthlyReward: 403.2,
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
  submittedAt: 1234567890,
  nonce: 1,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: {
    value: '0x0000000000000000000000000000000000000000',
  },
  safeTxHash: '0x123',
  signers: [],
  confirmationsRequired: 2,
  confirmations: [],
  rejectors: [],
  trusted: true,
}

const mockProps = {
  txInfo: mockTxInfo,
  executionInfo: mockExecutionInfo,
  txId: 'test-tx-id',
}

describe('StakingDeposit', () => {
  it('renders correctly with deposit information', () => {
    const { getByText } = render(<StakingDeposit {...mockProps} />)

    expect(getByText(/32.*ETH/)).toBeTruthy()
    expect(getByText('Rewards rate')).toBeTruthy()
    expect(getByText('50.400%')).toBeTruthy()
    expect(getByText('Widget fee')).toBeTruthy()
    expect(getByText('5.00%')).toBeTruthy()
    expect(getByText('Validator')).toBeTruthy()
    expect(getByText('1')).toBeTruthy()
    expect(getByText('Activation time')).toBeTruthy()
    expect(getByText('Rewards')).toBeTruthy()
    expect(getByText('Approx. every 5 days after activation')).toBeTruthy()
  })

  it('matches snapshot', () => {
    const component = render(<StakingDeposit {...mockProps} />)
    expect(component).toMatchSnapshot()
  })
})
