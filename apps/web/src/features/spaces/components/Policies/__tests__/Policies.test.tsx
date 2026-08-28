import { fireEvent, render, screen } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import useWallet from '@/hooks/wallets/useWallet'
import { asActivePolicy, mockPolicies, mockProposerPolicy } from '../mocks/policies'
import Policies from '../index'

jest.mock('@/hooks/wallets/useWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

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

  /**
   * Reviewing what governs a workspace's Safes requires no signing capability, so the page is
   * readable without a connected wallet. This is what makes the page usable by someone auditing
   * the workspace rather than operating it.
   */
  describe('without a connected wallet', () => {
    it('should, when no wallet is connected and the space has no policies, render the catalogue', () => {
      mockUseWallet.mockReturnValue(null)

      render(<Policies />)

      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    })

    it('should, when no wallet is connected and the space has policies, render the whole table', () => {
      mockUseWallet.mockReturnValue(null)
      const policies = mockPolicies()

      render(<Policies policies={policies} />)

      expect(screen.getByTestId('policies-list')).toBeInTheDocument()
      expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(policies.length)
      expect(screen.getByPlaceholderText('by name, address or network')).toBeInTheDocument()
    })
  })

  describe('populated mode', () => {
    it('should, when the space has policies, render the list instead of the catalogue', () => {
      render(<Policies policies={mockPolicies()} />)

      expect(screen.getByTestId('policies-list')).toBeInTheDocument()
      expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
    })

    it('should, when the last policy is revoked, render the catalogue again', () => {
      const { rerender } = render(<Policies policies={mockPolicies()} />)
      rerender(<Policies policies={[]} />)

      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
      expect(screen.queryByTestId('policies-list')).not.toBeInTheDocument()
    })

    it('should, when the policies are still loading, render the list rather than the catalogue', () => {
      render(<Policies policies={[]} isLoading />)

      expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
    })

    it('should, when a table row is clicked, report the policy it belongs to', () => {
      const onSelectPolicy = jest.fn()
      const proposerPolicy = asActivePolicy(mockProposerPolicy())

      render(<Policies policies={[proposerPolicy]} onSelectPolicy={onSelectPolicy} />)
      fireEvent.click(screen.getByRole('button', { name: 'Open proposer policy details' }))

      expect(onSelectPolicy).toHaveBeenCalledWith(proposerPolicy)
    })
  })
})
