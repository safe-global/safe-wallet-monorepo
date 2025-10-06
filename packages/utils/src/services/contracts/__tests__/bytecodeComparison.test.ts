import { compareWithSupportedL2Contracts, isSupportedL2Version } from '../bytecodeComparison'
import * as safeDeployments from '@safe-global/safe-deployments'
import { keccak256 } from 'ethers'

jest.mock('@safe-global/safe-deployments', () => ({
  getSafeL2SingletonDeployments: jest.fn(),
}))

describe('bytecodeComparison', () => {
  describe('isSupportedL2Version', () => {
    it('should return true for 1.3.0', () => {
      expect(isSupportedL2Version('1.3.0')).toBe(true)
    })

    it('should return true for 1.4.1', () => {
      expect(isSupportedL2Version('1.4.1')).toBe(true)
    })

    it('should return true for 1.3.0+L2', () => {
      expect(isSupportedL2Version('1.3.0+L2')).toBe(true)
    })

    it('should return true for 1.4.1+L2', () => {
      expect(isSupportedL2Version('1.4.1+L2')).toBe(true)
    })

    it('should return false for 1.1.1', () => {
      expect(isSupportedL2Version('1.1.1')).toBe(false)
    })

    it('should return false for 1.2.0', () => {
      expect(isSupportedL2Version('1.2.0')).toBe(false)
    })

    it('should return false for 1.4.0', () => {
      expect(isSupportedL2Version('1.4.0')).toBe(false)
    })

    it('should return false for unsupported versions', () => {
      expect(isSupportedL2Version('2.0.0')).toBe(false)
    })
  })

  describe('compareWithSupportedL2Contracts', () => {
    const mockBytecode =
      '0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063ffa1ad741461003b575b600080fd5b610043610059565b60405161005091906100a3565b60405180910390f35b60606040518060400160405280600581526020017f312e342e31000000000000000000000000000000000000000000000000000000815250905090565b600082825260208201905092915050565b60006100c2601f8361008e565b91506100cd82610158565b602082019050919050565b600060208201905081810360008301526100f1816100b5565b9050919050565b7f312e342e310000000000000000000000000000000000000000000000000000600082015250565b6000610131601f83610092565b915061013c826100f8565b602082019050919050565b6000602082019050818103600083015261016081610124565b9050919050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b'
    const mockBytecodeHash = keccak256(mockBytecode)

    it('should return isMatch: true when bytecode matches canonical deployment', async () => {
      const chainId = '1'

      jest.mocked(safeDeployments.getSafeL2SingletonDeployments).mockReturnValue({
        released: true,
        contractName: 'GnosisSafeL2',
        version: '1.3.0',
        deployments: {
          canonical: {
            address: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
            codeHash: mockBytecodeHash,
          },
        },
        networkAddresses: {
          '1': ['0x3E5c63644E683549055b9Be8653de26E0B4CD36E'],
        },
      } as any)

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      expect(result.isMatch).toBe(true)
      expect(result.matchedVersion).toBe('1.3.0')
    })

    it('should return isMatch: true when bytecode matches eip155 deployment', async () => {
      const chainId = '10'

      jest.mocked(safeDeployments.getSafeL2SingletonDeployments).mockImplementation((filter) => {
        const version = filter?.version
        if (version === '1.4.1') {
          return {
            released: true,
            contractName: 'GnosisSafeL2',
            version: '1.4.1',
            deployments: {
              canonical: {
                address: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                codeHash: '0xdifferenthash',
              },
              eip155: {
                address: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
                codeHash: mockBytecodeHash,
              },
            },
            networkAddresses: {
              '10': ['0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'],
            },
          } as any
        }
        return undefined as any
      })

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      expect(result.isMatch).toBe(true)
      expect(result.matchedVersion).toBe('1.4.1')
    })

    it('should return isMatch: false when bytecode does not match any deployment', async () => {
      const chainId = '1'
      const differentHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      jest.mocked(safeDeployments.getSafeL2SingletonDeployments).mockReturnValue({
        released: true,
        contractName: 'GnosisSafeL2',
        version: '1.3.0',
        deployments: {
          canonical: {
            address: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
            codeHash: differentHash,
          },
        },
        networkAddresses: {
          '1': ['0x3E5c63644E683549055b9Be8653de26E0B4CD36E'],
        },
      } as any)

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      expect(result.isMatch).toBe(false)
      expect(result.matchedVersion).toBeUndefined()
    })

    it('should return isMatch: false when chain does not have the deployment', async () => {
      const chainId = '999'

      jest.mocked(safeDeployments.getSafeL2SingletonDeployments).mockReturnValue({
        released: true,
        contractName: 'GnosisSafeL2',
        version: '1.3.0',
        deployments: {
          canonical: {
            address: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
            codeHash: mockBytecodeHash,
          },
        },
        networkAddresses: {
          '1': ['0x3E5c63644E683549055b9Be8653de26E0B4CD36E'],
        },
      } as any)

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      expect(result.isMatch).toBe(false)
      expect(result.matchedVersion).toBeUndefined()
    })

    it('should return isMatch: false when deployment is not found', async () => {
      const chainId = '1'

      jest.mocked(safeDeployments.getSafeL2SingletonDeployments).mockReturnValue(undefined as any)

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      expect(result.isMatch).toBe(false)
      expect(result.matchedVersion).toBeUndefined()
    })

    it('should check both 1.3.0 and 1.4.1 versions', async () => {
      const chainId = '1'
      const getSpy = jest.mocked(safeDeployments.getSafeL2SingletonDeployments)

      getSpy.mockImplementation((filter) => {
        const version = filter?.version
        if (version === '1.4.1') {
          return {
            released: true,
            contractName: 'GnosisSafeL2',
            version: '1.4.1',
            deployments: {
              canonical: {
                address: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                codeHash: mockBytecodeHash,
              },
            },
            networkAddresses: {
              '1': ['0x3E5c63644E683549055b9Be8653de26E0B4CD36E'],
            },
          } as any
        }
        return undefined as any
      })

      const result = await compareWithSupportedL2Contracts(mockBytecode, chainId)

      // Should be called for both versions
      expect(getSpy).toHaveBeenCalledWith({ version: '1.3.0' })
      expect(getSpy).toHaveBeenCalledWith({ version: '1.4.1' })
      expect(result.isMatch).toBe(true)
      expect(result.matchedVersion).toBe('1.4.1')
    })
  })
})
