import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { fireEvent, render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { REQUEST_POLICY_FORM_HEIGHT, REQUEST_POLICY_FORM_URL, REQUEST_POLICY_FORM_WIDTH } from '../constants'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { PROPOSER_INTRO_SEEN_KEY } from '../ProposerIntroDialog/constants'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from '../SpendingLimitIntroDialog/constants'
import useWallet from '@/hooks/wallets/useWallet'
import { asActivePolicy, mockPolicies, mockProposerPolicy } from '../mocks/policies'
import ProposerRoleFlow from '../ProposerRoleFlow'
import Policies from '../index'
import SpendingLimitFlow from '../SpendingLimitFlow'

jest.mock('@/hooks/wallets/useWallet')

jest.mock('../ProposerRoleFlow', () => ({
  __esModule: true,
  default: () => <div data-testid="proposer-role-flow" />,
}))

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

// The flow pulls in the protocol-kit initialiser; the page test only needs the flow's identity.
jest.mock('../../../hooks/useSpaceSafeOverviews', () => ({
  useSpaceSafeOverviews: () => ({ ownedByChain: {}, isOwnershipResolved: true }),
}))

jest.mock('../SpendingLimitFlow', () => ({
  __esModule: true,
  default: () => <div data-testid="spending-limit-flow" />,
}))

const mockUseLocalStorage = jest.mocked(useLocalStorage)

const renderWithTxModal = () => {
  const setTxFlow = jest.fn()
  const utils = renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <Policies />
    </TxModalContext.Provider>,
  )
  return { ...utils, setTxFlow }
}

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

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
    })

    it('returns to the catalogue with nothing started when dismissed', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      await waitFor(() => expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument())
      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    })

    it('records that it has been shown', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))
      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(mockSetHasSeenProposerIntro).toHaveBeenCalledWith(true)
      expect(mockSetHasSeenSpendingLimitIntro).not.toHaveBeenCalled()
    })

    it('does not explain again once it has been shown', async () => {
      mockHasSeenProposerIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

      expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
    })

    it('is unaffected by the spending limit intro having been seen', async () => {
      mockHasSeenSpendingLimitIntro = true
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
    })

    it('opens the proposer intro and no other policy dialog', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

      expect(screen.getByTestId('proposer-intro-dialog')).toBeInTheDocument()
      expect(screen.getAllByRole('dialog')).toHaveLength(1)
    })

    it('opens the proposer flow from the intro', async () => {
      const { user, setTxFlow } = renderWithTxModal()

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))
      await user.click(await screen.findByRole('button', { name: 'Set up proposer' }))

      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0].type).toBe(ProposerRoleFlow)
      await waitFor(() => expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument())
    })

    it('opens the flow directly once the intro has been seen', async () => {
      mockHasSeenProposerIntro = true
      const { user, setTxFlow } = renderWithTxModal()

      await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0].type).toBe(ProposerRoleFlow)
      expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
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

  describe('the Something missing? tile', () => {
    const originalOpen = window.open
    const mockOpen = jest.fn()

    beforeEach(() => {
      window.open = mockOpen
    })

    afterAll(() => {
      window.open = originalOpen
    })

    it('opens the request-policy form in a popup window', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(within(screen.getByTestId('policy-catalogue-tile-suggestion')).getByRole('button'))

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(mockOpen.mock.calls[0][0]).toBe(REQUEST_POLICY_FORM_URL)
      expect(mockOpen.mock.calls[0][1]).toBe('_blank')

      const features = mockOpen.mock.calls[0][2]
      expect(features).toContain('popup=yes')
      expect(features).toContain(`width=${REQUEST_POLICY_FORM_WIDTH}`)
      expect(features).toContain(`height=${REQUEST_POLICY_FORM_HEIGHT}`)
      expect(features).toContain('noopener,noreferrer')
    })

    it('centres the popup over the current window', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(within(screen.getByTestId('policy-catalogue-tile-suggestion')).getByRole('button'))

      const expectedLeft = window.screenX + (window.outerWidth - REQUEST_POLICY_FORM_WIDTH) / 2
      const expectedTop = window.screenY + (window.outerHeight - REQUEST_POLICY_FORM_HEIGHT) / 2
      expect(mockOpen.mock.calls[0][2]).toContain(`left=${Math.round(expectedLeft)},top=${Math.round(expectedTop)}`)
    })

    it('opens no intro dialog', async () => {
      const { user } = renderWithUserEvent(<Policies />)

      await user.click(within(screen.getByTestId('policy-catalogue-tile-suggestion')).getByRole('button'))

      expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
      expect(screen.queryByTestId('spending-limit-intro-dialog')).not.toBeInTheDocument()
    })
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

      render(<Policies policies={mockPolicies()} />)

      expect(screen.getByTestId('policies-list')).toBeInTheDocument()
      expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(mockPolicies().length)
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

    it('should, when the policies are still loading, render the heading and the loading state only', () => {
      render(<Policies policies={[]} isLoading />)

      expect(screen.getByRole('heading', { name: 'Policies' })).toBeInTheDocument()
      expect(screen.getByTestId('policies-loading')).toHaveTextContent('Almost there…')
      expect(screen.queryByText(/Policies are rules that help you/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
      expect(screen.queryByTestId('policies-list')).not.toBeInTheDocument()
    })

    it('should, when the policies failed to load, render the error state instead of the catalogue or the list', () => {
      render(<Policies policies={mockPolicies()} isError />)

      expect(screen.getByRole('alert')).toHaveTextContent('The website failed to load data. Please try again.')
      expect(screen.queryByText(/Policies are rules that help you/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
      expect(screen.queryByTestId('policies-list')).not.toBeInTheDocument()
    })

    it('should, when Reload is clicked in the error state, ask the caller to reload', () => {
      const onRetry = jest.fn()

      render(<Policies policies={[]} isError onRetry={onRetry} />)
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should, when the policies failed to load and there is no reload handler, render no Reload button', () => {
      render(<Policies policies={[]} isError />)

      expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument()
    })

    it('should, when Add policy is clicked and no handler is given, open the add policy dialog', async () => {
      const { user } = renderWithUserEvent(<Policies policies={mockPolicies()} />)

      await user.click(screen.getByTestId('add-policy-button'))

      expect(screen.getByTestId('add-policy-dialog')).toBeInTheDocument()
      expect(screen.queryByTestId('proposer-intro-dialog')).not.toBeInTheDocument()
    })

    it('should, when Add policy is clicked and a handler is given, call it instead of opening the dialog', async () => {
      const onAddPolicy = jest.fn()
      const { user } = renderWithUserEvent(<Policies policies={mockPolicies()} onAddPolicy={onAddPolicy} />)

      await user.click(screen.getByTestId('add-policy-button'))

      expect(onAddPolicy).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('add-policy-dialog')).not.toBeInTheDocument()
    })

    it('should, when the proposer is picked in the add policy dialog, close it and start the proposer flow', async () => {
      mockHasSeenProposerIntro = true
      const setTxFlow = jest.fn()
      const { user } = renderWithUserEvent(
        <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
          <Policies policies={mockPolicies()} />
        </TxModalContext.Provider>,
      )

      await user.click(screen.getByTestId('add-policy-button'))
      await user.click(screen.getByTestId('add-policy-option-proposer'))

      await waitFor(() => expect(screen.queryByTestId('add-policy-dialog')).not.toBeInTheDocument())
      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0].type).toBe(ProposerRoleFlow)
    })

    it('should, when the proposer is picked before its intro was seen, show the intro first', async () => {
      const { user } = renderWithUserEvent(<Policies policies={mockPolicies()} />)

      await user.click(screen.getByTestId('add-policy-button'))
      await user.click(screen.getByTestId('add-policy-option-proposer'))

      expect(await screen.findByTestId('proposer-intro-dialog')).toBeInTheDocument()
      expect(screen.queryByTestId('add-policy-dialog')).not.toBeInTheDocument()
    })

    it('should, when a spending limit is picked in the add policy dialog, start the spending limit flow', async () => {
      mockHasSeenSpendingLimitIntro = true
      const setTxFlow = jest.fn()
      const { user } = renderWithUserEvent(
        <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
          <Policies policies={mockPolicies()} />
        </TxModalContext.Provider>,
      )

      await user.click(screen.getByTestId('add-policy-button'))
      await user.click(screen.getByTestId('add-policy-option-spending-limit'))

      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0]).toMatchObject({ type: SpendingLimitFlow })
    })

    it('should, when a proposer row is clicked and no handler is given, open the proposer drawer', () => {
      const proposerPolicy = asActivePolicy(mockProposerPolicy())

      render(<Policies policies={[proposerPolicy]} />)
      fireEvent.click(screen.getByRole('button', { name: 'Open Proposer for 0x8675...a19b' }))

      expect(screen.getByText('Proposer role')).toBeInTheDocument()
    })

    it('should, when a table row is clicked, report the policy it belongs to', () => {
      const onSelectPolicy = jest.fn()
      const proposerPolicy = asActivePolicy(mockProposerPolicy())

      render(<Policies policies={[proposerPolicy]} onSelectPolicy={onSelectPolicy} />)
      fireEvent.click(screen.getByRole('button', { name: 'Open Proposer for 0x8675...a19b' }))

      expect(onSelectPolicy).toHaveBeenCalledWith(proposerPolicy)
    })
  })

  describe('starting the spending limit flow', () => {
    const renderWithTxModal = () => {
      const setTxFlow = jest.fn()
      const value: TxModalContextType = { txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }
      const utils = renderWithUserEvent(
        <TxModalContext.Provider value={value}>
          <Policies />
        </TxModalContext.Provider>,
      )
      return { ...utils, setTxFlow }
    }

    it('opens the flow when the intro is confirmed', async () => {
      const { user, setTxFlow } = renderWithTxModal()

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))
      await user.click(screen.getByRole('button', { name: 'Set up spending limit' }))

      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0]).toMatchObject({ type: SpendingLimitFlow })
    })

    it('opens the flow straight from the tile once the intro has been shown', async () => {
      mockHasSeenSpendingLimitIntro = true
      const { user, setTxFlow } = renderWithTxModal()

      await user.click(screen.getByRole('button', { name: /Spending limit/ }))

      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow.mock.calls[0][0]).toMatchObject({ type: SpendingLimitFlow })
    })
  })
})
