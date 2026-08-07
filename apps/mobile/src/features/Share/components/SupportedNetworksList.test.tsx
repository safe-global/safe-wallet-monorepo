import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SupportedNetworksList } from './SupportedNetworksList'

const chain = (chainId: string, chainName: string, isTestnet: boolean): Chain =>
  ({ chainId, chainName, isTestnet, chainLogoUri: null }) as unknown as Chain

describe('SupportedNetworksList', () => {
  it('lists mainnets and testnets split by a Testnets divider', () => {
    const chains = [
      chain('1', 'Ethereum', false),
      chain('42161', 'Arbitrum', false),
      chain('11155111', 'Sepolia', true),
    ]
    const { getByText } = render(<SupportedNetworksList chains={chains} />)

    expect(getByText('Ethereum')).toBeTruthy()
    expect(getByText('Arbitrum')).toBeTruthy()
    expect(getByText('Sepolia')).toBeTruthy()
    expect(getByText('Testnets')).toBeTruthy()
  })

  it('omits the Testnets divider when there are no testnets', () => {
    const chains = [chain('1', 'Ethereum', false)]
    const { queryByText } = render(<SupportedNetworksList chains={chains} />)

    expect(queryByText('Testnets')).toBeNull()
  })
})
