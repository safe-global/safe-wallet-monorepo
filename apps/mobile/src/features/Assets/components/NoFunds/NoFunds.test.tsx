import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { NoFunds } from './NoFunds'

describe('NoFunds', () => {
  it('renders the empty token component', () => {
    render(<NoFunds fundsType={'token'} />)

    // Check for the main elements
    expect(screen.getByText('Top up your balance')).toBeTruthy()
    expect(
      screen.getByText('Send funds to your Safe Account from another wallet by copying your address.'),
    ).toBeTruthy()
  })

  it('renders the EmptyToken component', () => {
    render(<NoFunds fundsType={'token'} />)

    // Check if EmptyToken is rendered by looking for its container
    expect(screen.getByTestId('empty-token')).toBeTruthy()
  })

  it('renders the empty NFT component', () => {
    render(<NoFunds fundsType={'nft'} />)

    // Check for the main elements
    expect(screen.getByText('No NFTs')).toBeTruthy()
    expect(screen.getByText('This account has no NFTs yet.')).toBeTruthy()
  })
})
