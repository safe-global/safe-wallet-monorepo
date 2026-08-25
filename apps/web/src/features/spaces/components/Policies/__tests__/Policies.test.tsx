import { render, screen } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Policies from '../index'

/**
 * The page must render a title, a one-line description and a `Learn more` link to documentation,
 * with the copy exactly as designed. The description's onchain framing is deliberate even though a
 * Proposer grant is off-chain — a product decision, not an oversight.
 */
describe('Policies', () => {
  it('renders the page title', () => {
    render(<Policies />)

    expect(screen.getByRole('heading', { name: 'Policies' })).toBeInTheDocument()
  })

  it('renders the description as designed', () => {
    render(<Policies />)

    expect(
      screen.getByText(
        /Policies are rules that help you manage your Safe accounts\. Set them up once and they will run onchain, automatically\./,
      ),
    ).toBeInTheDocument()
  })

  it('links Learn more to the policies documentation', () => {
    render(<Policies />)

    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', HelpCenterArticle.POLICIES)
  })

  // Mirrors the `Learn more` link in the Proposers section of Safe settings
  // (components/settings/ProposersList) — bold, with the external-link icon.
  it('styles Learn more like the Proposers section', () => {
    render(<Policies />)

    const link = screen.getByRole('link', { name: 'Learn more' })

    expect(link.querySelector('.external-link-icon')).toBeInTheDocument()
    expect(link).toHaveClass('font-bold', 'hover:text-muted-foreground')
  })

  it('renders the policy catalogue', () => {
    render(<Policies />)

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Proposer')).toBeInTheDocument()
    expect(screen.getByText('Account recovery')).toBeInTheDocument()
    expect(screen.getByText('Something missing?')).toBeInTheDocument()
  })

  it('renders the catalogue only, with no table, create button or search', () => {
    render(<Policies />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create policy/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
