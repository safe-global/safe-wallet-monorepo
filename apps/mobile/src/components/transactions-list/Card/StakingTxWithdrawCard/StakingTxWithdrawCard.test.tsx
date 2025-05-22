import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingTxWithdrawCard } from './StakingTxWithdrawCard'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('StakingTxWithdrawCard', () => {
  const mockInfo = {
    value: '1000000000000000000',
    tokenInfo: {
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://example.com/eth-logo.png',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
    },
  } as NativeStakingWithdrawTransactionInfo

  it('renders correctly', () => {
    const { toJSON } = render(<StakingTxWithdrawCard info={mockInfo} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with given info', () => {
    const screen = render(<StakingTxWithdrawCard info={mockInfo} />)

    // Check that important props are passed correctly
    expect(screen.getByText('Claim')).toBeTruthy()
    expect(screen.getByTestId('token-amount')).toHaveTextContent('1 ETH')
    expect(screen.getByTestId('logo-image')).toBeTruthy()
  })
})
