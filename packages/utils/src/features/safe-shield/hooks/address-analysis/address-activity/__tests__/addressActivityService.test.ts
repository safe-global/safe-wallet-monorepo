import { faker } from '@faker-js/faker'
import type { JsonRpcProvider } from 'ethers'
import { analyzeAddressActivity, isLowActivityAddress } from '../addressActivityService'

describe('addressActivityService', () => {
  describe('analyzeAddressActivity', () => {
    it('should return NO_ACTIVITY for address with 0 transactions', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = { getTransactionCount: jest.fn().mockResolvedValue(0) } as unknown as JsonRpcProvider

      const result = await analyzeAddressActivity(address, provider)

      expect(result).toEqual({ txCount: 0, activityLevel: 'NO_ACTIVITY' })
      expect(provider.getTransactionCount).toHaveBeenCalledWith(address, 'latest')
    })

    it('should return VERY_LOW_ACTIVITY for address with 1-4 transactions', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = { getTransactionCount: jest.fn().mockResolvedValue(3) } as unknown as JsonRpcProvider

      const result = await analyzeAddressActivity(address, provider)

      expect(result).toEqual({ txCount: 3, activityLevel: 'VERY_LOW_ACTIVITY' })
    })

    it('should return LOW_ACTIVITY for address with 5-19 transactions', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = { getTransactionCount: jest.fn().mockResolvedValue(10) } as unknown as JsonRpcProvider

      const result = await analyzeAddressActivity(address, provider)

      expect(result).toEqual({ txCount: 10, activityLevel: 'LOW_ACTIVITY' })
    })

    it('should return MODERATE_ACTIVITY for address with 20-99 transactions', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = { getTransactionCount: jest.fn().mockResolvedValue(50) } as unknown as JsonRpcProvider

      const result = await analyzeAddressActivity(address, provider)

      expect(result).toEqual({ txCount: 50, activityLevel: 'MODERATE_ACTIVITY' })
    })

    it('should return HIGH_ACTIVITY for address with 100+ transactions', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = { getTransactionCount: jest.fn().mockResolvedValue(250) } as unknown as JsonRpcProvider

      const result = await analyzeAddressActivity(address, provider)

      expect(result).toEqual({ txCount: 250, activityLevel: 'HIGH_ACTIVITY' })
    })

    it('should throw error for invalid address', async () => {
      const invalidAddress = 'invalid-address'
      const provider = {} as JsonRpcProvider

      await expect(analyzeAddressActivity(invalidAddress, provider)).rejects.toThrow('Invalid Ethereum address')
    })

    it('should throw error if provider is not available', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = undefined as unknown as JsonRpcProvider

      await expect(analyzeAddressActivity(address, provider)).rejects.toThrow('Web3 provider not available')
    })

    it('should throw error if getTransactionCount fails', async () => {
      const address = faker.finance.ethereumAddress()
      const errorMessage = 'RPC error'
      const provider = {
        getTransactionCount: jest.fn().mockRejectedValue(new Error(errorMessage)),
      } as unknown as JsonRpcProvider

      await expect(analyzeAddressActivity(address, provider)).rejects.toThrow(
        `Failed to analyze address activity: ${errorMessage}`,
      )
    })
  })

  describe('isLowActivityAddress', () => {
    it('should return true for NO_ACTIVITY', () => {
      const assessment = { txCount: 0, activityLevel: 'NO_ACTIVITY' as const }

      expect(isLowActivityAddress(assessment)).toBe(true)
    })

    it('should return true for VERY_LOW_ACTIVITY', () => {
      const assessment = { txCount: 2, activityLevel: 'VERY_LOW_ACTIVITY' as const }

      expect(isLowActivityAddress(assessment)).toBe(true)
    })

    it('should return true for LOW_ACTIVITY', () => {
      const assessment = { txCount: 10, activityLevel: 'LOW_ACTIVITY' as const }

      expect(isLowActivityAddress(assessment)).toBe(true)
    })

    it('should return false for MODERATE_ACTIVITY', () => {
      const assessment = { txCount: 50, activityLevel: 'MODERATE_ACTIVITY' as const }

      expect(isLowActivityAddress(assessment)).toBe(false)
    })

    it('should return false for HIGH_ACTIVITY', () => {
      const assessment = { txCount: 250, activityLevel: 'HIGH_ACTIVITY' as const }

      expect(isLowActivityAddress(assessment)).toBe(false)
    })
  })
})
