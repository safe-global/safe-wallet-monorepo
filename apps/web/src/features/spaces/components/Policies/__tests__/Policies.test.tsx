import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { fireEvent, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { PROPOSER_INTRO_SEEN_KEY } from '../ProposerIntroDialog/constants'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from '../SpendingLimitIntroDialog/constants'
import useWallet from '@/hooks/wallets/useWallet'
import { asActivePolicy, mockPolicies, mockProposerPolicy } from '../mocks/policies'
import Policies from '../index'

jest.mock('@/hooks/wallets/useWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

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

const mockUseLocalStorage = jest.mocked(useLocalStorage)

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

    it('is unaffected by the proposer intro having been seen', async () => {
      mockHasSeenProposerIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))

      expect(screen.getByTestId('spending-limit-intro-dialog')).toBeInTheDocument()
    })

    it('records only its own key when dismissed', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(mockSetHasSeenSpendingLimitIntro).toHaveBeenCalledWith(true)
      expect(mockSetHasSeenProposerIntro).not.toHaveBeenCalled()
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

    it('opens the proposer intro and no other policy dialog', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
      expect(screen.getAllByRole('dialog')).toHaveLength(1)
    })
  })

  describe('the intro storage keys', () => {
    it('remembers each intro under its own key', () => {
      render(<Policies />)

      const keys = mockUseLocalStorage.mock.calls.map(([key]) => key)

      expect(keys).toContain(SPENDING_LIMIT_INTRO_SEEN_KEY)
      expect(keys).toContain(PROPOSER_INTRO_SEEN_KEY)
      expect(SPENDING_LIMIT_INTRO_SEEN_KEY).not.toBe(PROPOSER_INTRO_SEEN_KEY)
    })

    it('scopes the keys to the browser, not to a Safe or a chain', () => {
      render(<Policies />)

      for (const [key] of mockUseLocalStorage.mock.calls) {
        expect(key).not.toMatch(/0x[a-fA-F0-9]/)
        expect(key).not.toMatch(/\d+:/)
      }
    })
  })

  it('opens no intro for the policies that have no flow yet', async () => {
    const { user } = renderWithUserEvent(<Policies />)

    await user.click(screen.getByTestId('policy-catalogue-tile-suggestion'))

    expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument()
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
