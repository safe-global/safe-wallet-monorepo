import { render } from '@testing-library/react'
import Overview from './Overview'

const mockTotalAssetValue = jest.fn<null, [{ fiatTotal: string | number | undefined; error?: boolean }]>(() => null)
jest.mock('@/components/balances/TotalAssetValue', () => ({
  __esModule: true,
  default: (props: { fiatTotal: string | number | undefined; error?: boolean }) => mockTotalAssetValue(props),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({ safe: { deployed: true }, safeLoading: false, safeLoaded: true })),
}))

const mockUseVisibleBalances = jest.fn()
jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: () => mockUseVisibleBalances(),
}))

jest.mock('@/features/portfolio', () => ({ PortfolioFeature: 'PortfolioFeature' }))
jest.mock('@/features/actions-tray', () => ({ ActionsTrayFeature: 'ActionsTrayFeature' }))
jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(() => ({
    $isDisabled: true,
    PortfolioRefreshHint: () => null,
    ActionsTray: () => null,
  })),
}))

describe('Overview total balance', () => {
  beforeEach(() => jest.clearAllMocks())

  it('passes error to TotalAssetValue when balances errored and total is empty', () => {
    mockUseVisibleBalances.mockReturnValue({
      balances: { items: [], fiatTotal: '' },
      loaded: true,
      loading: false,
      error: 'Request failed',
    })
    render(<Overview />)
    expect(mockTotalAssetValue).toHaveBeenCalledWith(expect.objectContaining({ error: true }))
  })

  it('does not set error for a successful empty Safe', () => {
    mockUseVisibleBalances.mockReturnValue({
      balances: { items: [], fiatTotal: '0' },
      loaded: true,
      loading: false,
      error: undefined,
    })
    render(<Overview />)
    expect(mockTotalAssetValue).toHaveBeenCalledWith(expect.objectContaining({ error: false }))
  })
})
