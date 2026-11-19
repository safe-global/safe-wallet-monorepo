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

    const tag = screen.getByTestId('tx-flow-scoped-safe')
    expect(screen.getByTestId('tx-flow-scoped-safe-name')).toHaveTextContent(name)
    expect(tag).toHaveTextContent(shortenAddress(address))
    expect(tag).toHaveTextContent('Polygon')
  })

  it('shows only the shortened address of a Safe with no name', () => {
    render(<ScopedSafeTag address={address} name="" chain={chain} />)

    expect(screen.queryByTestId('tx-flow-scoped-safe-name')).not.toBeInTheDocument()
    expect(screen.getByTestId('tx-flow-scoped-safe')).toHaveTextContent(shortenAddress(address))
  })

  it('keeps a long name on one line and gives the full name and address on hover', () => {
    const name = faker.lorem.words(20)
    render(<ScopedSafeTag address={address} name={name} chain={chain} />)

    expect(screen.getByTestId('tx-flow-scoped-safe-name')).toHaveClass('truncate')
    expect(screen.getByTestId('tx-flow-scoped-safe')).toHaveAttribute('title', `${name} · ${address} on Polygon`)
  })

  it('omits the network while the chain is unknown', () => {
    render(<ScopedSafeTag address={address} name="Treasury" />)

    expect(screen.getByTestId('tx-flow-scoped-safe')).not.toHaveTextContent('Polygon')
  })
})
