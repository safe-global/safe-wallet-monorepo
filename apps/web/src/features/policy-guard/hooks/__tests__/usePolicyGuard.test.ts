import type { JsonRpcProvider } from 'ethers'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as useChains from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { skipToken } from '@reduxjs/toolkit/query'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { POLLING_INTERVAL } from '@/config/constants'
import * as readOnlyProvider from '../useReadOnlyProvider'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { getPolicyGuardAddress } from '../../services/policyEngineDeployments'
import { usePolicyGuard } from '../usePolicyGuard'

jest.mock('@safe-global/utils/config/constants', () => ({
  ...jest.requireActual('@safe-global/utils/config/constants'),
  INFURA_TOKEN: '',
}))

const GUARD = getPolicyGuardAddress('11155111')!
const SLOT_EMPTY = `0x${'0'.repeat(64)}`
const slotOf = (address: string) => `0x${'0'.repeat(24)}${address.slice(2).toLowerCase()}`
const guardInfo = (value: string) => ({ value, name: null, logoUri: null })

const mockSafe = (overrides: Partial<ExtendedSafeInfo>) => {
  const safe = extendedSafeInfoBuilder()
    .with({ chainId: '11155111', version: '1.5.0', guard: null, ...overrides })
    .build()
  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
}

const mockProvider = (getStorage: jest.Mock) =>
  jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue({ getStorage } as unknown as JsonRpcProvider)

const mockSlot = (value: string) => {
  const getStorage = jest.fn().mockResolvedValue(value)
  mockProvider(getStorage)
  return getStorage
}

const mockChain = (features: FEATURES[], overrides: Partial<Chain> = {}) =>
  jest.spyOn(useChains, 'useChain').mockImplementation((chainId) =>
    chainBuilder()
      .with({ chainId, features, ...overrides })
      .build(),
  )

describe('usePolicyGuard', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockChain([FEATURES.POLICY_RECIPIENT_ALLOWLIST])
  })

  it('none', async () => {
    mockSafe({})
    mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'none' }))
    expect(result.current.isLoading).toBe(false)
  })

  it('known', async () => {
    mockSafe({ guard: guardInfo(GUARD) })
    mockSlot(slotOf(GUARD))
    const { result } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))
  })

  it('partial', async () => {
    mockSafe({ guard: guardInfo(GUARD) })
    mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'partial', missingSlot: 'module' }))
  })

  it('unknown', async () => {
    const foreign = '0x4784e9bF408F649D04A0a3294e87B0c74C5A3020'
    mockSafe({ guard: guardInfo(foreign) })
    mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'unknown',
        foreignGuards: [{ slot: 'transaction', address: foreign }],
      }),
    )
  })

  it('unsupported, without an RPC read', () => {
    mockSafe({ version: '1.4.1' })
    const getStorage = mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.state).toEqual({ status: 'unsupported' })
    expect(result.current.isLoading).toBe(false)
    expect(getStorage).not.toHaveBeenCalled()
  })

  it('returns error, not none, when getStorage rejects', async () => {
    mockSafe({})
    mockProvider(jest.fn().mockRejectedValue(new Error('rpc down')))
    const { result } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.error?.message).toBe('rpc down'))
    expect(result.current.state).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns no state and skips RPC on a chain without a deployment', () => {
    mockSafe({ chainId: '1' })
    const getStorage = mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.state).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(getStorage).not.toHaveBeenCalled()
  })

  it('is loading while the Safe loads', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().build(),
      safeAddress: '',
      safeLoaded: false,
      safeLoading: true,
      safeError: undefined,
    })
    mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.state).toBeUndefined()
  })

  it("clears the previous Safe's state on Safe change", async () => {
    mockSafe({ guard: guardInfo(GUARD) })
    mockSlot(slotOf(GUARD))
    const { result, rerender } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))

    mockSafe({ guard: null })
    mockProvider(jest.fn().mockReturnValue(new Promise<string>(() => {})))
    rerender()

    expect(result.current.state).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it("never pairs the previous Safe's module slot with the next Safe's tx guard", async () => {
    mockSafe({ guard: guardInfo(GUARD) })
    mockSlot(slotOf(GUARD))
    const states: Array<ReturnType<typeof usePolicyGuard>['state']> = []
    const { result, rerender } = renderHook(() => {
      const value = usePolicyGuard()
      states.push(value.state)
      return value
    })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))

    states.length = 0
    mockSafe({ guard: null })
    mockProvider(jest.fn().mockReturnValue(new Promise<string>(() => {})))
    rerender()

    expect(states).not.toContainEqual({ status: 'partial', missingSlot: 'transaction' })
  })

  it('re-reads the module guard when the Safe executes a transaction', async () => {
    const safe = extendedSafeInfoBuilder()
      .with({ chainId: '11155111', version: '1.5.0', guard: null, txHistoryTag: '1' })
      .build()
    const mockSafeInfo = (overrides: Partial<ExtendedSafeInfo>) =>
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: { ...safe, ...overrides },
        safeAddress: safe.address.value,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
    mockSafeInfo({})
    const getStorage = mockSlot(SLOT_EMPTY)
    const { result, rerender } = renderHook(() => usePolicyGuard())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'none' }))

    getStorage.mockResolvedValue(slotOf(GUARD))
    mockSafeInfo({ guard: guardInfo(GUARD), txHistoryTag: '2' })
    rerender()

    await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))
  })

  it('never reports a settled empty result or a stale error while switching Safe', async () => {
    mockSafe({})
    mockProvider(jest.fn().mockRejectedValue(new Error('rpc down')))
    const renders: Array<ReturnType<typeof usePolicyGuard>> = []
    const { result, rerender } = renderHook(() => {
      const value = usePolicyGuard()
      renders.push(value)
      return value
    })
    await waitFor(() => expect(result.current.error).toBeDefined())

    renders.length = 0
    mockSafe({})
    mockProvider(jest.fn().mockReturnValue(new Promise<string>(() => {})))
    rerender()

    renders.forEach((render) => {
      expect(render.error).toBeUndefined()
      expect(render.isLoading).toBe(true)
    })
  })

  it('returns no state and skips RPC when the allow list flag is off', () => {
    mockChain([])
    mockSafe({ version: '1.4.1' })
    const getStorage = mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({ state: undefined, isLoading: false, error: undefined })
    expect(getStorage).not.toHaveBeenCalled()
  })

  it('is not loading when the chain config is missing', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
    mockSafe({})
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(false)
  })

  it('returns an error, not endless loading, when the chain has no RPC', () => {
    mockChain([FEATURES.POLICY_RECIPIENT_ALLOWLIST], { rpcUri: { authentication: 'NO_AUTHENTICATION', value: '' } })
    mockSafe({})
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const { result, rerender } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    const firstError = result.current.error
    rerender()
    expect(result.current.error).toBe(firstError)
  })

  it('returns an error, not endless loading, when the RPC needs an Infura token that is not set', () => {
    mockChain([FEATURES.POLICY_RECIPIENT_ALLOWLIST], {
      rpcUri: { authentication: 'API_KEY_PATH', value: 'https://sepolia.infura.io/v3/' },
    })
    mockSafe({})
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('retries a failed module guard read', async () => {
    jest.useFakeTimers()
    try {
      mockSafe({})
      const getStorage = jest.fn().mockRejectedValueOnce(new Error('rpc down')).mockResolvedValue(SLOT_EMPTY)
      mockProvider(getStorage)
      const { result } = renderHook(() => usePolicyGuard())
      await waitFor(() => expect(result.current.error).toBeDefined())

      await act(async () => {
        jest.advanceTimersByTime(POLLING_INTERVAL)
      })

      await waitFor(() => expect(result.current.state).toEqual({ status: 'none' }))
      expect(result.current.error).toBeUndefined()
      expect(getStorage).toHaveBeenCalledTimes(2)
    } finally {
      jest.useRealTimers()
    }
  })

  describe('after the Safe executes a transaction', () => {
    const safe = extendedSafeInfoBuilder()
      .with({ chainId: '11155111', version: '1.5.0', guard: null, txHistoryTag: '1' })
      .build()
    const mockSafeInfo = (overrides: Partial<ExtendedSafeInfo>) =>
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: { ...safe, ...overrides },
        safeAddress: safe.address.value,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

    it('never pairs the new tx guard with the previous module guard read', async () => {
      mockSafeInfo({})
      const getStorage = mockSlot(SLOT_EMPTY)
      const { result, rerender } = renderHook(() => usePolicyGuard())
      await waitFor(() => expect(result.current.state).toEqual({ status: 'none' }))

      getStorage.mockReturnValue(new Promise<string>(() => {}))
      mockSafeInfo({ guard: guardInfo(GUARD), txHistoryTag: '2' })
      rerender()

      expect(result.current.state).toBeUndefined()
      expect(result.current.isLoading).toBe(true)
    })

    it('re-reads a partial result in case the RPC node lags behind', async () => {
      jest.useFakeTimers()
      try {
        mockSafeInfo({ guard: guardInfo(GUARD), txHistoryTag: '2' })
        mockSlot(SLOT_EMPTY).mockResolvedValueOnce(SLOT_EMPTY).mockResolvedValue(slotOf(GUARD))
        const { result } = renderHook(() => usePolicyGuard())
        await waitFor(() => expect(result.current.state).toEqual({ status: 'partial', missingSlot: 'module' }))

        await act(async () => {
          jest.advanceTimersByTime(POLLING_INTERVAL)
        })

        await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))
      } finally {
        jest.useRealTimers()
      }
    })
  })

  it('returns the error when the open Safe fails to load', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().with({ chainId: '11155111' }).build(),
      safeAddress: '0x3333333333333333333333333333333333333333',
      safeLoaded: false,
      safeLoading: false,
      safeError: 'Failed to load Safe',
    })
    mockSlot(SLOT_EMPTY)
    const { result, rerender } = renderHook(() => usePolicyGuard())
    const firstError = result.current.error
    rerender()

    expect(firstError?.message).toBe('Failed to load Safe')
    expect(result.current.error).toBe(firstError)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns no state and skips RPC for a counterfactual Safe', () => {
    mockSafe({ deployed: false })
    const getStorage = mockSlot(SLOT_EMPTY)
    const { result } = renderHook(() => usePolicyGuard())
    expect(result.current).toEqual({ state: undefined, isLoading: false, error: undefined })
    expect(getStorage).not.toHaveBeenCalled()
  })

  it('does not request another Safe without a target', () => {
    const query = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query')
    mockSafe({})
    mockSlot(SLOT_EMPTY)
    renderHook(() => usePolicyGuard())
    expect(query).toHaveBeenCalledWith(skipToken, expect.anything())
  })

  describe('with a target Safe', () => {
    const TARGET = { chainId: '11155111', safeAddress: '0x3333333333333333333333333333333333333333' }

    type QueryResult = ReturnType<typeof safesQueries.useSafesGetSafeV1Query>
    const mockTargetQuery = (result: Partial<QueryResult>) =>
      jest
        .spyOn(safesQueries, 'useSafesGetSafeV1Query')
        .mockReturnValue({ refetch: jest.fn(), ...result } as QueryResult)

    const mockTargetProvider = (getStorage: jest.Mock) =>
      jest.spyOn(readOnlyProvider, 'useReadOnlyProvider').mockImplementation((chainId) => ({
        provider: chainId ? ({ getStorage } as unknown as JsonRpcProvider) : undefined,
      }))

    const targetSafe = (overrides: Partial<ExtendedSafeInfo>) =>
      extendedSafeInfoBuilder()
        .with({ chainId: TARGET.chainId, version: '1.5.0', guard: null, ...overrides })
        .build()

    it('reads the target Safe, not the open one', async () => {
      mockSafe({})
      const currentGetStorage = mockSlot(SLOT_EMPTY)
      const getStorage = jest.fn().mockResolvedValue(slotOf(GUARD))
      mockTargetProvider(getStorage)
      mockTargetQuery({ currentData: targetSafe({ guard: guardInfo(GUARD) }), isFetching: false })

      const { result } = renderHook(() => usePolicyGuard(TARGET))

      await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))
      expect(getStorage).toHaveBeenCalledWith(TARGET.safeAddress, expect.any(String))
      expect(currentGetStorage).not.toHaveBeenCalled()
    })

    it('polls the target Safe', () => {
      mockSafe({})
      mockTargetProvider(jest.fn().mockResolvedValue(SLOT_EMPTY))
      const query = mockTargetQuery({ currentData: targetSafe({}), isFetching: false })
      renderHook(() => usePolicyGuard(TARGET))
      expect(query).toHaveBeenCalledWith(TARGET, { pollingInterval: POLLING_INTERVAL })
    })

    it('re-reads the module guard when the target Safe executes a transaction', async () => {
      mockSafe({})
      const getStorage = jest.fn().mockResolvedValue(SLOT_EMPTY)
      mockTargetProvider(getStorage)
      mockTargetQuery({ currentData: targetSafe({ txHistoryTag: '1' }), isFetching: false })
      const { result, rerender } = renderHook(() => usePolicyGuard(TARGET))
      await waitFor(() => expect(result.current.state).toEqual({ status: 'none' }))

      getStorage.mockResolvedValue(slotOf(GUARD))
      mockTargetQuery({ currentData: targetSafe({ txHistoryTag: '2', guard: guardInfo(GUARD) }), isFetching: false })
      rerender()

      await waitFor(() => expect(result.current.state).toEqual({ status: 'known' }))
    })

    it('is loading while the target Safe loads', () => {
      mockSafe({})
      mockTargetProvider(jest.fn().mockResolvedValue(SLOT_EMPTY))
      mockTargetQuery({ currentData: undefined, isFetching: true })

      const { result } = renderHook(() => usePolicyGuard(TARGET))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.state).toBeUndefined()
    })

    it('returns the same error, keeping the original, when the target Safe fails to load', () => {
      mockSafe({})
      mockTargetProvider(jest.fn().mockResolvedValue(SLOT_EMPTY))
      const rtkError = { status: 404, data: 'Not found' }
      mockTargetQuery({ currentData: undefined, isFetching: false, isError: true, error: rtkError })

      const { result, rerender } = renderHook(() => usePolicyGuard(TARGET))
      const firstError = result.current.error
      rerender()

      expect(firstError).toBeInstanceOf(Error)
      expect(firstError?.cause).toBe(rtkError)
      expect(result.current.error).toBe(firstError)
      expect(result.current.isLoading).toBe(false)
    })

    it('reports unsupported for a target Safe below 1.5.0 without an RPC read', () => {
      mockSafe({})
      const getStorage = jest.fn().mockResolvedValue(SLOT_EMPTY)
      mockTargetProvider(getStorage)
      mockTargetQuery({ currentData: targetSafe({ version: '1.4.1' }), isFetching: false })

      const { result } = renderHook(() => usePolicyGuard(TARGET))

      expect(result.current.state).toEqual({ status: 'unsupported' })
      expect(getStorage).not.toHaveBeenCalled()
    })

    it('returns the error, not endless loading, when the target provider fails to load', () => {
      mockSafe({})
      const loadError = new Error('chunk failed')
      jest.spyOn(readOnlyProvider, 'useReadOnlyProvider').mockReturnValue({ provider: undefined, error: loadError })
      mockTargetQuery({ currentData: targetSafe({}), isFetching: false })

      const { result } = renderHook(() => usePolicyGuard(TARGET))

      expect(result.current.error).toBe(loadError)
      expect(result.current.isLoading).toBe(false)
    })
  })
})
