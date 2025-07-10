import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingTxDepositCard } from './StakingTxDepositCard'
import { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('StakingTxDepositCard', () => {
  const mockOnPress = jest.fn()

  const mockInfo = {
    value: '1000000000000000000',
    tokenInfo: {
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://example.com/eth-logo.png',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
      trusted: true,
    },
    type: 'NativeStakingDeposit',
    humanDescription: 'Deposit tokens for staking',
    status: 'ACTIVE',
    estimatedEntryTime: Date.now() + 86400000,
    estimatedExitTime: Date.now() + 30 * 86400000,
    estimatedWithdrawalTime: Date.now() + 32 * 86400000,
    fee: 5,
    monthlyNrr: 4.2,
    annualNrr: 50.4,
    numValidators: 1,
    expectedAnnualReward: '50400000000000000',
    expectedMonthlyReward: '4200000000000000',
    expectedFiatAnnualReward: 151.2,
    expectedFiatMonthlyReward: 12.6,
    validators: ['0xvalidator1'],
  } as NativeStakingDepositTransactionInfo

  it('renders correctly', () => {
    const { toJSON } = render(<StakingTxDepositCard info={mockInfo} onPress={mockOnPress} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with given info', () => {
    const screen = render(<StakingTxDepositCard info={mockInfo} onPress={mockOnPress} />)

    // Check that important props are passed correctly
    expect(screen.getByText('Deposit')).toBeTruthy()
    expect(screen.getByText('1 ETH')).toBeTruthy()
    expect(screen.getByTestId('logo-image')).toBeTruthy()
  })
})
