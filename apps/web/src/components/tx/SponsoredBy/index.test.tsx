import { render, screen } from '@/tests/test-utils'
import chains from '@safe-global/utils/config/chains'
import SponsoredBy from './index'

describe('SponsoredBy', () => {
  it('names the chain sponsor for the daily relays', () => {
    render(<SponsoredBy option="FREE_DAILY_LIMIT" chainId={chains.gno} />)

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Gnosis')
    expect(screen.getByText('Gnosis')).toBeInTheDocument()
  })

  it('falls back to Safe for the daily relays on a chain without its own sponsor', () => {
    render(<SponsoredBy option="FREE_DAILY_LIMIT" chainId={chains.eth} />)

    expect(screen.getByText('Safe')).toBeInTheDocument()
  })

  it('names Safe for the subscription, whatever the chain', () => {
    render(<SponsoredBy option="SUBSCRIPTION" chainId={chains.gno} />)

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Safe')
    expect(screen.getByText('Safe')).toBeInTheDocument()
  })
})
