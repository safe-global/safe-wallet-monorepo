import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingDeposit } from './Stake'
import {
  NativeStakingDepositTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('StakingDeposit', () => {
  const mockTxInfo: NativeStakingDepositTransactionInfo = {
    type: 'NativeStakingDeposit',
    humanDescription: 'Deposit tokens for staking',
    status: 'ACTIVE',
    estimatedEntryTime: 86400000, // 1 day in milliseconds
    estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
    estimatedWithdrawalTime: 32 * 86400000, // 32 days in milliseconds
    fee: 0.05, // 5% fee
    monthlyNrr: 4.2, // 4.2% monthly return
    annualNrr: 50.4, // 50.4% annual return
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
    nonce: 1,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: null,
      logoUri: null,
    },
    safeTxHash: '0x123',
    submittedAt: 1672531200000, // Fixed timestamp: 2023-01-01 00:00:00 UTC
    signers: [
      {
        value: '0x123',
        name: null,
        logoUri: null,
      },
    ],
    confirmationsRequired: 1,
    confirmations: [],
    rejectors: [],
    executor: null,
    gasTokenInfo: null,
    trusted: true,
  }

  const mockProps = {
    txInfo: mockTxInfo,
    executionInfo: mockExecutionInfo,
    txId: 'test-tx-id',
  }

  it('renders correctly with staking deposit information', () => {
    const { getByText } = render(<StakingDeposit {...mockProps} />)

    expect(getByText(/32.*ETH/)).toBeTruthy() // TokenAmount renders as "32 ETH"
    expect(getByText('50.400%')).toBeTruthy() // Rewards rate
    expect(getByText('5.00%')).toBeTruthy() // Widget fee
    expect(getByText('Validator')).toBeTruthy() // Validator label
    expect(getByText('1')).toBeTruthy() // Validator count
  })

  it('renders validator information correctly', () => {
    const { getByText } = render(<StakingDeposit {...mockProps} />)

    expect(getByText('Validator')).toBeTruthy()
    expect(getByText('1')).toBeTruthy() // Validator count
    expect(getByText(/Earn ETH rewards with dedicated validators/)).toBeTruthy()
  })

  it('renders activation time information', () => {
    const { getByText } = render(<StakingDeposit {...mockProps} />)

    expect(getByText('Activation time')).toBeTruthy()
    expect(getByText('Approx. every 5 days after activation')).toBeTruthy()
  })

  it('renders multiple validators correctly', () => {
    const multiValidatorProps = {
      ...mockProps,
      txInfo: {
        ...mockTxInfo,
        numValidators: 3,
      },
    }

    const { getByText } = render(<StakingDeposit {...multiValidatorProps} />)

    expect(getByText('Validator')).toBeTruthy()
    expect(getByText('3')).toBeTruthy() // Multiple validator count
  })

  it('matches snapshot', () => {
    const { toJSON } = render(<StakingDeposit {...mockProps} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
