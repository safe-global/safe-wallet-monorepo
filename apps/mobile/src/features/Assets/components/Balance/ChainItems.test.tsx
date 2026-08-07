import React from 'react'
import { render } from '@/src/tests/test-utils'
import { ChainItems } from './ChainItems'
import { createMockChain } from '@safe-global/test'

describe('ChainItems', () => {
  const chain = createMockChain({ chainId: '1', chainName: 'Ethereum' })

  it('does not crash and still renders the chain when activeChain is undefined', () => {
    // Regression: a missing chains config left activeChain undefined and threw at `activeChain.chainId`.
    const { getByText } = render(
      <ChainItems chainId="1" chains={[chain]} activeChain={undefined} fiatTotal="$100" onSelect={jest.fn()} />,
    )

    expect(getByText('Ethereum')).toBeTruthy()
  })

  it('renders the chain when activeChain matches', () => {
    const { getByText } = render(
      <ChainItems chainId="1" chains={[chain]} activeChain={chain} fiatTotal="$100" onSelect={jest.fn()} />,
    )

    expect(getByText('Ethereum')).toBeTruthy()
  })

  it('renders nothing when the chain is not in the list', () => {
    const { queryByText } = render(
      <ChainItems chainId="999" chains={[chain]} activeChain={chain} fiatTotal="$100" onSelect={jest.fn()} />,
    )

    expect(queryByText('Ethereum')).toBeNull()
  })
})
