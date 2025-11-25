import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import ManageTokensButton from '../index'
import * as analytics from '@/services/analytics'
import * as store from '@/store'
import * as useChains from '@/hooks/useChains'
import * as useChainId from '@/hooks/useChainId'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  ASSETS_EVENTS: {
    OPEN_TOKEN_LIST_MENU: { action: 'Open token list menu', category: 'assets' },
    SHOW_ALL_TOKENS: { action: 'Show all tokens', category: 'assets' },
    SHOW_DEFAULT_TOKENS: { action: 'Show default tokens', category: 'assets' },
    SHOW_HIDDEN_ASSETS: { action: 'Show hidden assets', category: 'assets' },
  },
}))

describe('ManageTokensButton', () => {
  const mockDispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChainId, 'default').mockReturnValue('1')
    jest.spyOn(store, 'useAppDispatch').mockReturnValue(mockDispatch)
    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          tokenList: TOKEN_LISTS.TRUSTED,
          hideDust: true,
          hiddenTokens: {},
        },
        chains: {
          data: [{ chainId: '1', features: [FEATURES.DEFAULT_TOKENLIST] }],
        },
        safeInfo: {
          data: { chainId: '1' },
          loading: false,
          loaded: true,
        },
      } as any),
    )

    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.DEFAULT_TOKENLIST) return true
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) return false
      return false
    })
  })

  it('should render the button with correct text', () => {
    render(<ManageTokensButton />)

    expect(screen.getByTestId('manage-tokens-button')).toBeInTheDocument()
    expect(screen.getByText('Manage tokens')).toBeInTheDocument()
  })

  it('should open menu on click', async () => {
    render(<ManageTokensButton />)

    const button = screen.getByTestId('manage-tokens-button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Show all tokens')).toBeInTheDocument()
    })
  })

  it('should track analytics event on click', async () => {
    render(<ManageTokensButton />)

    const button = screen.getByTestId('manage-tokens-button')
    fireEvent.click(button)

    expect(analytics.trackEvent).toHaveBeenCalledWith(analytics.ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)
  })

  it('should show "Hide tokens" option in menu', async () => {
    render(<ManageTokensButton />)

    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Hide tokens')).toBeInTheDocument()
    })
  })

  it('should call onHideTokens callback when Hide tokens is clicked', async () => {
    const onHideTokens = jest.fn()
    render(<ManageTokensButton onHideTokens={onHideTokens} />)

    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Hide tokens')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Hide tokens'))

    expect(onHideTokens).toHaveBeenCalled()
  })

  it('should show hidden tokens count when tokens are hidden', async () => {
    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          tokenList: TOKEN_LISTS.TRUSTED,
          hideDust: true,
          hiddenTokens: { '1': ['0x123', '0x456', '0x789'] },
        },
        chains: {
          data: [{ chainId: '1', features: [FEATURES.DEFAULT_TOKENLIST] }],
        },
        safeInfo: {
          data: { chainId: '1' },
          loading: false,
          loaded: true,
        },
      } as any),
    )

    render(<ManageTokensButton />)
    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Hide tokens (3)')).toBeInTheDocument()
    })
  })

  it('should show "Hide small balances" option when portfolio endpoint is enabled', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.DEFAULT_TOKENLIST) return true
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) return true
      return false
    })

    render(<ManageTokensButton />)
    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Hide small balances')).toBeInTheDocument()
    })
  })

  it('should not show "Hide small balances" when portfolio endpoint is disabled', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.DEFAULT_TOKENLIST) return true
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) return false
      return false
    })

    render(<ManageTokensButton />)
    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Show all tokens')).toBeInTheDocument()
      expect(screen.queryByText('Hide small balances')).not.toBeInTheDocument()
    })
  })

  it('should dispatch setTokenList when toggling show all tokens', async () => {
    render(<ManageTokensButton />)
    fireEvent.click(screen.getByTestId('manage-tokens-button'))

    await waitFor(() => {
      expect(screen.getByText('Show all tokens')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Show all tokens'))

    expect(mockDispatch).toHaveBeenCalled()
  })
})
