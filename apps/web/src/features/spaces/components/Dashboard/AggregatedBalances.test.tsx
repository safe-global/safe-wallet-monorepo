import { render } from '@testing-library/react'
import AggregatedBalance from './AggregatedBalances'
import type { SafeItem } from '@/hooks/safes'

const mockDashboardHeader = jest.fn<null, [{ value: string; error?: boolean }]>(() => null)
jest.mock('./DashboardHeader', () => ({
  DashboardHeader: (props: { value: string }) => mockDashboardHeader(props),
}))

const mockUseQuery = jest.fn()
jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: () => mockUseQuery(),
}))

jest.mock('@/store', () => ({ useAppSelector: jest.fn(() => 'USD') }))
jest.mock('@/store/settingsSlice', () => ({ selectCurrency: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useChain: jest.fn(() => ({ shortName: 'eth' })) }))
jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({ useTxBuilderApp: jest.fn(() => ({ link: {} })) }))
jest.mock('@/components/tx-flow', () => ({
  TxModalContext: jest.requireActual('react').createContext({ setTxFlow: jest.fn() }),
}))
jest.mock('@/components/tx-flow/flows', () => ({ TokenTransferFlow: () => null }))
jest.mock('@/components/common/QrCodeButton/QrModal', () => ({ __esModule: true, default: () => null }))
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ query: {}, pathname: '/', push: jest.fn(), replace: jest.fn() })),
}))

const safeItems: SafeItem[] = [
  { chainId: '1', address: '0xSafe1', isReadOnly: false, isPinned: false, lastVisited: 0, name: 'S1' },
]

describe('AggregatedBalance total value', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows -- when safes were requested but the settled response is empty (all fetches dropped)', () => {
    // The overview query returns { data: [] } even when every safe's fetch failed (Promise.allSettled),
    // so an empty array with requested safes means the balances couldn't be fetched.
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })
    render(<AggregatedBalance safeItems={safeItems} />)
    expect(mockDashboardHeader).toHaveBeenCalledWith(expect.objectContaining({ value: '--', error: true }))
  })

  it('shows a formatted total on success', () => {
    mockUseQuery.mockReturnValue({
      data: [{ fiatTotal: '1000' }, { fiatTotal: '234.5' }],
      isLoading: false,
    })
    render(<AggregatedBalance safeItems={safeItems} />)
    const value = mockDashboardHeader.mock.calls[0][0].value
    expect(value).not.toBe('--')
    expect(value).toContain('1,234')
  })

  it('shows $0.00 (not --) for an empty workspace with no safes', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })
    render(<AggregatedBalance safeItems={[]} />)
    const value = mockDashboardHeader.mock.calls[0][0].value
    expect(value).not.toBe('--')
    expect(value).toContain('0.00')
  })
})
