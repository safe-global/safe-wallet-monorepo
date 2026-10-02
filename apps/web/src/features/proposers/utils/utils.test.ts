import {
  addressIsNotSmartContract,
  encodeEIP1271Signature,
  signProposerTypedData,
  signProposerTypedDataForSafe,
} from './utils'
import { faker } from '@faker-js/faker'
import { BrowserProvider, JsonRpcSigner, getAddress } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import * as web3Utils from '@safe-global/utils/utils/web3'
import * as delegateUtils from '@safe-global/utils/services/delegates'

jest.mock('@/utils/wallets', () => ({
  isSmartContractWallet: jest.fn(),
}))

const { isSmartContractWallet } = jest.requireMock('@/utils/wallets')

describe('encodeEIP1271Signature', () => {
  const parentSafeAddress = getAddress(faker.finance.ethereumAddress())
  // A typical 65-byte ECDSA signature (r + s + v)
  const ownerSignature =
    '0x' +
    'a'.repeat(64) + // r (32 bytes)
    'b'.repeat(64) + // s (32 bytes)
    '1c' // v (1 byte = 28)

  it('should return a valid hex string', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    expect(result).toMatch(/^0x[0-9a-fA-F]+$/)
  })

  it('should contain the parent Safe address left-padded to 32 bytes in the r-value', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // r is bytes 0-31 (hex chars 2-66, after "0x")
    const rValue = result.slice(2, 66)

    // parentSafeAddress is 20 bytes, left-padded with 12 zero bytes (24 hex chars)
    const expectedR = '0'.repeat(24) + parentSafeAddress.slice(2).toLowerCase()

    expect(rValue.toLowerCase()).toBe(expectedR.toLowerCase())
  })

  it('should have s-value of 65 (0x41) left-padded to 32 bytes', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // s is bytes 32-63 (hex chars 66-130)
    const sValue = result.slice(66, 130)

    // 65 decimal = 0x41, left-padded to 32 bytes
    const expectedS = '0'.repeat(62) + '41'

    expect(sValue).toBe(expectedS)
  })

  it('should have v-value of 0x00 (contract signature type)', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // v is byte 64 (hex chars 130-132)
    const vValue = result.slice(130, 132)

    expect(vValue).toBe('00')
  })

  it('should include length-prefixed owner signature in the dynamic data portion', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // Dynamic data starts at byte 65 (hex char 132)
    const dynamicData = result.slice(132)

    // The dynamic data contains the length-prefixed owner signature
    // Length of ownerSignature = 65 bytes = 0x41
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(65) // 65 bytes for ECDSA signature

    // The actual signature data follows the length
    const sigData = dynamicData.slice(64, 64 + 130) // 65 bytes = 130 hex chars
    expect(sigData.toLowerCase()).toBe(ownerSignature.slice(2).toLowerCase())
  })

  it('should produce consistent output for the same inputs', async () => {
    const result1 = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)
    const result2 = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    expect(result1).toBe(result2)
  })

  it('should correctly encode multi-owner preparedSignature (2 concatenated 65-byte signatures)', async () => {
    // Two 65-byte signatures concatenated (as returned by preparedSignature for a 2/N Safe)
    const sig1 = 'a'.repeat(64) + 'b'.repeat(64) + '1b' // 65 bytes
    const sig2 = 'c'.repeat(64) + 'd'.repeat(64) + '1c' // 65 bytes
    const multiOwnerSignature = '0x' + sig1 + sig2 // 130 bytes total

    const result = await encodeEIP1271Signature(parentSafeAddress, multiOwnerSignature)

    expect(result).toMatch(/^0x[0-9a-fA-F]+$/)

    // r: parent Safe address
    const rValue = result.slice(2, 66)
    const expectedR = '0'.repeat(24) + parentSafeAddress.slice(2).toLowerCase()
    expect(rValue.toLowerCase()).toBe(expectedR.toLowerCase())

    // s: offset 65
    const sValue = result.slice(66, 130)
    expect(sValue).toBe('0'.repeat(62) + '41')

    // v: 0x00
    expect(result.slice(130, 132)).toBe('00')

    // Dynamic data: length should be 130 bytes (2 * 65)
    const dynamicData = result.slice(132)
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(130)

    // The actual multi-owner signature data
    const sigData = dynamicData.slice(64, 64 + 260) // 130 bytes = 260 hex chars
    expect(sigData.toLowerCase()).toBe((sig1 + sig2).toLowerCase())
  })

  it('should correctly encode multi-owner preparedSignature (3 concatenated 65-byte signatures)', async () => {
    // Three 65-byte signatures concatenated (as returned by preparedSignature for a 3/N Safe)
    const sig1 = '1'.repeat(130) // 65 bytes
    const sig2 = '2'.repeat(130) // 65 bytes
    const sig3 = '3'.repeat(130) // 65 bytes
    const multiOwnerSignature = '0x' + sig1 + sig2 + sig3 // 195 bytes total

    const result = await encodeEIP1271Signature(parentSafeAddress, multiOwnerSignature)

    // Dynamic data: length should be 195 bytes
    const dynamicData = result.slice(132)
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(195)

    // The actual multi-owner signature data
    const sigData = dynamicData.slice(64, 64 + 390) // 195 bytes = 390 hex chars
    expect(sigData.toLowerCase()).toBe((sig1 + sig2 + sig3).toLowerCase())
  })
})

const queueServiceChain = () =>
  chainBuilder()
    .with({ features: [FEATURES.QUEUE_SERVICE] })
    .build()
const transactionServiceChain = () => chainBuilder().with({ features: [] }).build()

const createSigner = () =>
  new JsonRpcSigner(new BrowserProvider({ request: jest.fn() }), faker.finance.ethereumAddress())

describe('signProposerTypedData', () => {
  const proposerAddress = getAddress(faker.finance.ethereumAddress())
  const safeAddress = getAddress(faker.finance.ethereumAddress())
  const signatureRs = faker.string.hexadecimal({ length: 128, casing: 'lower' })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('signs the transaction service typed data through ethers on a chain without QUEUE_SERVICE', async () => {
    const chain = transactionServiceChain()
    const signer = createSigner()
    const signature = `${signatureRs}1b`
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(signature)
    const send = jest.spyOn(signer.provider, 'send')

    const result = await signProposerTypedData(chain, proposerAddress, safeAddress, 'add', signer)

    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      signer,
      delegateUtils.getDelegateTypedData(chain, proposerAddress, safeAddress, 'add'),
    )
    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      signer,
      expect.objectContaining({ domain: expect.objectContaining({ name: 'Safe Transaction Service' }) }),
    )
    expect(send).not.toHaveBeenCalled()
    expect(result).toBe(signature)
  })

  it('signs the queue service typed data with raw eth_signTypedData_v4 on a chain with QUEUE_SERVICE', async () => {
    const chain = queueServiceChain()
    const signer = createSigner()
    jest.spyOn(web3Utils, 'signTypedData')
    const send = jest.spyOn(signer.provider, 'send').mockResolvedValue(`${signatureRs}00`)

    const result = await signProposerTypedData(chain, proposerAddress, safeAddress, 'delete', signer)

    const typedData = delegateUtils.getDelegateTypedData(chain, proposerAddress, safeAddress, 'delete')
    expect(typedData.domain.name).toBe('Safe Queue Service')
    expect(send).toHaveBeenCalledWith('eth_signTypedData_v4', [signer.address.toLowerCase(), JSON.stringify(typedData)])
    expect(web3Utils.signTypedData).not.toHaveBeenCalled()
    expect(result).toBe(`${signatureRs}1b`)
  })
})

describe('signProposerTypedDataForSafe', () => {
  const mockProposerAddress = getAddress(faker.finance.ethereumAddress())
  const mockParentSafeAddress = getAddress(faker.finance.ethereumAddress())
  const mockSafeAddress = getAddress(faker.finance.ethereumAddress())
  const mockSignature = '0x' + 'ab'.repeat(65)
  const mockDelegateHash = '0x' + 'dd'.repeat(32)
  const mockSigner = {} as JsonRpcSigner

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe.each([
    { service: 'queue service', createChain: queueServiceChain },
    { service: 'transaction service', createChain: transactionServiceChain },
  ])('on a $service chain', ({ createChain }) => {
    it('should hash the delegate typed data and sign the SafeMessage-wrapped hash', async () => {
      const chain = createChain()
      jest.spyOn(delegateUtils, 'hashDelegateTypedData').mockReturnValue(mockDelegateHash)
      jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

      const result = await signProposerTypedDataForSafe(
        chain,
        mockProposerAddress,
        mockParentSafeAddress,
        mockSafeAddress,
        'add',
        mockSigner,
      )

      // Should hash the delegate typed data first
      expect(delegateUtils.hashDelegateTypedData).toHaveBeenCalledWith(
        delegateUtils.getDelegateTypedData(chain, mockProposerAddress, mockSafeAddress, 'add'),
      )

      // Should sign the SafeMessage typed data (not the raw delegate typed data)
      expect(web3Utils.signTypedData).toHaveBeenCalledWith(
        mockSigner,
        expect.objectContaining({
          domain: {
            verifyingContract: mockParentSafeAddress,
            chainId: Number(chain.chainId),
          },
          types: {
            SafeMessage: [{ type: 'bytes', name: 'message' }],
          },
          message: {
            message: mockDelegateHash,
          },
          primaryType: 'SafeMessage',
        }),
      )

      expect(result).toBe(mockSignature)
    })

    it('wraps the hash of the delegate typed data for the chain', async () => {
      const chain = createChain()
      jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

      await signProposerTypedDataForSafe(
        chain,
        mockProposerAddress,
        mockParentSafeAddress,
        mockSafeAddress,
        'delete',
        mockSigner,
      )

      const expectedHash = delegateUtils.hashDelegateTypedData(
        delegateUtils.getDelegateTypedData(chain, mockProposerAddress, mockSafeAddress, 'delete'),
      )
      expect(web3Utils.signTypedData).toHaveBeenCalledWith(
        mockSigner,
        expect.objectContaining({ message: { message: expectedHash } }),
      )
    })
  })

  it('should use the correct parent Safe address in the domain', async () => {
    const specificParentSafe = getAddress(faker.finance.ethereumAddress())
    jest.spyOn(delegateUtils, 'hashDelegateTypedData').mockReturnValue(mockDelegateHash)
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

    await signProposerTypedDataForSafe(
      queueServiceChain(),
      mockProposerAddress,
      specificParentSafe,
      mockSafeAddress,
      'add',
      mockSigner,
    )

    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      mockSigner,
      expect.objectContaining({
        domain: expect.objectContaining({
          verifyingContract: specificParentSafe,
        }),
      }),
    )
  })

  it('should use the correct chainId in the domain', async () => {
    const chain = transactionServiceChain()
    jest.spyOn(delegateUtils, 'hashDelegateTypedData').mockReturnValue(mockDelegateHash)
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

    await signProposerTypedDataForSafe(
      chain,
      mockProposerAddress,
      mockParentSafeAddress,
      mockSafeAddress,
      'add',
      mockSigner,
    )

    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      mockSigner,
      expect.objectContaining({
        domain: expect.objectContaining({
          chainId: Number(chain.chainId),
        }),
      }),
    )
  })
})

describe('addressIsNotSmartContract', () => {
  const message = 'Cannot add a smart contract account as proposer'
  const chainId = '1'

  beforeEach(() => {
    isSmartContractWallet.mockReset()
  })

  it('returns the message for a smart contract address', async () => {
    isSmartContractWallet.mockResolvedValue(true)
    const address = getAddress(faker.finance.ethereumAddress())

    await expect(addressIsNotSmartContract(chainId, message)(address)).resolves.toBe(message)
    expect(isSmartContractWallet).toHaveBeenCalledWith(chainId, address)
  })

  it('returns undefined for an EOA', async () => {
    isSmartContractWallet.mockResolvedValue(false)
    const address = getAddress(faker.finance.ethereumAddress())

    await expect(addressIsNotSmartContract(chainId, message)(address)).resolves.toBeUndefined()
  })

  it('returns undefined when the contract check fails', async () => {
    isSmartContractWallet.mockRejectedValue(new Error('Provider not found'))
    const address = getAddress(faker.finance.ethereumAddress())

    await expect(addressIsNotSmartContract(chainId, message)(address)).resolves.toBeUndefined()
  })
})
