import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingTxExitCard } from './StakingTxExitCard'
import { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('StakingTxExitCard', () => {
  const mockInfo = {
    numValidators: 2,
    tokenInfo: {
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://example.com/eth-logo.png',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
    },
  } as NativeStakingValidatorsExitTransactionInfo

  it('renders correctly', () => {
    const { toJSON } = render(<StakingTxExitCard info={mockInfo} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with given info', () => {
    const screen = render(<StakingTxExitCard info={mockInfo} />)

    // Check that important props are passed correctly
    expect(screen.getByText('Withdraw')).toBeTruthy()
    expect(screen.getByText('2 Validators')).toBeTruthy()
    expect(screen.getByTestId('logo-image')).toBeTruthy()
  })

  it('renders singular form for one validator', () => {
    const singleValidatorInfo = {
      ...mockInfo,
      numValidators: 1,
    } as NativeStakingValidatorsExitTransactionInfo

    const screen = render(<StakingTxExitCard info={singleValidatorInfo} />)
    expect(screen.getByText('1 Validator')).toBeTruthy()
  })
})
