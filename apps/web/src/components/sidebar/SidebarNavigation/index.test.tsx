import { render, screen } from '@/tests/test-utils'
import Navigation from './index'

const mockUseIsRequireLoginEnabled = jest.fn()

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: () => mockUseIsRequireLoginEnabled(),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, pathname: '/home', query: {} }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { deployed: true } }),
}))

jest.mock('@/hooks/useTxQueue', () => ({
  useQueuedTxsLength: () => 0,
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1', features: [] }),
}))

describe('SidebarNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the Address book link when require-login is disabled (REQUIRE_LOGIN_DISABLED enabled)', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(false)

    render(<Navigation />)

    expect(screen.getByText('Address book')).toBeInTheDocument()
  })

  it('hides the Address book link by default (require-login enabled)', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)

    render(<Navigation />)

    expect(screen.queryByText('Address book')).not.toBeInTheDocument()
  })

  it('hides the Address book link while the require-login flag is still loading', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(undefined)

    render(<Navigation />)

    expect(screen.queryByText('Address book')).not.toBeInTheDocument()
  })

  it('keeps other nav items visible regardless of the require-login flag', () => {
    mockUseIsRequireLoginEnabled.mockReturnValue(true)

    render(<Navigation />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Assets')).toBeInTheDocument()
  })
})
