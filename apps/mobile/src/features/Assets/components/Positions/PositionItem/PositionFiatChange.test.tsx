import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { PositionFiatChange } from './PositionFiatChange'

describe('PositionFiatChange', () => {
  const defaultProps = {
    fiatBalance: '1000',
    currency: 'usd',
  }

  it('renders 0% when fiatBalance24hChange is null', () => {
    render(<PositionFiatChange {...defaultProps} fiatBalance24hChange={null} />)

    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('renders 0% instead of a NaN percentage and amount when fiatBalance24hChange is not numeric', () => {
    render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="not-a-number" />)

    expect(screen.getByText('0%')).toBeTruthy()
    expect(screen.queryByText(/NaN/)).toBeNull()
  })

  it('keeps the percentage but drops the amount when fiatBalance is not numeric', () => {
    render(<PositionFiatChange fiatBalance="not-a-number" currency="usd" fiatBalance24hChange="5.0" />)

    expect(screen.getByText(/5\.00%/)).toBeTruthy()
    expect(screen.queryByText(/NaN/)).toBeNull()
  })

  it('renders a genuine zero change as 0.00%', () => {
    render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="0" />)

    expect(screen.getByText(/0\.00%/)).toBeTruthy()
  })

  it('renders positive change with plus sign', () => {
    const { toJSON } = render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="5.0" />)

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders negative change with minus sign', () => {
    const { toJSON } = render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="-3.5" />)

    expect(toJSON()).toMatchSnapshot()
  })
})
