import type { JsonRpcProvider } from 'ethers'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { renderHook, waitFor } from '@/tests/test-utils'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { getPolicyGuardAddress } from '../../services/policyEngineDeployments'
import { usePolicyGuard } from '../usePolicyGuard'

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

describe('usePolicyGuard', () => {
  beforeEach(() => jest.restoreAllMocks())

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
})
