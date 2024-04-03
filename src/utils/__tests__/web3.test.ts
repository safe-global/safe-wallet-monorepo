import type { JsonRpcSigner } from 'ethers'
import { signTypedData } from '../web3'

describe('web3', () => {
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
      }
      await expect(signTypedData(signer as unknown as JsonRpcSigner, typedData)).rejects.toThrow('error')
    })

    it('should fall back to signTypedData if signTypedData_v4 is not available', async () => {
      const signer = {
        signTypedData_v4: undefined,
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
      }
      const result = await signTypedData(signer as unknown as JsonRpcSigner, typedData)
      expect(result).toBe(mockSignature)
    })
  })
})
