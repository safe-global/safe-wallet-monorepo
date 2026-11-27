import type { JsonRpcProvider } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import { getSharedReadOnlyProvider } from '@/hooks/wallets/sharedReadOnlyProvider'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { getReadOnlyProvider } from '../getReadOnlyProvider'

jest.mock('@/hooks/wallets/sharedReadOnlyProvider', () => ({ getSharedReadOnlyProvider: jest.fn() }))

const mockShared = getSharedReadOnlyProvider as jest.MockedFunction<typeof getSharedReadOnlyProvider>
const sepolia = chainBuilder().with({ chainId: '11155111' }).build()
const providerOn = (chainId: number) =>
  ({ getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(chainId) }) }) as unknown as JsonRpcProvider

describe('getReadOnlyProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockShared.mockReset()
  })

  it("reuses the global provider when it is on the Safe's chain", async () => {
    const global = providerOn(11155111)
    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockReturnValue(global)
    await expect(getReadOnlyProvider(sepolia)).resolves.toBe(global)
    expect(mockShared).not.toHaveBeenCalled()
  })

  it('uses the shared provider for another chain, with the custom RPC', async () => {
    const shared = providerOn(11155111)
    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockReturnValue(providerOn(1))
    mockShared.mockReturnValue(shared)
    await expect(getReadOnlyProvider(sepolia, 'https://custom.rpc')).resolves.toBe(shared)
    expect(mockShared).toHaveBeenCalledWith(sepolia, 'https://custom.rpc')
  })

  it('uses the shared provider when there is no global provider', async () => {
    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockReturnValue(undefined)
    mockShared.mockReturnValue(undefined)
    await expect(getReadOnlyProvider(sepolia)).resolves.toBeUndefined()
    expect(mockShared).toHaveBeenCalledWith(sepolia, undefined)
  })
})
