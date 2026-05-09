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

  it('renders positive change with plus sign', () => {
    const { toJSON } = render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="5.0" />)

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders negative change with minus sign', () => {
    const { toJSON } = render(<PositionFiatChange {...defaultProps} fiatBalance24hChange="-3.5" />)

    expect(toJSON()).toMatchSnapshot()
  })
})
