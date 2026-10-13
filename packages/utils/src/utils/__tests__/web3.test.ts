import { faker } from '@faker-js/faker'
import { TypedDataEncoder, concat, getAddress, keccak256 } from 'ethers'
import type { JsonRpcSigner } from 'ethers'
import { hashTypedData, normalizeTypedData, signTypedData } from '@safe-global/utils/utils/web3'

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'safe', type: 'address' },
]

const Delegate = [
  { name: 'delegateAddress', type: 'address' },
  { name: 'totp', type: 'uint256' },
  { name: 'action', type: 'string' },
]

const queueServiceDelegateMessage = () => ({
  domain: {
    name: 'Safe Queue Service',
    version: '1.0',
    chainId: faker.number.int({ min: 1, max: 100_000 }),
    safe: getAddress(faker.finance.ethereumAddress()),
  },
  types: { EIP712Domain, Delegate },
  message: {
    delegateAddress: getAddress(faker.finance.ethereumAddress()),
    totp: faker.number.int({ min: 1, max: 1_000_000 }),
    action: faker.helpers.arrayElement(['add', 'delete', 'edit']),
  },
  primaryType: 'Delegate',
})

describe('web3', () => {
  describe('hashTypedData', () => {
    it('hashes a queue service delegate message, whose domain has a safe field', () => {
      const typedData = queueServiceDelegateMessage()

      expect(hashTypedData(typedData)).toBe(
        keccak256(
          concat([
            '0x1901',
            TypedDataEncoder.hashStruct('EIP712Domain', { EIP712Domain }, typedData.domain),
            TypedDataEncoder.hashStruct('Delegate', { Delegate }, typedData.message),
          ]),
        ),
      )
    })
  })

  describe('normalizeTypedData', () => {
    it('keeps the safe field of a queue service delegate message', () => {
      const typedData = queueServiceDelegateMessage()

      expect(normalizeTypedData(typedData)).toEqual(typedData)
    })
  })

  describe('signTypedData', () => {
    const mockSignature =
      '0xe658c4de8780d5f2182ad364e8be4b1a63f59a2abf53fab05113ab1087ccf7fe50a9ae164517b24b8c886432a7fddf18bd73b0d6d43b8a5077c0f26e982a63b91b'

    it('should sign typed data', async () => {
      const signer = {
        signTypedData: jest.fn().mockResolvedValue(mockSignature),
      }
      const typedData = {
        domain: {
          chainId: 1,
          name: 'name',
          version: '1',
        },
        types: {
          EIP712Domain: [],
        },
        message: {},
        primaryType: 'EIP712Domain',
      }
      const result = await signTypedData(signer as unknown as JsonRpcSigner, typedData)
      expect(result).toBe(mockSignature)
    })

    it('should throw an error if signTypedData fails', async () => {
      const signer = {
        signTypedData: jest.fn().mockRejectedValue(new Error('error')),
      }
      const typedData = {
        domain: {
          chainId: 1,
          name: 'name',
          version: '1',
        },
        types: {
          EIP712Domain: [],
        },
        message: {},
        primaryType: 'EIP712Domain',
      }
      await expect(signTypedData(signer as unknown as JsonRpcSigner, typedData)).rejects.toThrow('error')
    })

    it('should fall back to signTypedData if signTypedData_v4 is not available', async () => {
      const error = new Error('error') as Error & { code: string }
      error.code = 'UNSUPPORTED_OPERATION'

      const signer = {
        signTypedData: jest.fn().mockRejectedValue(error),
        address: '0x1234567890123456789012345678901234567890',
        provider: {
          send: jest.fn().mockResolvedValue(mockSignature),
        },
      }
      const typedData = {
        types: {
          DeleteRequest: [
            { name: 'safeTxHash', type: 'bytes32' },
            { name: 'totp', type: 'uint256' },
          ],
        },
        domain: {
          name: 'Safe Transaction Service',
          version: '1.0',
          chainId: 1,
          verifyingContract: '0x1234567890123456789012345678901234567890',
        },
        message: {
          safeTxHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
          totp: Math.floor(Date.now() / 3600e3),
        },
        primaryType: 'DeleteRequest',
      }
      const result = await signTypedData(signer as unknown as JsonRpcSigner, typedData)
      expect(result).toBe(mockSignature)
    })
  })
})
