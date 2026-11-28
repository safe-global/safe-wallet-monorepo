import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import type { JsonRpcProvider } from 'ethers'
import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { listenerMiddlewareInstance, makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { useHasFeature } from '@/hooks/useChains'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { SafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { Errors, logError } from '@/services/exceptions'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { tokenOptionBuilder } from '@/utils/tokenOptions.testData'
import useSpendingLimitTokenOptions from '@/hooks/useSpendingLimitTokenOptions'
import { ExistingSpendingLimitsProvider, useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/spending-limits/public/services/spendingLimitLoader', () => ({
  loadSpendingLimits: (...args: unknown[]) => mockLoad(...args),
}))
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))
jest.mock('@/hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ __esModule: true, useHasFeature: jest.fn() }))
jest.mock('@/hooks/wallets/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))

const mockUseSafeScope = useSafeScope as jest.MockedFunction<typeof useSafeScope>
const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>
const mockLoad = jest.fn()

const provider = { send: jest.fn() } as unknown as JsonRpcProvider
const usdc = tokenOptionBuilder().with({ symbol: 'USDC', decimals: 6 }).build()

const scopeFor = (safeAddress: string, modules = [addressExBuilder().build()]): SafeScope => ({
  chainId: '1',
  safeAddress,
  scopeKey: `1:${safeAddress}`,
  safeLoaded: true,
  safeLoading: false,
  safe: extendedSafeInfoBuilder().with({ chainId: '1', modules }).build(),
  web3ReadOnly: provider,
})

const storeWithChain = () => {
  const store = makeStore()
  store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryEntries([
      {
        endpointName: 'getChainsConfigV2',
        arg: CONFIG_SERVICE_KEY,
        value: chainsAdapter.setAll(chainsInitialState, [chainBuilder().with({ chainId: '1' }).build()]),
      },
    ]),
  )
  return store
}

const renderLimits = (inProvider = true, store = storeWithChain()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      {inProvider ? <ExistingSpendingLimitsProvider>{children}</ExistingSpendingLimitsProvider> : children}
    </Provider>
  )
  return renderHook(() => useExistingSpendingLimits(), { wrapper })
}

describe('ExistingSpendingLimitsProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    listenerMiddlewareInstance.clearListeners()
    jest.mocked(useHasFeature).mockReturnValue(true)
    jest.mocked(getReadOnlyProvider).mockResolvedValue(provider)
    mockUseOptions.mockReturnValue({
      options: [usdc],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isPopularLoading: false,
      isPopularError: false,
      refetchPopular: jest.fn(),
      identityKey: '',
    })
  })

  it('knows nothing outside the provider', () => {
    const { result } = renderLimits(false)

    expect(result.current).toEqual({ loading: false })
  })

  it('loads nothing while no Safe is selected', () => {
    mockUseSafeScope.mockReturnValue(undefined)

    const { result } = renderLimits()

    expect(result.current.limits).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('loads nothing while spending limits are disabled on the chain', async () => {
    jest.mocked(useHasFeature).mockReturnValue(false)
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))

    const { result } = renderLimits()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current.loading).toBe(false)
    expect(result.current.limits).toBeUndefined()
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it("loads the selected Safe's limits once through its modules", async () => {
    const scope = scopeFor(faker.finance.ethereumAddress())
    const limits = [spendingLimitStateBuilder().build()]
    mockUseSafeScope.mockReturnValue(scope)
    mockLoad.mockResolvedValue(limits)

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.limits).toEqual(limits))
    expect(mockLoad).toHaveBeenCalledTimes(1)
    const modules = scope.safe?.modules?.map(({ value }) => ({ value }))
    expect(mockLoad).toHaveBeenCalledWith(provider, modules, scope.safe?.address.value, '1', expect.any(Array))
  })

  it('keeps the same limits when a balance poll gives new token options', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    mockLoad.mockResolvedValue([spendingLimitStateBuilder().build()])
    const { result, rerender } = renderLimits()
    await waitFor(() => expect(result.current.limits).toHaveLength(1))
    const limits = result.current.limits

    mockUseOptions.mockReturnValue({ ...mockUseOptions(), options: [{ ...usdc }] })
    rerender()

    expect(result.current.limits).toBe(limits)
  })

  it('reads the chain again when the flow opens again', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    mockLoad.mockResolvedValue([])
    const store = storeWithChain()
    const first = renderLimits(true, store)
    await waitFor(() => expect(first.result.current.limits).toEqual([]))
    first.unmount()

    renderLimits(true, store)

    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2))
  })

  it('shows none of the limits of an earlier read while the flow reads them again', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    mockLoad.mockResolvedValueOnce([spendingLimitStateBuilder().build()]).mockReturnValueOnce(new Promise(() => {}))
    const store = storeWithChain()
    const first = renderLimits(true, store)
    await waitFor(() => expect(first.result.current.limits).toHaveLength(1))
    first.unmount()

    const { result } = renderLimits(true, store)

    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2))
    expect(result.current).toEqual({ limits: undefined, loading: true, error: undefined })
  })

  it('takes the symbol and decimals of a limit from the token options, not the chain fallback', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    const limit = spendingLimitStateBuilder().build()
    mockLoad.mockResolvedValue([{ ...limit, token: { address: usdc.address, symbol: '', decimals: 18 } }])

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.limits?.[0].token).toMatchObject({ symbol: 'USDC', decimals: 6 }))
  })

  it('takes the token logo of a limit from the token options', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    const limit = spendingLimitStateBuilder().build()
    mockLoad.mockResolvedValue([{ ...limit, token: { address: usdc.address, symbol: 'USDC', decimals: 6 } }])

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.limits?.[0].token.logoUri).toBe(usdc.logoUri))
  })

  it('resolves an empty list for a Safe without modules, without asking the chain', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress(), []))

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.limits).toEqual([]))
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('treats a loader that finds no module as an empty list', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    mockLoad.mockResolvedValue(undefined)

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.limits).toEqual([]))
  })

  it('reloads when the selected Safe changes', async () => {
    const first = scopeFor(faker.finance.ethereumAddress())
    const second = scopeFor(faker.finance.ethereumAddress())
    mockUseSafeScope.mockReturnValue(first)
    mockLoad.mockResolvedValue([])

    const { result, rerender } = renderLimits()
    await waitFor(() => expect(result.current.limits).toEqual([]))

    mockUseSafeScope.mockReturnValue(second)
    rerender()

    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2))
    expect(mockLoad).toHaveBeenLastCalledWith(
      provider,
      expect.any(Array),
      second.safe?.address.value,
      '1',
      expect.any(Array),
    )
  })

  it('logs and exposes a failed load, leaving the limits unknown', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    const failure = new Error(faker.lorem.sentence())
    mockLoad.mockRejectedValue(failure)

    const { result } = renderLimits()

    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(result.current.limits).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(Errors._609, failure, expect.anything())
  })
})
