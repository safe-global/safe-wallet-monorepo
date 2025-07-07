import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { StakingTxWithdrawCard } from './StakingTxWithdrawCard'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockInfo: NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw',
  humanDescription: null,
  value: '32000000000000000000',
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

describe('StakingTxWithdrawCard', () => {
  beforeEach(() => {
    mockOnPress.mockClear()
  })

  it('matches snapshot', () => {
    const { toJSON } = render(<StakingTxWithdrawCard info={mockInfo} onPress={mockOnPress} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const screen = render(<StakingTxWithdrawCard info={mockInfo} onPress={mockOnPress} />)
    expect(screen.getByText('Claim')).toBeTruthy()
    expect(screen.getByTestId('token-amount')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const screen = render(<StakingTxWithdrawCard info={mockInfo} onPress={mockOnPress} />)
    const card = screen.getByText('Claim')

    fireEvent.press(card)

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })
})
