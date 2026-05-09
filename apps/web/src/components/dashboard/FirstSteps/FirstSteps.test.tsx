import { render, screen } from '@/tests/test-utils'
import * as coreFeatures from '@/features/__core__'
import * as useBalancesModule from '@/hooks/useBalances'
import * as useChains from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as hypernative from '@/features/hypernative'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { balancesBuilder, balanceBuilder } from '@/tests/builders/balances'
import FirstSteps from '.'

jest.mock('@/hooks/useBalances')
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ configs: [], loading: false, error: undefined }),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
  useChain: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/services/analytics')
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/features/hypernative', () => ({
  ...jest.requireActual('@/features/hypernative'),
  useBannerVisibility: jest.fn(),
  HnDashboardBannerWithNoBalanceCheck: () => <div data-testid="hn-banner" />,
}))

const mockUseLoadFeature = coreFeatures.useLoadFeature as jest.Mock
const mockUseBalances = useBalancesModule.default as jest.Mock
const mockUseCurrentChain = useChains.useCurrentChain as jest.Mock
const mockUseSafeInfo = useSafeInfoModule.default as jest.Mock
const mockUseBannerVisibility = hypernative.useBannerVisibility as jest.Mock

const SAFE_ADDRESS = '0x0000000000000000000000000000000000005AFE'

describe('FirstSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseLoadFeature.mockReturnValue({})

    const chain = chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build()
    mockUseCurrentChain.mockReturnValue(chain)

    mockUseBalances.mockReturnValue({
      balances: balancesBuilder().with({ items: [], fiatTotal: '0' }).build(),
      loading: false,
      loaded: true,
      error: undefined,
    })

    mockUseBannerVisibility.mockReturnValue({ showBanner: false })
  })

  const renderWithUndeployedSafe = (
    overrides: {
      deployed?: boolean
      threshold?: number
      undeployedSafeStatus?: string
      undeployedSafeAddress?: string
      chainId?: string
      hasBalance?: boolean
      hasOutgoingTxs?: boolean
    } = {},
  ) => {
    const {
      deployed = false,
      threshold = 1,
      undeployedSafeStatus = 'AWAITING_EXECUTION',
      undeployedSafeAddress = SAFE_ADDRESS,
      chainId = '1',
      hasBalance = false,
      hasOutgoingTxs = false,
    } = overrides

    const safe = extendedSafeInfoBuilder()
      .with({
        deployed,
        threshold,
        chainId,
        address: { value: undeployedSafeAddress },
      })
      .build()

    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: undeployedSafeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    if (hasBalance) {
      mockUseBalances.mockReturnValue({
        balances: balancesBuilder()
          .with({ items: [balanceBuilder().with({ balance: '1000000000000000000', fiatBalance: '1000' }).build()] })
          .build(),
        loading: false,
        loaded: true,
        error: undefined,
      })
    }

    const undeployedSafes =
      undeployedSafeStatus !== 'none'
        ? {
            [chainId]: {
              [undeployedSafeAddress]: {
                props: {
                  safeAccountConfig: { threshold, owners: [], fallbackHandler: '0x0', to: '0x0', data: '0x' },
                  saltNonce: '0',
                },
                status: { status: undeployedSafeStatus, type: 'later' as const },
              },
            },
          }
        : {}

    const txHistory = hasOutgoingTxs
      ? {
          data: {
            results: [
              {
                type: 'TRANSACTION',
                transaction: {
                  id: 'tx1',
                  txInfo: { type: 'Transfer', direction: 'OUTGOING', transferInfo: {} },
                  executionInfo: null,
                  timestamp: 0,
                  txStatus: 'SUCCESS',
                  safeAppInfo: null,
                },
                conflictType: 'None',
              },
            ],
            next: null,
            previous: null,
          },
          loading: false,
          error: undefined,
        }
      : { data: undefined, loading: false, error: undefined }

    return render(<FirstSteps />, {
      initialReduxState: {
        undeployedSafes,
        txHistory,
      } as never,
    })
  }

  it('renders nothing when safe is deployed', () => {
    const safe = extendedSafeInfoBuilder().with({ deployed: true }).build()
    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
    })

    const { container } = render(<FirstSteps />)
    expect(container.firstChild).toBeNull()
  })

  it('renders activation section for undeployed safe', () => {
    renderWithUndeployedSafe()
    expect(screen.getByTestId('activation-section')).toBeInTheDocument()
  })

  it('shows "Activate your Safe Account" heading when not activating', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText('Activate your Safe Account')).toBeInTheDocument()
  })

  it('shows steps completed count', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText(/0 of 2 steps completed/)).toBeInTheDocument()
  })

  it('shows 1 of 2 steps completed when safe has balance', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION', hasBalance: true })
    expect(screen.getByText(/1 of 2 steps completed/)).toBeInTheDocument()
  })

  it('shows "Add native assets" widget when not activating and single-sig', () => {
    renderWithUndeployedSafe({ threshold: 1, undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText('Add native assets')).toBeInTheDocument()
  })

  it('shows "Create your first transaction" widget for single-sig undeployed safe', () => {
    renderWithUndeployedSafe({ threshold: 1, undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText('Create your first transaction')).toBeInTheDocument()
  })

  it('shows "Activate account" widget for multi-sig undeployed safe', () => {
    renderWithUndeployedSafe({ threshold: 2, undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText(/Activate account/)).toBeInTheDocument()
  })

  it('shows "Account is being activated..." when status is not AWAITING_EXECUTION', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'PROCESSING' })
    expect(screen.getByText('Account is being activated...')).toBeInTheDocument()
  })

  it('shows "Transaction pending" widget while activating', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'PROCESSING' })
    expect(screen.getByText('Transaction pending')).toBeInTheDocument()
  })

  it('shows "Did you know" hints widget while activating', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'PROCESSING' })
    expect(screen.getByText('Did you know')).toBeInTheDocument()
  })

  it('shows AccountReady widget (not Hn banner) when showBanner is false', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.getByText('Safe Account is ready!')).toBeInTheDocument()
    expect(screen.queryByTestId('hn-banner')).not.toBeInTheDocument()
  })

  it('shows Hn banner instead of AccountReady when showBanner is true', () => {
    mockUseBannerVisibility.mockReturnValue({ showBanner: true })
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION' })
    expect(screen.queryByText('Safe Account is ready!')).not.toBeInTheDocument()
    expect(screen.getByTestId('hn-banner')).toBeInTheDocument()
  })

  it('shows add funds button when balance is zero and not activating', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION', hasBalance: false })
    expect(screen.getByTestId('add-funds-btn')).toBeInTheDocument()
  })

  it('does not show add funds button when safe has balance', () => {
    renderWithUndeployedSafe({ undeployedSafeStatus: 'AWAITING_EXECUTION', hasBalance: true })
    expect(screen.queryByTestId('add-funds-btn')).not.toBeInTheDocument()
  })
})
