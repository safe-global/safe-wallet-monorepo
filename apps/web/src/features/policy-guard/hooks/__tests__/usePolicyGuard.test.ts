import { faker } from '@faker-js/faker'
import { skipToken } from '@reduxjs/toolkit/query'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { POLLING_INTERVAL } from '@/config/constants'
import * as useChains from '@/hooks/useChains'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { act, renderHook } from '@/tests/test-utils'
import { getPolicyGuardAddress } from '../../services/policyEngineDeployments'
import * as moduleGuardApi from '../../store/moduleGuardApi'
import { usePolicyGuard } from '../usePolicyGuard'

const GUARD = getPolicyGuardAddress('11155111')!
const FOREIGN = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
const guardInfo = (value: string) => ({ value, name: null, logoUri: null })

type ModuleGuardQuery = ReturnType<typeof moduleGuardApi.useGetModuleGuardQuery>
type SafeQuery = ReturnType<typeof safesQueries.useSafesGetSafeV1Query>

const mockChain = (features: FEATURES[]) =>
  jest
    .spyOn(useChains, 'useChain')
    .mockImplementation((chainId) => (chainId ? chainBuilder().with({ chainId, features }).build() : undefined))

const buildSafe = (overrides: Partial<ExtendedSafeInfo> = {}) =>
  extendedSafeInfoBuilder()
    .with({ chainId: '11155111', version: '1.5.0', guard: null, txHistoryTag: '1', deployed: true, ...overrides })
    .build()

const mockSafe = (
  overrides: Partial<ExtendedSafeInfo> = {},
  info: Partial<ReturnType<typeof useSafeInfo.default>> = {},
) => {
  const safe = buildSafe(overrides)
  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
    ...info,
  })
  return safe
}

const mockModuleGuard = (result: Partial<ModuleGuardQuery>) => {
  const refetch = jest.fn()
  const query = jest
    .spyOn(moduleGuardApi, 'useGetModuleGuardQuery')
    .mockReturnValue({ refetch, isFetching: false, ...result } as unknown as ModuleGuardQuery)
  return { query, refetch }
}

describe('usePolicyGuard', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockChain([FEATURES.POLICY_RECIPIENT_ALLOWLIST])
  })

  it.each([
    ['none', null, ZERO_ADDRESS, { status: 'none' }],
    ['known', GUARD, GUARD, { status: 'known' }],
    ['partial', GUARD, ZERO_ADDRESS, { status: 'partial', missingSlot: 'module' }],
    [
      'unknown',
      FOREIGN,
      ZERO_ADDRESS,
      { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: FOREIGN }] },
    ],
  ])('%s', (_, txGuard, moduleGuard, expected) => {
    mockSafe({ guard: txGuard ? guardInfo(txGuard) : null })
    mockModuleGuard({ currentData: moduleGuard })
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: expected,
      isLoading: false,
      error: undefined,
      isRetrying: false,
      refetch: expect.any(Function),
    })
  })

  it('reads the module guard for the Safe at its current tx history', () => {
    const safe = mockSafe({ txHistoryTag: '7' })
    const { query } = mockModuleGuard({ currentData: ZERO_ADDRESS })
    renderHook(() => usePolicyGuard())
    expect(query).toHaveBeenCalledWith({ chainId: '11155111', safeAddress: safe.address.value, txHistoryTag: '7' })
  })

  it("reads through the user's custom RPC for the chain", () => {
    const safe = mockSafe()
    const { query } = mockModuleGuard({ currentData: ZERO_ADDRESS })
    renderHook(() => usePolicyGuard(), {
      initialReduxState: {
        settings: {
          ...settingsInitialState,
          env: { ...settingsInitialState.env, rpc: { '11155111': 'https://custom.rpc' } },
        },
      },
    })
    expect(query).toHaveBeenCalledWith({
      chainId: '11155111',
      safeAddress: safe.address.value,
      txHistoryTag: '1',
      customRpc: 'https://custom.rpc',
    })
  })

  it('is loading while the module guard is read', () => {
    mockSafe()
    mockModuleGuard({ currentData: undefined, isFetching: true })
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: undefined,
      isLoading: true,
      error: undefined,
      isRetrying: false,
      refetch: expect.any(Function),
    })
  })

  it('is loading while the Safe loads', () => {
    mockSafe({}, { safeLoaded: false, safeLoading: true })
    mockModuleGuard({})
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.state).toBeUndefined()
  })

  it('returns the read error, not none', () => {
    mockSafe()
    const rpcError = new Error('rpc down')
    mockModuleGuard({ currentData: undefined, isError: true, error: rpcError })
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: undefined,
      isLoading: false,
      error: rpcError,
      isRetrying: false,
      refetch: expect.any(Function),
    })
  })

  it('keeps the error, and reports the retry, while a retry is in flight', () => {
    mockSafe()
    const rpcError = new Error('rpc down')
    mockModuleGuard({ currentData: undefined, isError: false, isFetching: true, error: rpcError })
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: undefined,
      isLoading: false,
      error: rpcError,
      isRetrying: true,
      refetch: expect.any(Function),
    })
  })

  it('returns the last read state without an error when a later read fails', () => {
    mockSafe()
    mockModuleGuard({ currentData: ZERO_ADDRESS, isError: true, error: new Error('rpc down') })
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: { status: 'none' },
      isLoading: false,
      error: undefined,
      isRetrying: false,
      refetch: expect.any(Function),
    })
  })

  it.each([
    ['the flag is off', () => mockChain([]), {}],
    ['the chain has no deployment', () => {}, { chainId: '999999' }],
    ['the Safe is counterfactual', () => {}, { deployed: false }],
  ])('returns nothing and skips the read when %s', (_, setup, overrides) => {
    setup()
    mockSafe(overrides as Partial<ExtendedSafeInfo>)
    const { query } = mockModuleGuard({})
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({
      state: undefined,
      isLoading: false,
      error: undefined,
      isRetrying: false,
      refetch: expect.any(Function),
    })
    expect(query).toHaveBeenCalledWith(skipToken)
  })

  it('is not loading when the chain config is missing', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
    mockSafe()
    mockModuleGuard({})
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(false)
  })

  it('reports unsupported below Safe v1.5.0 without a read', () => {
    mockSafe({ version: '1.4.1' })
    const { query } = mockModuleGuard({})
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.state).toEqual({ status: 'unsupported' })
    expect(query).toHaveBeenCalledWith(skipToken)
  })

  it('returns the same error when the open Safe fails to load', () => {
    mockSafe({}, { safeLoaded: false, safeLoading: false, safeError: 'Failed to load Safe' })
    mockModuleGuard({})
    const { result, rerender } = renderHook(() => usePolicyGuard())
    const firstError = result.current.error
    rerender()
    expect(firstError?.message).toBe('Failed to load Safe')
    expect(result.current.error).toBe(firstError)
    expect(result.current.isLoading).toBe(false)
  })

  describe('re-reads', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('retries a failed read after one polling interval', () => {
      mockSafe()
      const { refetch } = mockModuleGuard({ isError: true, error: new Error('rpc down') })
      renderHook(() => usePolicyGuard())
      expect(refetch).not.toHaveBeenCalled()
      act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('re-reads a partial result in case the RPC node lags behind', () => {
      mockSafe({ guard: guardInfo(GUARD) })
      const { refetch } = mockModuleGuard({ currentData: ZERO_ADDRESS })
      renderHook(() => usePolicyGuard())
      act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('stops after three re-reads of a lasting error', () => {
      mockSafe()
      const { refetch } = mockModuleGuard({ isError: true, error: new Error('No RPC is configured for this chain') })
      renderHook(() => usePolicyGuard())
      for (let i = 0; i < 5; i++) act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      expect(refetch).toHaveBeenCalledTimes(3)
    })

    it('stops after three re-reads of a Safe that really is partial', () => {
      mockSafe({ guard: guardInfo(GUARD) })
      const { refetch } = mockModuleGuard({ currentData: ZERO_ADDRESS })
      renderHook(() => usePolicyGuard())
      for (let i = 0; i < 5; i++) act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      expect(refetch).toHaveBeenCalledTimes(3)
    })

    it('re-reads again after the next transaction', () => {
      const safe = mockSafe({ guard: guardInfo(GUARD), txHistoryTag: '1' })
      const { refetch } = mockModuleGuard({ currentData: ZERO_ADDRESS })
      const { rerender } = renderHook(() => usePolicyGuard())
      for (let i = 0; i < 4; i++) act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      mockSafe({ guard: guardInfo(GUARD), txHistoryTag: '2', address: safe.address })
      rerender()
      act(() => jest.advanceTimersByTime(POLLING_INTERVAL))
      expect(refetch).toHaveBeenCalledTimes(4)
    })

    it('does not re-read a settled result', () => {
      mockSafe()
      const { refetch } = mockModuleGuard({ currentData: ZERO_ADDRESS })
      renderHook(() => usePolicyGuard())
      act(() => jest.advanceTimersByTime(POLLING_INTERVAL * 2))
      expect(refetch).not.toHaveBeenCalled()
    })
  })

  it('does not request another Safe without a target', () => {
    const query = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query')
    mockSafe()
    mockModuleGuard({ currentData: ZERO_ADDRESS })
    renderHook(() => usePolicyGuard())
    expect(query).toHaveBeenCalledWith(skipToken, expect.anything())
  })

  describe('refetch', () => {
    it('re-reads the module guard on demand', () => {
      mockSafe()
      const { refetch } = mockModuleGuard({ isError: true, error: new Error('rpc down') })
      const { result } = renderHook(() => usePolicyGuard())
      act(() => result.current.refetch())
      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('does not re-read a module guard read that never started', () => {
      mockSafe({ version: '1.4.1' })
      const { refetch } = mockModuleGuard({ isUninitialized: true })
      const { result } = renderHook(() => usePolicyGuard())
      act(() => result.current.refetch())
      expect(refetch).not.toHaveBeenCalled()
    })

    it('reloads a target Safe that failed to load', () => {
      mockSafe()
      const safeRefetch = jest.fn()
      jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
        refetch: safeRefetch,
        isUninitialized: false,
        isError: true,
        error: { status: 500, data: 'Server error' },
      } as unknown as SafeQuery)
      mockModuleGuard({ isUninitialized: true })
      const { result } = renderHook(() =>
        usePolicyGuard({ chainId: '11155111', safeAddress: faker.finance.ethereumAddress() }),
      )
      act(() => result.current.refetch())
      expect(safeRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('with a target Safe', () => {
    const TARGET = { chainId: '11155111', safeAddress: '0x3333333333333333333333333333333333333333' }

    const mockTargetQuery = (result: Partial<SafeQuery>) =>
      jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({ refetch: jest.fn(), ...result } as SafeQuery)

    it('reads the target Safe, not the open one', () => {
      mockSafe()
      mockTargetQuery({ currentData: buildSafe({ guard: guardInfo(GUARD), txHistoryTag: '3' }), isFetching: false })
      const { query } = mockModuleGuard({ currentData: GUARD })
      const { result } = renderHook(() => usePolicyGuard(TARGET))
      expect(result.current.state).toEqual({ status: 'known' })
      expect(query).toHaveBeenCalledWith({ ...TARGET, txHistoryTag: '3' })
    })

    it('polls the target Safe only while the tab is focused', () => {
      mockSafe()
      const query = mockTargetQuery({ currentData: buildSafe(), isFetching: false })
      mockModuleGuard({ currentData: ZERO_ADDRESS })
      renderHook(() => usePolicyGuard(TARGET))
      expect(query).toHaveBeenCalledWith(TARGET, { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true })
    })

    it('is loading while the target Safe loads', () => {
      mockSafe()
      mockTargetQuery({ currentData: undefined, isLoading: true, isFetching: true })
      mockModuleGuard({})
      const { result } = renderHook(() => usePolicyGuard(TARGET))
      expect(result.current.isLoading).toBe(true)
      expect(result.current.state).toBeUndefined()
    })

    it('returns the same error, keeping the original, when the target Safe fails to load', () => {
      mockSafe()
      const rtkError = { status: 500, data: 'Server error' }
      mockTargetQuery({ currentData: undefined, isFetching: false, isError: true, error: rtkError })
      mockModuleGuard({})
      const { result, rerender } = renderHook(() => usePolicyGuard(TARGET))
      const firstError = result.current.error
      rerender()
      expect(firstError).toBeInstanceOf(Error)
      expect(firstError?.cause).toBe(rtkError)
      expect(result.current.error).toBe(firstError)
      expect(result.current.isLoading).toBe(false)
    })

    it('treats a target Safe CGW does not know as not deployed, not as an error', () => {
      mockSafe()
      mockTargetQuery({
        currentData: undefined,
        isFetching: false,
        isError: true,
        error: { status: 404, data: 'Not found' },
      })
      const { query } = mockModuleGuard({})
      const { result } = renderHook(() => usePolicyGuard(TARGET))
      expect(result.current).toEqual({
        state: undefined,
        isLoading: false,
        error: undefined,
        isRetrying: false,
        refetch: expect.any(Function),
      })
      expect(query).toHaveBeenCalledWith(skipToken)
    })

    it('reports unsupported for a target Safe below v1.5.0 without a read', () => {
      mockSafe()
      mockTargetQuery({ currentData: buildSafe({ version: '1.4.1' }), isFetching: false })
      const { query } = mockModuleGuard({})
      const { result } = renderHook(() => usePolicyGuard(TARGET))
      expect(result.current.state).toEqual({ status: 'unsupported' })
      expect(query).toHaveBeenCalledWith(skipToken)
    })
  })
})
