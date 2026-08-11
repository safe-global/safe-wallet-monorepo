import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { ProtocolFiatChange } from './ProtocolFiatChange'

describe('ProtocolFiatChange', () => {
  it('renders nothing when there is no change to show', () => {
    render(<ProtocolFiatChange fiatChange={null} />)

    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('prefixes a positive change with a plus sign', () => {
    render(<ProtocolFiatChange fiatChange={0.05} />)

    expect(screen.getByText('+5.00%')).toBeTruthy()
  })

  it('prefixes a negative change with a minus sign', () => {
    render(<ProtocolFiatChange fiatChange={-0.03} />)

    expect(screen.getByText('-3.00%')).toBeTruthy()
  })

  it('renders a zero change without a sign', () => {
    render(<ProtocolFiatChange fiatChange={0} />)

    expect(screen.getByText('0.00%')).toBeTruthy()
  })
})
