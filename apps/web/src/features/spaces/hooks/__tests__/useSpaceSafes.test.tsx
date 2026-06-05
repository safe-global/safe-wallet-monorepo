import { renderHook } from '@testing-library/react'
import { useSpaceSafes } from '../useSpaceSafes'

const mockUseCurrentSpaceId = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseGetSpaceAddressBook = jest.fn()
const mockUseWallet = jest.fn()
const mockUseAllOwnedSafes = jest.fn()
const mockUseAllSafesGrouped = jest.fn()
const mockApplyCustomOrder = jest.fn()
let mockIsAuthenticated = true
let mockCustomOrder: string[] | undefined

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('../useGetSpaceAddressBook', () => ({
  __esModule: true,
  default: () => mockUseGetSpaceAddressBook(),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => {
    // The space-safe-order selector is passed as an inline function
    if (typeof selector === 'function') return mockCustomOrder
    if (selector === 'isAuthenticated') return mockIsAuthenticated
    if (selector === 'selectOrderByPreference') return { orderBy: 'name' }
    return undefined
  },
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({
  selectOrderByPreference: 'selectOrderByPreference',
}))

jest.mock('@/store/safeOrderSlice', () => ({
  selectSpaceSafeOrder: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))

jest.mock('@/hooks/safes', () => ({
  _buildSafeItems: jest.fn(() => []),
  useAllSafesGrouped: () => mockUseAllSafesGrouped(),
  useAllOwnedSafes: () => mockUseAllOwnedSafes(),
  getComparator: () => () => 0,
  applyCustomOrder: (...args: unknown[]) => mockApplyCustomOrder(...args),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('../../utils', () => ({
  mapSpaceContactsToAddressBookState: jest.fn(() => ({})),
}))

describe('useSpaceSafes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockCustomOrder = undefined
    mockApplyCustomOrder.mockImplementation((items: unknown) => items)
    mockUseGetSpaceAddressBook.mockReturnValue([])
    mockUseWallet.mockReturnValue({ address: '0xabc' })
    mockUseAllOwnedSafes.mockReturnValue([{}])
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: [], allSingleSafes: [] })
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    })
  })

  it('skips the query when the user is not authenticated', () => {
    mockIsAuthenticated = false
    mockUseCurrentSpaceId.mockReturnValue('7')

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the query when there is no current spaceId (Number(null) is 0 — must not hit /v1/spaces/0/...)', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('fires the query when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue('5')

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 5 }, { skip: false })
  })

  it('does not apply a custom order when none is saved for the space', () => {
    mockUseCurrentSpaceId.mockReturnValue('5')
    const multi = [{ address: '0xm', safes: [] }]
    const single = [{ chainId: '1', address: '0xa' }]
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: multi, allSingleSafes: single })

    const { result } = renderHook(() => useSpaceSafes())

    expect(mockApplyCustomOrder).not.toHaveBeenCalled()
    expect(result.current.allSafes).toEqual([...multi, ...single])
  })

  it('applies the saved manual order when present (shared by page and dashboard widget)', () => {
    mockUseCurrentSpaceId.mockReturnValue('5')
    const multi = [{ address: '0xm', safes: [] }]
    const single = [{ chainId: '1', address: '0xa' }]
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: multi, allSingleSafes: single })
    mockCustomOrder = ['1:0xa', 'multi:0xm']
    const reordered = [...single, ...multi]
    mockApplyCustomOrder.mockReturnValue(reordered)

    const { result } = renderHook(() => useSpaceSafes())

    expect(mockApplyCustomOrder).toHaveBeenCalledWith([...multi, ...single], ['1:0xa', 'multi:0xm'])
    expect(result.current.allSafes).toEqual(reordered)
  })
})
