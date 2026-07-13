import { render, screen } from '@/tests/test-utils'
import BalancesPage from '@/pages/balances'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { TOKEN_LISTS } from '@/store/settingsSlice'

jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: jest.fn(),
}))

jest.mock('@/components/balances/AssetsHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="assets-header" />,
}))

jest.mock('@/components/balances/AssetsTable', () => ({
  __esModule: true,
  default: () => <div data-testid="assets-table" />,
}))

jest.mock('@/components/balances/TotalAssetValue', () => ({
  __esModule: true,
  default: ({ tooltipTitle }: { tooltipTitle?: string }) => <div data-testid="total-asset-value">{tooltipTitle}</div>,
}))

jest.mock('@/components/balances/ManageTokensButton', () => ({
  __esModule: true,
  default: () => <button data-testid="manage-tokens-button">Manage tokens</button>,
}))

jest.mock('@/components/balances/CurrencySelect', () => ({
  __esModule: true,
  default: () => <button data-testid="currency-select">Currency</button>,
}))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: () => [false, jest.fn()],
}))

jest.mock('@/features/no-fee-campaign', () => ({
  NoFeeCampaignFeature: {},
  useIsNoFeeCampaignEnabled: () => false,
}))

jest.mock('@/features/portfolio', () => ({
  PortfolioFeature: {},
}))

jest.mock('@/features/stake', () => ({
  StakeFeature: {},
  useIsStakingPromoBannerVisible: () => false,
  STAKING_PROMO_BANNER_HIDE_KEY: 'hideStakingPromoBanner',
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    NoFeeCampaignBanner: () => <div data-testid="no-fee-campaign-banner" />,
    StakingPromoBanner: () => <div data-testid="staking-promo-banner" />,
    PortfolioRefreshHint: () => <div data-testid="portfolio-refresh-hint" />,
  }),
}))

const DEFAULT_SETTINGS = {
  currency: 'usd',
  hiddenTokens: {},
  tokenList: TOKEN_LISTS.TRUSTED,
  shortName: { copy: true, qr: true },
  theme: { darkMode: false },
  env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
  signing: { onChainSigning: false, blindSigning: false },
  transactionExecution: true,
  curatedNestedSafes: {},
}

describe('Balances page', () => {
  beforeEach(() => {
    jest.mocked(useVisibleBalances).mockReturnValue({
      balances: {
        items: [],
        fiatTotal: '',
      },
      loaded: true,
      loading: false,
      error: undefined,
    })
  })

  it('keeps token management controls visible when assets fail to load', () => {
    jest.mocked(useVisibleBalances).mockReturnValue({
      balances: {
        items: [],
        fiatTotal: '',
      },
      loaded: true,
      loading: false,
      error: 'There was an error loading balances',
    })

    render(<BalancesPage />)

    expect(screen.getByTestId('manage-tokens-button')).toBeInTheDocument()
    expect(screen.getByTestId('currency-select')).toBeInTheDocument()
    expect(screen.getByText('There was an error loading your assets')).toBeInTheDocument()
    expect(screen.queryByTestId('assets-table')).not.toBeInTheDocument()
  })

  const tooltipText = 'Total from this list only. Portfolio total includes positions and may use other token data.'

  const renderWithTokenList = (tokenList: TOKEN_LISTS | undefined) =>
    render(<BalancesPage />, {
      initialReduxState: { settings: { ...DEFAULT_SETTINGS, tokenList } } as never,
    })

  it('shows the total balance tooltip when all tokens are shown', () => {
    renderWithTokenList(TOKEN_LISTS.ALL)

    expect(screen.getByTestId('total-asset-value')).toHaveTextContent(tooltipText)
  })

  it('shows the total balance tooltip when the token list is unset', () => {
    renderWithTokenList(undefined)

    expect(screen.getByTestId('total-asset-value')).toHaveTextContent(tooltipText)
  })

  it('shows the total balance tooltip when only trusted tokens are shown (tooltip is informational and list-independent)', () => {
    renderWithTokenList(TOKEN_LISTS.TRUSTED)

    expect(screen.getByTestId('total-asset-value')).toHaveTextContent(tooltipText)
  })
})
