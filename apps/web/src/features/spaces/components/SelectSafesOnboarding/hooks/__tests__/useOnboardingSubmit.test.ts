import { renderHook, act, waitFor } from '@testing-library/react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useOnboardingSubmit from '../useOnboardingSubmit'
import type { SafeItem } from '@/hooks/safes'
import type { MultiChainSafeItem } from '@/hooks/safes'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../../constants'
import { getGenericErrorWithStatus } from '@/utils/rtkQuery'

const mockChains: Chain[] = []

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

const mockAddSafesToSpace = jest.fn().mockResolvedValue({ data: {} })
const mockRemoveSafesFromSpace = jest.fn().mockResolvedValue({ data: {} })
const mockTrackEvent = jest.fn()

let mockSpaceSafes: Array<SafeItem | MultiChainSafeItem> = []
let mockRouterQuery: Record<string, string> = {}

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery, isReady: true }),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => {
    const safe = mockRouterQuery.safe
    return typeof safe === 'string' ? safe : ''
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafesToSpace],
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafesFromSpace],
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  ...jest.requireActual('@/services/analytics/events/spaces'),
  SPACE_EVENTS: {
    ...jest.requireActual('@/services/analytics/events/spaces').SPACE_EVENTS,
    ADD_ACCOUNTS: { action: 'add_accounts', category: 'spaces' },
  },
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
    expect(selectedSafes[`${MULTICHAIN_SAFE_KEY_PREFIX}0xccc`]).toBe(true)
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
      spaceId: '42',
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
      spaceId: '42',
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
      spaceId: '42',
      createSpaceSafesDto: { safes: [{ chainId: '5', address: '0xnewone' }] },
    })
  })

  it(`should skip ${MULTICHAIN_SAFE_KEY_PREFIX} keys when counting selected safes`, async () => {
    const { result } = renderHook(() => useOnboardingSubmit('1', onSuccess))

    act(() => {
      result.current.formMethods.setValue('selectedSafes', {
        [`${MULTICHAIN_SAFE_KEY_PREFIX}0xaaa`]: true,
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

    expect(result.current.error).toBe(getGenericErrorWithStatus(400))
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

  it('should preselect safe from URL when space has no existing safes', async () => {
    mockRouterQuery = { safe: '1:0x0000000000000000000000000000000000000001' }

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['1:0x0000000000000000000000000000000000000001']).toBe(true)
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

  it('should preselect all sub-safes when URL address matches a multichain group', async () => {
    const addr = '0x0000000000000000000000000000000000000001'
    const otherAddr = '0x0000000000000000000000000000000000000002'
    mockRouterQuery = { safe: `1:${addr}` }
    const multiChainGroup = buildMultiChainSafeItem(addr, ['1', '137', '42161'])
    const allSafes = [multiChainGroup, buildSafeItem('1', otherAddr)]

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess, allSafes))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(3)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes[`${MULTICHAIN_SAFE_KEY_PREFIX}${addr}`]).toBe(true)
    expect(selectedSafes[`1:${addr}`]).toBe(true)
    expect(selectedSafes[`137:${addr}`]).toBe(true)
    expect(selectedSafes[`42161:${addr}`]).toBe(true)
    expect(selectedSafes[`1:${otherAddr}`]).toBeUndefined()
  })

  it('should preselect multichain group when URL uses shortName prefix', async () => {
    const addr = '0x0000000000000000000000000000000000000001'
    mockRouterQuery = { safe: `eth:${addr}` }
    mockChains.push({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' } as Chain)
    const multiChainGroup = buildMultiChainSafeItem(addr, ['1', '137'])
    const allSafes = [multiChainGroup]

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess, allSafes))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(2)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes[`${MULTICHAIN_SAFE_KEY_PREFIX}${addr}`]).toBe(true)
    expect(selectedSafes[`1:${addr}`]).toBe(true)
    expect(selectedSafes[`137:${addr}`]).toBe(true)
  })

  it('should preselect single key when address is not in a multichain group', async () => {
    const singleAddr = '0x0000000000000000000000000000000000000001'
    const otherAddr = '0x0000000000000000000000000000000000000002'
    mockRouterQuery = { safe: `1:${singleAddr}` }
    const allSafes = [buildSafeItem('1', singleAddr), buildMultiChainSafeItem(otherAddr, ['1', '137'])]

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess, allSafes))

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes[`1:${singleAddr}`]).toBe(true)
    expect(selectedSafes[`${MULTICHAIN_SAFE_KEY_PREFIX}${otherAddr}`]).toBeUndefined()
  })

  it('should upgrade to multichain selection when allSafes loads after initial render', async () => {
    const addr = '0x0000000000000000000000000000000000000001'
    mockRouterQuery = { safe: `1:${addr}` }
    const emptyAllSafes: Array<SafeItem | MultiChainSafeItem> = []

    const { result, rerender } = renderHook(({ safes }) => useOnboardingSubmit('99', onSuccess, safes), {
      initialProps: { safes: emptyAllSafes },
    })

    // Initially: single key selected, not finalized
    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(1)
    })
    expect(result.current.formMethods.getValues('selectedSafes')).toEqual({ [`1:${addr}`]: true })

    // allSafes loads with a multichain group
    const multiChainGroup = buildMultiChainSafeItem(addr, ['1', '137'])
    rerender({ safes: [multiChainGroup] })

    await waitFor(() => {
      expect(result.current.selectedSafesLength).toBe(2)
    })

    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes[`${MULTICHAIN_SAFE_KEY_PREFIX}${addr}`]).toBe(true)
    expect(selectedSafes[`1:${addr}`]).toBe(true)
    expect(selectedSafes[`137:${addr}`]).toBe(true)
  })

  it('should not preselect from URL when address is not a valid Ethereum address', async () => {
    mockRouterQuery = { safe: '1:not_an_address' }

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await act(async () => {})

    expect(result.current.selectedSafesLength).toBe(0)
    const selectedSafes = result.current.formMethods.getValues('selectedSafes')
    expect(selectedSafes['1:not_an_address']).toBeUndefined()
  })

  it('should not preselect from URL when address is too short', async () => {
    mockRouterQuery = { safe: '1:0x1234' }

    const { result } = renderHook(() => useOnboardingSubmit('99', onSuccess))

    await act(async () => {})

    expect(result.current.selectedSafesLength).toBe(0)
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
