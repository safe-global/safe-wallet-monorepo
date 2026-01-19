import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { PositionsEmpty } from './PositionsEmpty'

describe('PositionsEmpty', () => {
  it('renders empty state message', () => {
    render(<PositionsEmpty />)

    expect(screen.getByText('No positions yet')).toBeTruthy()
  })

  it('renders description text', () => {
    render(<PositionsEmpty />)

    expect(screen.getByText(/DeFi positions will appear here/i)).toBeTruthy()
  })
})
