import type { JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { getReadOnlyProvider } from '../../services/getReadOnlyProvider'
import { moduleGuardApi } from '../moduleGuardApi'

jest.mock('../../services/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const mockGetProvider = getReadOnlyProvider as jest.MockedFunction<typeof getReadOnlyProvider>
const GUARD = '0x5202B1ebE100812437d47eae769e155945fbba6a'
const SAFE = '0x3333333333333333333333333333333333333333'
const slotOf = (address: string) => `0x${'0'.repeat(24)}${address.slice(2).toLowerCase()}`
const sepolia = chainBuilder().with({ chainId: '11155111' }).build()

const setupStore = async (chains = [sepolia]) => {
  const store = makeStore()
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(chainsInitialState, chains),
    ),
  )
  return store
}

const mockStorage = (getStorage: jest.Mock) =>
  mockGetProvider.mockResolvedValue({ getStorage } as unknown as JsonRpcProvider)

const read = (store: Awaited<ReturnType<typeof setupStore>>, txHistoryTag = '1') =>
  store.dispatch(
    moduleGuardApi.endpoints.getModuleGuard.initiate({ chainId: '11155111', safeAddress: SAFE, txHistoryTag }),
  )

describe('moduleGuardApi.getModuleGuard', () => {
  beforeEach(() => mockGetProvider.mockReset())

  it('reads the module guard of the Safe', async () => {
    const store = await setupStore()
    const getStorage = jest.fn().mockResolvedValue(slotOf(GUARD))
    mockStorage(getStorage)
    await expect(read(store).unwrap()).resolves.toBe(GUARD)
    expect(getStorage).toHaveBeenCalledWith(SAFE, expect.any(String))
  })

  it('reads through the custom RPC given in the args', async () => {
    const store = await setupStore()
    mockStorage(jest.fn().mockResolvedValue(slotOf(GUARD)))
    await store
      .dispatch(
        moduleGuardApi.endpoints.getModuleGuard.initiate({
          chainId: '11155111',
          safeAddress: SAFE,
          txHistoryTag: '1',
          customRpc: 'https://custom.rpc',
        }),
      )
      .unwrap()
    expect(mockGetProvider).toHaveBeenCalledWith(sepolia, 'https://custom.rpc')
  })

  it('reads again when the custom RPC changes', async () => {
    const store = await setupStore()
    const getStorage = jest.fn().mockResolvedValue(slotOf(GUARD))
    mockStorage(getStorage)
    const args = { chainId: '11155111', safeAddress: SAFE, txHistoryTag: '1' }
    await store.dispatch(moduleGuardApi.endpoints.getModuleGuard.initiate(args)).unwrap()
    await store
      .dispatch(moduleGuardApi.endpoints.getModuleGuard.initiate({ ...args, customRpc: 'https://custom.rpc' }))
      .unwrap()
    expect(getStorage).toHaveBeenCalledTimes(2)
  })

  it('reads once for many subscribers of the same Safe', async () => {
    const store = await setupStore()
    const getStorage = jest.fn().mockResolvedValue(slotOf(GUARD))
    mockStorage(getStorage)
    await Promise.all([read(store).unwrap(), read(store).unwrap(), read(store).unwrap()])
    expect(getStorage).toHaveBeenCalledTimes(1)
  })

  it('reads again after the Safe executes a transaction', async () => {
    const store = await setupStore()
    const getStorage = jest.fn().mockResolvedValue(slotOf(GUARD))
    mockStorage(getStorage)
    await read(store, '1').unwrap()
    await read(store, '2').unwrap()
    expect(getStorage).toHaveBeenCalledTimes(2)
  })

  it('returns an error when the chain has no RPC', async () => {
    const store = await setupStore()
    mockGetProvider.mockResolvedValue(undefined)
    await expect(read(store).unwrap()).rejects.toBeInstanceOf(Error)
  })

  it('returns an error when the chain config is missing', async () => {
    const store = await setupStore([])
    await expect(read(store).unwrap()).rejects.toBeInstanceOf(Error)
    expect(mockGetProvider).not.toHaveBeenCalled()
  })

  it('returns the read error', async () => {
    const store = await setupStore()
    const rpcError = new Error('rpc down')
    mockStorage(jest.fn().mockRejectedValue(rpcError))
    await expect(read(store).unwrap()).rejects.toBe(rpcError)
  })

  it('keeps the previous error on the entry while it is read again', async () => {
    const store = await setupStore()
    const rpcError = new Error('rpc down')
    let resolveRetry: (value: string) => void = () => {}
    mockStorage(
      jest
        .fn()
        .mockRejectedValueOnce(rpcError)
        .mockReturnValueOnce(new Promise<string>((resolve) => (resolveRetry = resolve))),
    )
    const args = { chainId: '11155111', safeAddress: SAFE, txHistoryTag: '1' }
    const subscription = store.dispatch(moduleGuardApi.endpoints.getModuleGuard.initiate(args))
    await subscription.unwrap().catch(() => {})

    const retry = subscription.refetch()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const pending = moduleGuardApi.endpoints.getModuleGuard.select(args)(store.getState())
    expect(pending.status).toBe('pending')
    expect(pending.error).toBe(rpcError)

    resolveRetry(slotOf(GUARD))
    await retry
  })
})
