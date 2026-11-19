import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import ScopedSafeTag from './index'

const chain: ChainInfo = { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' }

describe('ScopedSafeTag', () => {
  const address = checksumAddress(faker.finance.ethereumAddress())

  it('shows the name, the shortened address and the network of a named Safe', () => {
    const name = faker.company.name()
    render(<ScopedSafeTag address={address} name={name} chain={chain} />)

    expect(screen.getByTestId('tx-flow-scoped-safe-name')).toHaveTextContent(name)
    expect(screen.getByTestId('tx-flow-scoped-safe-address')).toHaveTextContent(shortenAddress(address))
    expect(screen.getByTestId('tx-flow-scoped-safe-network')).toHaveTextContent('Polygon')
  })

  it('shows only the shortened address of a Safe with no name', () => {
    render(<ScopedSafeTag address={address} name="" chain={chain} />)

    expect(screen.queryByTestId('tx-flow-scoped-safe-name')).not.toBeInTheDocument()
    expect(screen.getByTestId('tx-flow-scoped-safe-address')).toHaveTextContent(shortenAddress(address))
  })

  it('gives the full name, address and network on hover', () => {
    const name = faker.lorem.words(20)
    render(<ScopedSafeTag address={address} name={name} chain={chain} />)

    expect(screen.getByTestId('tx-flow-scoped-safe')).toHaveAttribute('title', `${name} · ${address} on Polygon`)
  })

  it('omits the network while the chain is unknown', () => {
    render(<ScopedSafeTag address={address} name="Treasury" />)

    expect(screen.queryByTestId('tx-flow-scoped-safe-network')).not.toBeInTheDocument()
  })
})
