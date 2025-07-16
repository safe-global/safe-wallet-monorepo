import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { StakingTxExitCard } from './StakingTxExitCard'
import { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit',
  humanDescription: null,
  status: 'ACTIVE',
  estimatedExitTime: 1234567890,
  estimatedWithdrawalTime: 1234567890,
  value: '32000000000000000000',
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

const mockOnPress = jest.fn()

describe('StakingTxExitCard', () => {
  beforeEach(() => {
    mockOnPress.mockClear()
  })

  it('matches snapshot', () => {
    const { toJSON } = render(<StakingTxExitCard info={mockInfo} onPress={mockOnPress} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const screen = render(<StakingTxExitCard info={mockInfo} onPress={mockOnPress} />)
    expect(screen.getByText('Withdraw')).toBeTruthy()
    expect(screen.getByText('1 Validator')).toBeTruthy()
  })

  it('renders multiple validators correctly', () => {
    const singleValidatorInfo = {
      ...mockInfo,
      numValidators: 3,
    }

    const screen = render(<StakingTxExitCard info={singleValidatorInfo} onPress={mockOnPress} />)
    expect(screen.getByText('Withdraw')).toBeTruthy()
    expect(screen.getByText('3 Validators')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const screen = render(<StakingTxExitCard info={mockInfo} onPress={mockOnPress} />)

    const card = screen.getByText('Withdraw')

    fireEvent.press(card)

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })
})
