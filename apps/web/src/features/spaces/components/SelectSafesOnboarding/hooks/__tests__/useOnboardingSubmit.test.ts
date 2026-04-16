import { renderHook, act, waitFor } from '@testing-library/react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useOnboardingSubmit from '../useOnboardingSubmit'
import type { SafeItem } from '@/hooks/safes'
import type { MultiChainSafeItem } from '@/hooks/safes'

const mockChains: Chain[] = []

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

const mockAddSafesToSpace = jest.fn().mockResolvedValue({ data: {} })
const mockRemoveSafesFromSpace = jest.fn().mockResolvedValue({ data: {} })
const mockDispatch = jest.fn()
const mockTrackEvent = jest.fn()

let mockSpaceSafes: Array<SafeItem | MultiChainSafeItem> = []
let mockRouterQuery: Record<string, string> = {}

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery, isReady: true }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafesToSpace],
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafesFromSpace],
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: jest.fn((payload) => ({ type: 'showNotification', payload })),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: { ADD_ACCOUNTS: { action: 'add_accounts', category: 'spaces' } },
}))

jest.mock('@/features/spaces/hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => ({ allSafes: mockSpaceSafes }),
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: (items: Array<SafeItem | MultiChainSafeItem>) =>
    items.flatMap((item) => ('safes' in item ? item.safes : [item])),
  isMultiChainSafeItem: (safe: SafeItem | MultiChainSafeItem) => 'safes' in safe,
}))

const buildSafeItem = (chainId: string, address: string): SafeItem => ({ chainId, address }) as SafeItem

const buildMultiChainSafeItem = (address: string, chainIds: string[]): MultiChainSafeItem =>
  ({
    address,
    safes: chainIds.map((chainId) => buildSafeItem(chainId, address)),
  }) as MultiChainSafeItem

describe('useOnboardingSubmit', () => {
  const onSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockSpaceSafes = []
    mockRouterQuery = {}
    mockChains.splice(0, mockChains.length)
    mockAddSafesToSpace.mockResolvedValue({ data: {} })
    mockRemoveSafesFromSpace.mockResolvedValue({ data: {} })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    expect(result.current.selectedSafesLength).toBe(0)
    expect(result.current.error).toBeUndefined()
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.formMethods).toBeDefined()
  })

  it('should pre-select existing space safes on init', async () => {
    mockSpaceSafes = [buildSafeItem('1', '0xaaa'), buildSafeItem('5', '0xbbb')]

    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(2)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['1:0xaaa']).toBe(true)
    expect(selectedSafes['5:0xbbb']).toBe(true)
  })

  it('should pre-select multichain safes and their sub-safes', async () => {
    mockSpaceSafes = [buildMultiChainSafeItem('0xccc', ['1', '10'])]

    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(2)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['multichain_0xccc']).toBe(true)
    expect(selectedSafes['1:0xccc']).toBe(true)
    expect(selectedSafes['10:0xccc']).toBe(true)
  })

  it('should add new safes on submit', async () => {
    const { result } = renderHook(() => useOnboardingSubmit('42', onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xnew': true })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockAddSafesToSpace).toHaveBeenCalledWith({
      spaceId: 42,
      createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xnew' }] },
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should remove unselected safes on submit', async () => {
    mockSpaceSafes = [buildSafeItem('1', '0xexisting')]

    const { result } = renderHook(() => useOnboardingSubmit('42', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xexisting': false })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockRemoveSafesFromSpace).toHaveBeenCalledWith({
      spaceId: 42,
      deleteSpaceSafesDto: { safes: [{ chainId: '1', address: '0xexisting' }] },
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should not add safes that already exist in the space', async () => {
    mockSpaceSafes = [buildSafeItem('1', '0xexisting')]

    const { result } = renderHook(() => useOnboardingSubmit('42', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    act(() => {
      result.current.formMethods.setValue('selectedSafes', {
        '1:0xexisting': true,
        '5:0xnewone': true,
      })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockAddSafesToSpace).toHaveBeenCalledWith({
      spaceId: 42,
      createSpaceSafesDto: { safes: [{ chainId: '5', address: '0xnewone' }] },
    })
  })

  it('should skip multichain_ keys when counting selected safes', async () => {
    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', {
        multichain_0xaaa: true,
        '1:0xaaa': true,
        '10:0xaaa': true,
      })
    })

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(2)
    })
  })

  it('should not submit if spaceId is undefined', async () => {
    const { result } = renderHook(() => useOnboardingSubmit(undefined, onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xaaa': true })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should set error on add failure', async () => {
    mockAddSafesToSpace.mockResolvedValue({
      error: { status: 400, data: { message: 'Add failed' } },
    })

    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xaaa': true })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(result.current.error).toBe('Add failed')
    expect(result.current.isSubmitting).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should set error on remove failure', async () => {
    mockSpaceSafes = [buildSafeItem('1', '0xexisting')]
    mockRemoveSafesFromSpace.mockResolvedValue({
      error: { status: 400, data: { message: 'Remove failed' } },
    })

    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xexisting': false })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(result.current.error).toBe('Remove failed')
    expect(result.current.isSubmitting).toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('should set a generic error when error has no message', async () => {
    mockAddSafesToSpace.mockResolvedValue({ error: { status: 400, data: {} } })

    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', { '1:0xaaa': true })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(result.current.error).toBe('Error: 400')
  })

  it('should track analytics event on submit', async () => {
    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockTrackEvent).toHaveBeenCalledWith({
      action: 'add_accounts',
      category: 'spaces',
    })
  })

  it('should dispatch success notification on successful submit', async () => {
    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(mockDispatch).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should preselect safe from URL when space has no existing safes', async () => {
    mockRouterQuery = { safe: '1:0xdeadbeef' }

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['1:0xdeadbeef']).toBe(true)
  })

  it('should preselect safe from URL when query uses chain shortName', async () => {
    mockRouterQuery = { safe: 'sep:0x0000000000000000000000000000000000000001' }
    mockChains.push({
      chainId: '11155111',
      chainName: 'Sepolia',
      shortName: 'sep',
    } as Chain)

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['11155111:0x0000000000000000000000000000000000000001']).toBe(true)
  })

  it('should not preselect from URL when shortName does not match any chain', async () => {
    mockRouterQuery = { safe: 'unknownchain:0xdeadbeef' }
    mockChains.push({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' } as Chain)

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    // Wait a tick to allow effects to settle
    await act(async () => {})

    expect(result.current.selectedSafesLength).toBe(0)
    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['1:0xdeadbeef']).toBeUndefined()
  })

  it('should preselect safe from URL when shortName is uppercase', async () => {
    mockRouterQuery = { safe: 'SEP:0x0000000000000000000000000000000000000001' }
    mockChains.push({
      chainId: '11155111',
      chainName: 'Sepolia',
      shortName: 'sep',
    } as Chain)

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['11155111:0x0000000000000000000000000000000000000001']).toBe(true)
  })

  it('should not preselect from URL when space already has safes', async () => {
    mockRouterQuery = { safe: '1:0xdeadbeef' }
    mockSpaceSafes = [buildSafeItem('5', '0xother')]

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['5:0xother']).toBe(true)
    expect(selectedSafes['1:0xdeadbeef']).toBeUndefined()
  })
})
