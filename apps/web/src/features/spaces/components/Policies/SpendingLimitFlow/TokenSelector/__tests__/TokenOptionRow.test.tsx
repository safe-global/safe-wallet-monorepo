import { render, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokenOption } from '../../utils/tokenOptions'
import TokenOptionRow from '../TokenOptionRow'
import { tokenOptionBuilder } from '../../utils/tokenOptions.fixtures'

const option = (overrides: Partial<TokenOption> = {}): TokenOption =>
  tokenOptionBuilder()
    .with({ symbol: 'USDC', name: 'USD Coin', decimals: 6, ...overrides })
    .build()

describe('TokenOptionRow', () => {
  it('shows symbol and name', () => {
    render(<TokenOptionRow option={option()} />)

    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('USD Coin')).toBeInTheDocument()
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
    // The symbol is also the truncation tooltip, so name the icon element rather than matching on title alone.
    expect(screen.getAllByTitle('USDC').find((el) => el.tagName === 'IFRAME')).toBeInTheDocument()
  })

  it('carries the full text as a tooltip so a truncated row can still be read', () => {
    render(<TokenOptionRow option={option()} />)

    expect(screen.getByText('USD Coin')).toHaveAttribute('title', 'USD Coin')
  })
})
