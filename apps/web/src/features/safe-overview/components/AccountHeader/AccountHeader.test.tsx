import { render } from '@testing-library/react'
import AccountHeader from '.'

const mockDashboardHeader = jest.fn<null, [{ value: string }]>(() => null)
jest.mock('@/features/spaces', () => ({
  DashboardHeader: (props: { value: string }) => mockDashboardHeader(props),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: { deployed: true },
    safeLoading: false,
    safeLoaded: true,
  })),
}))

const mockUseVisibleBalances = jest.fn()
jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: () => mockUseVisibleBalances(),
}))

jest.mock('@/store', () => ({ useAppSelector: jest.fn(() => 'USD') }))
jest.mock('@/store/settingsSlice', () => ({ selectCurrency: jest.fn() }))
jest.mock('@/features/swap', () => ({ useIsSwapFeatureEnabled: jest.fn(() => false) }))
jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({ useTxBuilderApp: jest.fn(() => ({ link: {} })) }))
jest.mock('next/router', () => ({ useRouter: jest.fn(() => ({ query: {}, push: jest.fn() })) }))

describe('AccountHeader total value', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows -- when balances errored and total is empty', () => {
    mockUseVisibleBalances.mockReturnValue({
      balances: { items: [], fiatTotal: '' },
      loaded: true,
      loading: false,
      error: 'Request failed',
    })
    render(<AccountHeader />)
    expect(mockDashboardHeader).toHaveBeenCalledWith(expect.objectContaining({ value: '--' }))
  })

  it('shows $0.00 for a successful empty Safe (no error)', () => {
    mockUseVisibleBalances.mockReturnValue({
      balances: { items: [], fiatTotal: '0' },
      loaded: true,
      loading: false,
      error: undefined,
    })
    render(<AccountHeader />)
    const value = mockDashboardHeader.mock.calls[0][0].value
    expect(value).not.toBe('--')
    expect(value).toContain('0.00')
  })

  it('formats a real total on success', () => {
    mockUseVisibleBalances.mockReturnValue({
      balances: { items: [], fiatTotal: '1234.5' },
      loaded: true,
      loading: false,
      error: undefined,
    })
    render(<AccountHeader />)
    const value = mockDashboardHeader.mock.calls[0][0].value
    expect(value).not.toBe('--')
    expect(value).toContain('1,234')
  })
})
