import { render, screen } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useBalances from '@/hooks/useBalances'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import useSpendingLimits from '../../public/hooks/useSpendingLimits'
import SpendingLimitsSettings from './index'

const mockUsePlanGate = jest.fn()
jest.mock('@/features/spaces/public/hooks/usePlanGate', () => ({
  usePlanGate: (...args: unknown[]) => mockUsePlanGate(...args),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('../../hooks/useIsSpendingLimitSupported', () => ({ __esModule: true, default: () => true }))
jest.mock('../../public/hooks/useSpendingLimits')
jest.mock('@/hooks/useBalances')

const gate = (mustUpgradeToSafePro: boolean, isLoading = false, showProTag = false) => ({
  mustUpgradeToSafePro,
  isLoading,
  showProTag,
  upgradeHref: '/spaces/plans',
})

describe('SpendingLimitsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePlanGate.mockReturnValue(gate(false))
    jest.mocked(useSpendingLimits).mockReturnValue({ spendingLimits: [], loading: false })
    jest.mocked(useBalances).mockReturnValue({ balances: { fiatTotal: '0', items: [] }, loaded: true, loading: false })
  })

  it('offers a new spending limit while the plan gate is open', () => {
    render(<SpendingLimitsSettings />)

    expect(mockUsePlanGate).toHaveBeenCalledWith(FEATURES.SPENDING_LIMIT_GATING)
    expect(screen.getByTestId('new-spending-limit')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-pro-lock')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pro-tag')).not.toBeInTheDocument()
  })

  it('marks the button with the Pro tag when the plan gate asks for it', () => {
    mockUsePlanGate.mockReturnValue(gate(false, false, true))

    render(<SpendingLimitsSettings />)

    expect(screen.getByTestId('new-spending-limit')).toContainElement(screen.getByTestId('pro-tag'))
  })

  it('replaces the button with the Safe Pro lock while the plan gate blocks it', () => {
    mockUsePlanGate.mockReturnValue(gate(true))

    render(<SpendingLimitsSettings />)

    expect(screen.queryByTestId('new-spending-limit')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-pro-lock')).toHaveTextContent('Adding spending limits requires Safe Pro')
    expect(screen.getByTestId('safe-pro-lock')).toHaveTextContent('Existing ones stay active.')
    expect(screen.getByRole('link', { name: 'Explore Safe Pro' })).toHaveAttribute('href', '/spaces/plans')
  })

  it('renders neither the button nor the lock while the plan gate is loading', () => {
    mockUsePlanGate.mockReturnValue(gate(false, true))

    render(<SpendingLimitsSettings />)

    expect(screen.queryByTestId('new-spending-limit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-pro-lock')).not.toBeInTheDocument()
  })

  it('shows the token logo from the balances for a limit read from the chain', () => {
    const token = erc20TokenBuilder().build()
    const spendingLimit = spendingLimitStateBuilder().build()
    jest.mocked(useSpendingLimits).mockReturnValue({
      spendingLimits: [{ ...spendingLimit, token: { address: token.address, symbol: token.symbol, decimals: 18 } }],
      loading: false,
    })
    jest.mocked(useBalances).mockReturnValue({
      balances: { fiatTotal: '0', items: [balanceBuilder().with({ tokenInfo: token }).build()] },
      loaded: true,
      loading: false,
    })

    render(<SpendingLimitsSettings />)

    expect(screen.getAllByTitle(token.symbol)[0]).toHaveAttribute('srcdoc', expect.stringContaining(token.logoUri))
  })
})
