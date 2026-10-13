import { faker } from '@faker-js/faker'
import { TypedDataEncoder, concat, getAddress, keccak256 } from 'ethers'
import type { JsonRpcSigner } from 'ethers'
import { hashTypedData, signTypedData } from '@safe-global/utils/utils/web3'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'

const testTypes = { Test: [{ name: 'test', type: 'string' }] }

const dappTypedData = (chainId: number | string) => {
  const payload: unknown = {
    domain: { name: faker.lorem.word(), chainId, verifyingContract: getAddress(faker.finance.ethereumAddress()) },
    types: testTypes,
    message: { test: faker.lorem.sentence() },
    primaryType: 'Test',
  }
  if (!isEIP712TypedData(payload)) throw new Error('Expected EIP-712 typed data')
  return payload
}

describe('web3', () => {
  describe('hashTypedData', () => {
    it('hashes the domain by its declared EIP712Domain, including a non-standard field', () => {
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
      const typedData = {
        domain: {
          name: faker.lorem.word(),
          version: faker.system.semver(),
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
      }

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

    it.each([
      ['number', (chainId: number) => chainId],
      ['decimal string', (chainId: number) => String(chainId)],
      ['hex string', (chainId: number) => `0x${chainId.toString(16)}`],
    ])('matches ethers for a derived domain with a %s chainId', (_, toChainId) => {
      const typedData = dappTypedData(toChainId(faker.number.int({ min: 1, max: 100_000 })))

      expect(hashTypedData(typedData)).toBe(TypedDataEncoder.hash(typedData.domain, testTypes, typedData.message))
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
