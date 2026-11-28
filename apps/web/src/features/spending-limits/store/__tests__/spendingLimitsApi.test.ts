import type { JsonRpcProvider } from 'ethers'
import { faker } from '@faker-js/faker'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { listenerMiddlewareInstance, makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { Errors, logError } from '@/services/exceptions'
import { loadSpendingLimits } from '../../services/spendingLimitLoader'
import { spendingLimitsApi, type SpendingLimitsArgs } from '../spendingLimitsApi'

jest.mock('@/hooks/wallets/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ ...jest.requireActual('@/services/exceptions'), logError: jest.fn() }))
jest.mock('../../services/spendingLimitLoader', () => ({ loadSpendingLimits: jest.fn() }))

const mockGetProvider = jest.mocked(getReadOnlyProvider)
const mockLoad = jest.mocked(loadSpendingLimits)
const provider = {} as JsonRpcProvider
const chain = chainBuilder().build()

const argsFor = (overrides: Partial<SpendingLimitsArgs> = {}): SpendingLimitsArgs => ({
  chainId: chain.chainId,
  safeAddress: faker.finance.ethereumAddress(),
  moduleAddresses: [faker.finance.ethereumAddress()],
  ...overrides,
})

const setupStore = async (chains: Chain[] = [chain]) => {
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

const read = (store: Awaited<ReturnType<typeof setupStore>>, args: SpendingLimitsArgs) =>
  store.dispatch(spendingLimitsApi.endpoints.getSpendingLimits.initiate(args))

describe('spendingLimitsApi.getSpendingLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    listenerMiddlewareInstance.clearListeners()
    mockGetProvider.mockResolvedValue(provider)
  })

  it("reads the Safe's limits through its modules", async () => {
    const store = await setupStore()
    const spendingLimits = [spendingLimitStateBuilder().build()]
    mockLoad.mockResolvedValue(spendingLimits)
    const args = argsFor()

    await expect(read(store, args).unwrap()).resolves.toEqual(spendingLimits)

    const modules = args.moduleAddresses.map((value) => ({ value }))
    expect(mockLoad).toHaveBeenCalledWith(provider, modules, args.safeAddress, chain.chainId, expect.any(Object))
  })

  it('names the native token from the chain config', async () => {
    const store = await setupStore()
    mockLoad.mockResolvedValue([])

    await read(store, argsFor()).unwrap()

    const [, , , , nativeToken] = mockLoad.mock.lastCall ?? []
    expect(nativeToken).toEqual({ ...chain.nativeCurrency, address: ZERO_ADDRESS, type: 'NATIVE_TOKEN' })
  })

  it('returns no limits when the Safe has no spending limit module', async () => {
    const store = await setupStore()
    mockLoad.mockResolvedValue(undefined)

    await expect(read(store, argsFor()).unwrap()).resolves.toEqual([])
  })

  it('returns no limits without a read when the Safe has no modules', async () => {
    const store = await setupStore()

    await expect(read(store, argsFor({ moduleAddresses: [] })).unwrap()).resolves.toEqual([])
    expect(mockGetProvider).not.toHaveBeenCalled()
  })

  it('reads through the custom RPC given in the args', async () => {
    const store = await setupStore()
    mockLoad.mockResolvedValue([])
    const customRpc = faker.internet.url()

    await read(store, argsFor({ customRpc })).unwrap()

    expect(mockGetProvider).toHaveBeenCalledWith(chain, customRpc)
  })

  it('reads once for many subscribers of the same Safe', async () => {
    const store = await setupStore()
    mockLoad.mockResolvedValue([])
    const args = argsFor()

    await Promise.all([read(store, args).unwrap(), read(store, args).unwrap(), read(store, args).unwrap()])

    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('logs and returns an error without a read when the chain config is missing', async () => {
    const store = await setupStore([])

    await expect(read(store, argsFor()).unwrap()).rejects.toThrow(chain.chainId)
    expect(mockGetProvider).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(Errors._609, expect.any(Error), expect.any(Object))
  })

  it('returns an error when the chain has no RPC', async () => {
    const store = await setupStore()
    mockGetProvider.mockResolvedValue(undefined)

    await expect(read(store, argsFor()).unwrap()).rejects.toThrow(chain.chainId)
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('logs and returns the read error', async () => {
    const store = await setupStore()
    const rpcError = new Error(faker.lorem.sentence())
    mockLoad.mockRejectedValue(rpcError)

    await expect(read(store, argsFor()).unwrap()).rejects.toBe(rpcError)
    expect(logError).toHaveBeenCalledWith(Errors._609, rpcError, expect.any(Object))
  })
})
