import { AbiCoder, type JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { getReadOnlyProvider } from '../../services/getReadOnlyProvider'
import { guardDelayApi } from '../guardDelayApi'

jest.mock('../../services/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const mockGetProvider = getReadOnlyProvider as jest.MockedFunction<typeof getReadOnlyProvider>
const GUARD = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'
const sepolia = chainBuilder().with({ chainId: '11155111' }).build()
const encodedDelay = (seconds: number) => AbiCoder.defaultAbiCoder().encode(['uint256'], [seconds])

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

const read = (store: Awaited<ReturnType<typeof setupStore>>) =>
  store.dispatch(guardDelayApi.endpoints.getGuardDelay.initiate({ chainId: '11155111', guardAddress: GUARD }))

describe('guardDelayApi.getGuardDelay', () => {
  beforeEach(() => mockGetProvider.mockReset())

  it('should return the delay of the guard, when the chain has an RPC', async () => {
    const store = await setupStore()
    const call = jest.fn().mockResolvedValue(encodedDelay(600))
    mockGetProvider.mockResolvedValue({ call } as unknown as JsonRpcProvider)

    await expect(read(store).unwrap()).resolves.toBe(600)
    expect(call).toHaveBeenCalledWith(expect.objectContaining({ to: GUARD }))
  })

  it('should read once, when several readers ask for the same guard', async () => {
    const store = await setupStore()
    const call = jest.fn().mockResolvedValue(encodedDelay(180))
    mockGetProvider.mockResolvedValue({ call } as unknown as JsonRpcProvider)

    await Promise.all([read(store).unwrap(), read(store).unwrap()])

    expect(call).toHaveBeenCalledTimes(1)
  })

  it('should return an error without reading, when the chain config is missing', async () => {
    const store = await setupStore([])

    await expect(read(store).unwrap()).rejects.toBeInstanceOf(Error)
    expect(mockGetProvider).not.toHaveBeenCalled()
  })
})
