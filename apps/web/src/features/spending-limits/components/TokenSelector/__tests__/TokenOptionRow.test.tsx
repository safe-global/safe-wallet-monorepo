import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokenOption } from '../../../utils/tokenOptions'
import TokenOptionRow from '../TokenOptionRow'

const option = (overrides: Partial<TokenOption> = {}): TokenOption => ({
  address: checksumAddress(faker.finance.ethereumAddress()),
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logoUri: faker.image.url(),
  group: 'popular',
  ...overrides,
})

describe('TokenOptionRow', () => {
  it('shows symbol and name', () => {
    render(<TokenOptionRow option={option()} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('USD Coin')).toBeInTheDocument()
  })

  it('shows the balance for held tokens, including zero', () => {
    const held = option({ group: 'held', balance: '0', decimals: 6 })

    render(<TokenOptionRow option={held} />)

    expect(screen.getByTestId('token-option-balance')).toHaveTextContent(`${formatVisualAmount('0', 6)} USDC`)
  })

  it('shows no balance for popular tokens', () => {
    render(<TokenOptionRow option={option()} />)

    expect(screen.queryByTestId('token-option-balance')).not.toBeInTheDocument()
  })

  it('degrades to the shortened address when symbol and name are missing', () => {
    const bare = option({ symbol: '', name: '' })

    render(<TokenOptionRow option={bare} />)

    expect(screen.getByText(shortenAddress(bare.address))).toBeInTheDocument()
  })

  it('shows the address as secondary text when only the symbol is known', () => {
    const symbolOnly = option({ name: '' })

    render(<TokenOptionRow option={symbolOnly} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText(shortenAddress(symbolOnly.address))).toBeInTheDocument()
  })

  it('shows the name as primary and the address as secondary when only the name is known', () => {
    const nameOnly = option({ symbol: '' })

    render(<TokenOptionRow option={nameOnly} />)

    expect(screen.getByText('USD Coin')).toBeInTheDocument()
    expect(screen.getByText(shortenAddress(nameOnly.address))).toBeInTheDocument()
  })

  it('still renders the row without a logo', () => {
    const noLogo = option({ logoUri: undefined })

    render(<TokenOptionRow option={noLogo} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByTitle('USDC')).toBeInTheDocument()
  })
})
