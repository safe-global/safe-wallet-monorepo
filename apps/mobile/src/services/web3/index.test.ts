import type Safe from '@safe-global/protocol-kit'
import { createMockChain, createMockSafeInfo, generatePrivateKey } from '@safe-global/test'
import { setSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createConnectedWallet } from '@/src/services/web3'

const createReadOnlySDK = (address: string, chainId: string) => {
  const signerSDK = { signer: true } as unknown as Safe
  const readOnlySDK = {
    getAddress: jest.fn().mockResolvedValue(address),
    getChainId: jest.fn().mockResolvedValue(BigInt(chainId)),
    connect: jest.fn().mockResolvedValue(signerSDK),
  }
  return { readOnlySDK, signerSDK }
}

describe('createConnectedWallet', () => {
  const chain = createMockChain({ chainId: '100', rpcUri: 'https://rpc.gnosischain.com' })
  const activeSafe = createMockSafeInfo({ chainId: '100' })
  const privateKey = generatePrivateKey()

  afterEach(() => {
    setSafeSDK(undefined)
  })

  it('derives the signer SDK from the read-only SDK so its resolved contract addresses are kept', async () => {
    const { readOnlySDK, signerSDK } = createReadOnlySDK(activeSafe.address.toLowerCase(), '100')
    setSafeSDK(readOnlySDK as unknown as Safe)

    const { wallet, protocolKit } = await createConnectedWallet(privateKey, activeSafe, chain)

    expect(protocolKit).toBe(signerSDK)
    expect(readOnlySDK.connect).toHaveBeenCalledWith({
      provider: 'https://rpc.gnosischain.com',
      signer: privateKey,
      safeAddress: activeSafe.address,
    })
    expect(wallet.privateKey).toBe(privateKey.toLowerCase())
  })

  it('throws when the read-only SDK is not initialized', async () => {
    await expect(createConnectedWallet(privateKey, activeSafe, chain)).rejects.toThrow('Safe SDK is not initialized')
  })

  it('throws when the read-only SDK belongs to another Safe', async () => {
    const { readOnlySDK } = createReadOnlySDK(createMockSafeInfo().address, '100')
    setSafeSDK(readOnlySDK as unknown as Safe)

    await expect(createConnectedWallet(privateKey, activeSafe, chain)).rejects.toThrow(`not 100:${activeSafe.address}`)
    expect(readOnlySDK.connect).not.toHaveBeenCalled()
  })

  it('throws when the read-only SDK is for the same address on another chain', async () => {
    const { readOnlySDK } = createReadOnlySDK(activeSafe.address, '1')
    setSafeSDK(readOnlySDK as unknown as Safe)

    await expect(createConnectedWallet(privateKey, activeSafe, chain)).rejects.toThrow(
      `Safe SDK is initialized for 1:${activeSafe.address}`,
    )
    expect(readOnlySDK.connect).not.toHaveBeenCalled()
  })
})
