import { renderHook } from '@/tests/test-utils'
import useSpaceAccountsData from '../useSpaceAccountsData'
import type { SafeItem, AllSafeItems } from '@/hooks/safes'
import * as gatewayApi from '@/store/api/gateway'

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}))

const makeSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0xSafeAddress',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

const mockOverviewQuery = (value: Partial<ReturnType<typeof gatewayApi.useGetMultipleSafeOverviewsQuery>>) =>
  jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({
    data: undefined,
    isFetching: false,
    error: undefined,
    refetch: jest.fn(),
    ...value,
  } as never)

describe('useSpaceAccountsData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOverviewQuery({})
  })

  it('skips the overview query when there are no safes', () => {
    const spy = mockOverviewQuery({})

    renderHook(() => useSpaceAccountsData([]))

    // skipToken is passed so RTK Query issues no request.
    expect(spy).toHaveBeenCalledWith(expect.anything())
    // The arg is the skipToken symbol, not a query object.
    expect(typeof spy.mock.calls[0][0]).toBe('symbol')
  })

  it('queries overviews for the flattened safes', () => {
    const spy = mockOverviewQuery({})
    const safes: AllSafeItems = [makeSafeItem()]

    renderHook(() => useSpaceAccountsData(safes))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        safes: [expect.objectContaining({ chainId: '1', address: '0xSafeAddress' })],
        walletAddress: '0x1234567890123456789012345678901234567890',
      }),
    )
  })

  it('exposes the query loading state', () => {
    mockOverviewQuery({ isFetching: true })

    const { result } = renderHook(() => useSpaceAccountsData([makeSafeItem()]))

    expect(result.current.isLoading).toBe(true)
  })

  it('maps a query error to a readable message and exposes refetch', () => {
    const refetch = jest.fn()
    mockOverviewQuery({ error: { status: 500, data: 'boom' } as never, refetch })

    const { result } = renderHook(() => useSpaceAccountsData([makeSafeItem()]))

    expect(result.current.error).toBeTruthy()
    result.current.refetch()
    expect(refetch).toHaveBeenCalled()
  })

  it('has no error when the query succeeds', () => {
    mockOverviewQuery({ error: undefined })

    const { result } = renderHook(() => useSpaceAccountsData([makeSafeItem()]))

    expect(result.current.error).toBeUndefined()
  })
})
