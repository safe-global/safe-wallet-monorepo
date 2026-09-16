import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import Policies from '../index'

let mockHasSeenSpendingLimitIntro: boolean | undefined = false
let mockHasSeenProposerIntro: boolean | undefined = false
const mockSetHasSeenSpendingLimitIntro = jest.fn()
const mockSetHasSeenProposerIntro = jest.fn()

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn((key: string) =>
    key === 'proposerIntroSeen'
      ? [mockHasSeenProposerIntro, mockSetHasSeenProposerIntro]
      : [mockHasSeenSpendingLimitIntro, mockSetHasSeenSpendingLimitIntro],
  ),
}))

/**
 * The page must render a title, a one-line description and a `Learn more` link to documentation,
 * with the copy exactly as designed. The description's onchain framing is deliberate even though a
 * Proposer grant is off-chain — a product decision, not an oversight.
 */
describe('Policies', () => {
  beforeEach(() => {
    mockHasSeenSpendingLimitIntro = false
    mockHasSeenProposerIntro = false
    jest.clearAllMocks()
  })

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
  describe('the spending limit intro', () => {
    it('explains a spending limit before the flow starts', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))

      expect(screen.getByTestId('spending-limit-intro-dialog')).toBeInTheDocument()
    })

    it('returns to the catalogue with nothing started when dismissed', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      await waitFor(() => expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument())
      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    })

    it('records that it has been shown', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(mockSetHasSeenSpendingLimitIntro).toHaveBeenCalledWith(true)
    })

    it('does not explain again once it has been shown', async () => {
      mockHasSeenSpendingLimitIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))

      expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument()
    })
  })

  describe('the proposer intro', () => {
    it('explains the proposer role before the flow starts', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
    })

    it('returns to the catalogue with nothing started when dismissed', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      await waitFor(() => expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument())
      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    })

    it('records that it has been shown', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(mockSetHasSeenProposerIntro).toHaveBeenCalledWith(true)
      expect(mockSetHasSeenSpendingLimitIntro).not.toHaveBeenCalled()
    })

    it('does not explain again once it has been shown', async () => {
      mockHasSeenProposerIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
    })

    it('is unaffected by the spending limit intro having been seen', async () => {
      mockHasSeenSpendingLimitIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
    })
  })

  it('opens no intro for the policies that have no flow yet', async () => {
    const { user } = renderWithUserEvent(<Policies />)

    await user.click(screen.getByTestId('policy-catalogue-tile-suggestion'))

    expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument()
  })
})
