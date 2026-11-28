import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import type { JsonRpcProvider } from 'ethers'
import { act, renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { listenerMiddlewareInstance, makeStore } from '@/store'
import { safeInfoSlice } from '@/store/safeInfoSlice'
import { useHasFeature } from '@/hooks/useChains'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '../../types'
import { loadSpendingLimits } from '../../../services/spendingLimitLoader'
import useSpendingLimits, { SPENDING_LIMITS_RETRY_MS } from '../useSpendingLimits'

jest.mock('@/hooks/useChains', () => ({ __esModule: true, useHasFeature: jest.fn() }))
jest.mock('@/hooks/wallets/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('../../../services/spendingLimitLoader', () => ({ loadSpendingLimits: jest.fn() }))

const mockLoad = jest.mocked(loadSpendingLimits)
const chain = chainBuilder().build()
const otherChain = chainBuilder()
  .with({ chainId: `${chain.chainId}1` })
  .build()

const safeWithModule = (): ExtendedSafeInfo =>
  extendedSafeInfoBuilder()
    .with({ chainId: chain.chainId, modules: [addressExBuilder().build()], txHistoryTag: faker.string.numeric(8) })
    .build()

const limitsOf = (count: number): SpendingLimitState[] =>
  Array.from({ length: count }, () => spendingLimitStateBuilder().build())

const setSafe = (store: ReturnType<typeof makeStore>, safe: ExtendedSafeInfo) =>
  act(() => {
    store.dispatch(safeInfoSlice.actions.set({ data: safe, loading: false, loaded: true }))
  })

const renderWithSafe = async (safe: ExtendedSafeInfo) => {
  const store = makeStore()
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(chainsInitialState, [chain, otherChain]),
    ),
  )
  setSafe(store, safe)
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return { store, ...renderHook(() => useSpendingLimits(), { wrapper }) }
}

describe('useSpendingLimits', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    listenerMiddlewareInstance.clearListeners()
    jest.mocked(useHasFeature).mockReturnValue(true)
    jest.mocked(getReadOnlyProvider).mockResolvedValue({} as JsonRpcProvider)
  })

  it('returns the limits of the open Safe once they are read', async () => {
    const spendingLimits = limitsOf(2)
    mockLoad.mockResolvedValue(spendingLimits)

    const { result } = await renderWithSafe(safeWithModule())

    expect(result.current).toEqual({ spendingLimits: [], loading: true })
    await waitFor(() => expect(result.current).toEqual({ spendingLimits, loading: false }))
  })

  it('reads nothing when the chain has spending limits off', async () => {
    jest.mocked(useHasFeature).mockReturnValue(false)

    const { result } = await renderWithSafe(safeWithModule())

    expect(result.current).toEqual({ spendingLimits: [], loading: false })
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('reads nothing for a Safe without modules', async () => {
    const { result } = await renderWithSafe(extendedSafeInfoBuilder().with({ chainId: chain.chainId }).build())

    await waitFor(() => expect(result.current).toEqual({ spendingLimits: [], loading: false }))
    expect(getReadOnlyProvider).not.toHaveBeenCalled()
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('keeps the limits while it reads them again after a new transaction', async () => {
    const [before, after] = [limitsOf(1), limitsOf(2)]
    let finishRead: (limits: SpendingLimitState[]) => void = () => {}
    mockLoad.mockResolvedValueOnce(before).mockReturnValueOnce(new Promise((resolve) => (finishRead = resolve)))
    const safe = safeWithModule()
    const { store, result } = await renderWithSafe(safe)
    await waitFor(() => expect(result.current.spendingLimits).toEqual(before))

    setSafe(store, { ...safe, txHistoryTag: faker.string.numeric(9) })

    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2))
    expect(result.current).toEqual({ spendingLimits: before, loading: false })
    finishRead(after)
    await waitFor(() => expect(result.current.spendingLimits).toEqual(after))
  })

  it('reads nothing again when the Safe is polled without a new transaction', async () => {
    mockLoad.mockResolvedValue(limitsOf(1))
    const safe = safeWithModule()
    const { store, result } = await renderWithSafe(safe)
    await waitFor(() => expect(result.current.loading).toBe(false))

    setSafe(store, { ...safe, modules: safe.modules?.map((module) => ({ ...module })) })
    await act(() => jest.advanceTimersByTimeAsync(1_000))

    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('returns no limits when the read fails', async () => {
    mockLoad.mockRejectedValue(new Error(faker.lorem.sentence()))

    const { result } = await renderWithSafe(safeWithModule())

    await waitFor(() => expect(mockLoad).toHaveBeenCalled())
    await waitFor(() => expect(result.current).toEqual({ spendingLimits: [], loading: false }))
  })

  it('reads a failed read again after the retry interval', async () => {
    const spendingLimits = limitsOf(1)
    mockLoad.mockRejectedValueOnce(new Error(faker.lorem.sentence())).mockResolvedValue(spendingLimits)
    const { result } = await renderWithSafe(safeWithModule())
    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1))

    await act(() => jest.advanceTimersByTimeAsync(SPENDING_LIMITS_RETRY_MS))

    await waitFor(() => expect(result.current.spendingLimits).toEqual(spendingLimits))
  })

  it('shows none of the previous Safe limits while it reads another Safe', async () => {
    mockLoad.mockResolvedValueOnce(limitsOf(1)).mockReturnValueOnce(new Promise(() => {}))
    const { store, result } = await renderWithSafe(safeWithModule())
    await waitFor(() => expect(result.current.spendingLimits).toHaveLength(1))

    setSafe(store, safeWithModule())

    await waitFor(() => expect(result.current).toEqual({ spendingLimits: [], loading: true }))
  })

  it('shows none of the limits of the same address on another chain', async () => {
    mockLoad.mockResolvedValueOnce(limitsOf(1)).mockReturnValueOnce(new Promise(() => {}))
    const safe = safeWithModule()
    const { store, result } = await renderWithSafe(safe)
    await waitFor(() => expect(result.current.spendingLimits).toHaveLength(1))

    setSafe(store, { ...safe, chainId: otherChain.chainId })

    await waitFor(() => expect(result.current).toEqual({ spendingLimits: [], loading: true }))
  })
})
