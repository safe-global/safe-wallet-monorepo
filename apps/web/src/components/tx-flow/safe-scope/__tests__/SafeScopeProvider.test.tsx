import { act, renderHook, waitFor } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { SafeScopeProvider } from '../SafeScopeProvider'
import { useSafeScope, useSafeScopeControls } from '../context'
import { hasActiveScope } from '../activeScope'
import * as safesApi from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as useChainsHooks from '@/hooks/useChains'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as web3 from '@/hooks/wallets/web3'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/safes'),
  useSafesGetSafeV1Query: jest.fn(),
}))
jest.mock('@/hooks/wallets/web3', () => ({ createWeb3ReadOnly: jest.fn() }))

// `trackError` is exported as a live binding, which `jest.spyOn` can't redefine on the required
// module object — mock it at module scope the same way `useInitSafeCoreSDK.test.ts` does.
const mockTrackError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  trackError: (...args: unknown[]) => mockTrackError(...args),
}))

const sepolia = chainBuilder().with({ chainId: '11155111', l2: false, zk: false }).build()
const polygon = chainBuilder().with({ chainId: '137', l2: true, zk: false }).build()
const chainsById: Record<string, typeof sepolia> = { [sepolia.chainId]: sepolia, [polygon.chainId]: polygon }

// `implementation` is non-optional on `SafeState`, but `safeInfoBuilder()`'s default leaves it
// `undefined` — override it so `safe.implementation.value` (mirroring `useInitSafeCoreSDK`) doesn't crash.
const safeA = safeInfoBuilder().with({ chainId: sepolia.chainId, implementation: addressExBuilder().build() }).build()
const safeB = safeInfoBuilder().with({ chainId: polygon.chainId, implementation: addressExBuilder().build() }).build()
// Same chain as `safeA`, different address — for the same-chain switch test.
const safeC = safeInfoBuilder().with({ chainId: sepolia.chainId, implementation: addressExBuilder().build() }).build()
const safesByAddress: Record<string, typeof safeA> = {
  [safeA.address.value]: safeA,
  [safeB.address.value]: safeB,
  [safeC.address.value]: safeC,
}

const mockQuery = safesApi.useSafesGetSafeV1Query as jest.Mock
const mockCreateProvider = web3.createWeb3ReadOnly as jest.Mock
let initSafeSDKSpy: jest.SpyInstance

const useProbe = () => ({ scope: useSafeScope(), controls: useSafeScopeControls() })

const wrapperWith = (initial?: { chainId: string; safeAddress: string }) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <SafeScopeProvider initial={initial}>{children}</SafeScopeProvider>
  }

describe('SafeScopeProvider', () => {
  beforeEach(() => {
    jest.spyOn(useChainsHooks, 'useChain').mockImplementation((chainId: string) => chainsById[chainId])
    mockQuery.mockImplementation((args: { chainId: string; safeAddress: string } | symbol) =>
      typeof args === 'symbol'
        ? { currentData: undefined, error: undefined, isLoading: false, isFetching: false }
        : { currentData: safesByAddress[args.safeAddress], error: undefined, isLoading: false, isFetching: false },
    )
    mockCreateProvider.mockImplementation((chain: { chainId: string }) => ({ chainId: chain.chainId }))
    initSafeSDKSpy = jest
      .spyOn(safeCoreSDK, 'initSafeSDK')
      .mockImplementation(async ({ address }) => ({ sdkFor: address }) as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockTrackError.mockClear()
  })

  it('has no scope until setScope is called', () => {
    const { result } = renderHook(useProbe, { wrapper: wrapperWith() })
    expect(result.current.scope).toBeUndefined()
    expect(mockQuery).toHaveBeenLastCalledWith(expect.any(Symbol), expect.anything())
  })

  it('resolves SafeState, provider and SDK for the initial target', async () => {
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })

    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeA.address.value }))

    expect(result.current.scope).toMatchObject({
      chainId: safeA.chainId,
      safeAddress: safeA.address.value,
      scopeKey: `${safeA.chainId}:${safeA.address.value}`,
      safeLoaded: true,
      safeLoading: false,
      safe: { ...safeA, deployed: true },
      chain: sepolia,
      web3ReadOnly: { chainId: sepolia.chainId },
    })
    expect(initSafeSDKSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: safeA.chainId,
        address: safeA.address.value,
        version: safeA.version,
        isL2Chain: false,
        isZkChain: false,
      }),
    )
  })

  it('switching to a Safe on another chain rebuilds everything and never serves the old Safe', async () => {
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeA.address.value }))
    const firstProvider = result.current.scope?.web3ReadOnly

    act(() => result.current.controls.setScope(safeB.chainId, safeB.address.value))

    // Synchronously after the switch: key and target already point at B, A's SDK is gone.
    expect(result.current.scope?.scopeKey).toBe(`${safeB.chainId}:${safeB.address.value}`)
    expect(result.current.scope?.sdk).toBeUndefined()
    expect(result.current.scope?.safe?.address.value).not.toBe(safeA.address.value)

    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeB.address.value }))
    expect(result.current.scope?.web3ReadOnly).not.toBe(firstProvider)
    expect(result.current.scope?.web3ReadOnly).toEqual({ chainId: polygon.chainId })
    expect(initSafeSDKSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ address: safeB.address.value, isL2Chain: true }),
    )
  })

  it('reports safeLoading=true while a mid-flow switch is in flight, even though isLoading alone is false', async () => {
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeA.address.value }))

    // RTK Query reports `isLoading: false` once any result has ever resolved — simulate the
    // mid-flow switch to B: no data yet, but `isFetching: true`.
    mockQuery.mockImplementation((args: { chainId: string; safeAddress: string } | symbol) =>
      typeof args === 'symbol' || args.safeAddress !== safeB.address.value
        ? {
            currentData: safesByAddress[(args as { safeAddress: string }).safeAddress],
            error: undefined,
            isLoading: false,
            isFetching: false,
          }
        : { currentData: undefined, error: undefined, isLoading: false, isFetching: true },
    )

    act(() => result.current.controls.setScope(safeB.chainId, safeB.address.value))

    expect(result.current.scope?.safeLoading).toBe(true)
    expect(result.current.scope?.safeLoaded).toBe(false)
    expect(result.current.scope?.safe).toBeUndefined()

    // The switch to B re-ran the provider effect; flush its dynamic-import microtask inside act
    // so the resulting setWeb3ReadOnly lands before teardown (keeps the run act()-warning-free).
    await act(async () => {})
  })

  it('keeps safeLoading=false during a background poll of the SAME target (isFetching with data present)', async () => {
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeA.address.value }))

    // Every 15s poll refetch sets `isFetching: true` while `currentData` stays populated —
    // that must NOT read as loading, or scoped consumers flicker on each poll.
    mockQuery.mockImplementation((args: { chainId: string; safeAddress: string } | symbol) =>
      typeof args === 'symbol'
        ? { currentData: undefined, error: undefined, isLoading: false, isFetching: false }
        : {
            currentData: safesByAddress[args.safeAddress],
            error: undefined,
            isLoading: false,
            isFetching: true,
          },
    )
    // Re-render with the poll's flags active (same target, nothing else changes).
    act(() => result.current.controls.setScope(safeA.chainId, safeA.address.value))

    expect(result.current.scope?.safeLoading).toBe(false)
    expect(result.current.scope?.safeLoaded).toBe(true)
    expect(result.current.scope?.safe?.address.value).toBe(safeA.address.value)
  })

  it('switching to a Safe on the SAME chain reuses the provider instance and only resets the SDK', async () => {
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeA.address.value }))
    const firstProvider = result.current.scope?.web3ReadOnly
    const createProviderCallsBeforeSwitch = mockCreateProvider.mock.calls.length

    act(() => result.current.controls.setScope(safeC.chainId, safeC.address.value))

    // Same chain, same custom-RPC lookup → the provider effect's deps are unchanged, so it never
    // re-runs (no new `createWeb3ReadOnly` call): the SDK still resets for the new address though.
    expect(result.current.scope?.web3ReadOnly).toBe(firstProvider)
    expect(mockCreateProvider.mock.calls.length).toBe(createProviderCallsBeforeSwitch)
    expect(result.current.scope?.sdk).toBeUndefined()

    await waitFor(() => expect(result.current.scope?.sdk).toEqual({ sdkFor: safeC.address.value }))
    expect(result.current.scope?.web3ReadOnly).toBe(firstProvider)
    expect(initSafeSDKSpy).toHaveBeenLastCalledWith(expect.objectContaining({ address: safeC.address.value }))
  })

  it('passes the custom RPC for the scope chain to the provider', async () => {
    const customUrl = faker.internet.url()
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeB.chainId, safeAddress: safeB.address.value }),
      initialReduxState: {
        settings: { env: { rpc: { [safeB.chainId]: customUrl }, tenderly: { url: '', accessToken: '' } } } as never,
      },
    })
    await waitFor(() => expect(result.current.scope?.web3ReadOnly).toBeDefined())
    expect(mockCreateProvider).toHaveBeenCalledWith(polygon, customUrl)
  })

  it('reports an SDK init failure via safeError-free sdk=undefined and tracks it', async () => {
    initSafeSDKSpy.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    await waitFor(() => expect(mockTrackError).toHaveBeenCalledWith('105: Error connecting to the blockchain', 'boom'))
    expect(result.current.scope?.sdk).toBeUndefined()
    expect(result.current.scope?.safeLoaded).toBe(true)
  })

  it('clearScope drops the scope and the active counter follows mount/unmount', () => {
    expect(hasActiveScope()).toBe(false)
    const { result, unmount } = renderHook(useProbe, {
      wrapper: wrapperWith({ chainId: safeA.chainId, safeAddress: safeA.address.value }),
    })
    expect(hasActiveScope()).toBe(true)
    act(() => result.current.controls.clearScope())
    expect(result.current.scope).toBeUndefined()
    unmount()
    expect(hasActiveScope()).toBe(false)
  })
})
