import React from 'react'
import { render } from '@/src/tests/test-utils'
import { FiatChange } from '../FiatChange'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

describe('FiatChange', () => {
  it('renders "n/a" when fiatBalance24hChange is not present', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: undefined,
    } as Balance

    const { getByText } = render(<FiatChange balanceItem={mockBalance} />)
    expect(getByText('0%')).toBeTruthy()
  })

  it('renders positive change with success color and plus sign', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '5.00', // 5% increase
    } as Balance

    const { getByText } = render(<FiatChange balanceItem={mockBalance} />)

    expect(getByText('+5.00%')).toBeTruthy()
  })

  it('renders negative change with error color and minus sign', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '-3.00', // 3% decrease
    } as Balance

    const { getByText } = render(<FiatChange balanceItem={mockBalance} />)

    expect(getByText('-3.00%')).toBeTruthy()
  })

  it('renders zero change with default styling', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '0',
    } as Balance

    const { getByText } = render(<FiatChange balanceItem={mockBalance} />)

    expect(getByText('0.00%')).toBeTruthy()
  })

  it('renders up to 2 decimal places', () => {
    const mockBalance: Balance = {
      fiatBalance24hChange: '1.23456789', // Should be formatted to 2 decimal places
    } as Balance

    const { getByText } = render(<FiatChange balanceItem={mockBalance} />)

    expect(getByText('+1.23%')).toBeTruthy()
  })
})
