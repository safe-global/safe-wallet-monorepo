import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import { _getValidatedGetContractProps, isValidMasterCopy, _getMinimumMultiSendCallOnlyVersion } from '../safeContracts'

describe('safeContracts', () => {
  describe('isValidMasterCopy', () => {
    it('returns false if the implementation is unknown', async () => {
      const isValid = isValidMasterCopy(ImplementationVersionState.UNKNOWN)

      expect(isValid).toBe(false)
    })

    it('returns true if the implementation is up-to-date', async () => {
      const isValid = isValidMasterCopy(ImplementationVersionState.UP_TO_DATE)

      expect(isValid).toBe(true)
    })

    it('returns true if the implementation is outdated', async () => {
      const isValid = isValidMasterCopy(ImplementationVersionState.OUTDATED)

      expect(isValid).toBe(true)
    })
  })
  describe('getValidatedGetContractProps', () => {
    it('should return the correct props', () => {
      expect(_getValidatedGetContractProps('1.1.1')).toEqual({
        safeVersion: '1.1.1',
      })

      expect(_getValidatedGetContractProps('1.2.0')).toEqual({
        safeVersion: '1.2.0',
      })

      expect(_getValidatedGetContractProps('1.3.0')).toEqual({
        safeVersion: '1.3.0',
      })

      expect(_getValidatedGetContractProps('1.3.0+L2')).toEqual({
        safeVersion: '1.3.0',
      })
    })
    it('should throw if the Safe version is invalid', () => {
      expect(() => _getValidatedGetContractProps('1.3.1')).toThrow('1.3.1 is not a valid Safe Account version')

      expect(() => _getValidatedGetContractProps('1.4.0')).toThrow('1.4.0 is not a valid Safe Account version')

      expect(() => _getValidatedGetContractProps('0.0.1')).toThrow('0.0.1 is not a valid Safe Account version')

      expect(() => _getValidatedGetContractProps('')).toThrow(' is not a valid Safe Account version')
    })
  })

  describe('_getMinimumMultiSendCallOnlyVersion', () => {
    it('should return the initial version if the Safe version is null', () => {
      expect(_getMinimumMultiSendCallOnlyVersion(null)).toBe('1.3.0')
    })

    it('should return the initial version if the Safe version is lower than the initial version', () => {
      expect(_getMinimumMultiSendCallOnlyVersion('1.0.0')).toBe('1.3.0')
    })

    it('should return the Safe version if the Safe version is higher than the initial version', () => {
      expect(_getMinimumMultiSendCallOnlyVersion('1.4.1')).toBe('1.4.1')
    })
  })
})
