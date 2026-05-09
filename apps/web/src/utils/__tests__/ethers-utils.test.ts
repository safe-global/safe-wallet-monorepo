import { Signature } from 'ethers'
import {
  didRevert,
  didReprice,
  isTimeoutError,
  splitSignature,
  joinSignature,
  EthersTxReplacedReason,
  type EthersError,
} from '../ethers-utils'

describe('ethers-utils', () => {
  describe('didRevert', () => {
    it('should return true for reverted transaction (status 0)', () => {
      const receipt = { status: 0 }
      expect(didRevert(receipt)).toBe(true)
    })

    it('should return false for successful transaction (status 1)', () => {
      const receipt = { status: 1 }
      expect(didRevert(receipt)).toBe(false)
    })

    it('should return false for null status', () => {
      const receipt = { status: null }
      expect(didRevert(receipt)).toBe(false)
    })

    it('should return false for undefined status', () => {
      const receipt = { status: undefined }
      expect(didRevert(receipt)).toBe(false)
    })

    it('should return false for undefined receipt', () => {
      expect(didRevert(undefined)).toBe(false)
    })

    it('should return false for empty object', () => {
      expect(didRevert({})).toBe(false)
    })
  })

  describe('didReprice', () => {
    it('should return true for repriced transaction', () => {
      const error = {
        name: 'Error',
        message: 'Transaction was repriced',
        code: 'TRANSACTION_REPLACED',
        reason: EthersTxReplacedReason.repriced,
      } as EthersError

      expect(didReprice(error)).toBe(true)
    })

    it('should return false for cancelled transaction', () => {
      const error = {
        name: 'Error',
        message: 'Transaction was cancelled',
        code: 'TRANSACTION_REPLACED',
        reason: EthersTxReplacedReason.cancelled,
      } as EthersError

      expect(didReprice(error)).toBe(false)
    })

    it('should return false for replaced transaction', () => {
      const error = {
        name: 'Error',
        message: 'Transaction was replaced',
        code: 'TRANSACTION_REPLACED',
        reason: EthersTxReplacedReason.replaced,
      } as EthersError

      expect(didReprice(error)).toBe(false)
    })

    it('should return false for error without reason', () => {
      const error = {
        name: 'Error',
        message: 'Some error',
        code: 'UNKNOWN_ERROR',
      } as EthersError

      expect(didReprice(error)).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    it('should return true for timeout error', () => {
      const error = new Error('timeout') as any
      error.reason = 'timeout'
      error.code = 'TIMEOUT'
      error.timeout = 30000

      expect(isTimeoutError(error)).toBe(true)
    })

    it('should return false for non-timeout error', () => {
      const error = new Error('Some other error')
      expect(isTimeoutError(error)).toBe(false)
    })

    it('should return false for error with timeout code but no reason', () => {
      const error = new Error('error') as any
      error.code = 'TIMEOUT'

      expect(isTimeoutError(error)).toBe(false)
    })

    it('should return true for error with timeout reason and any code', () => {
      // The function checks if 'code' exists, not its value
      const error = new Error('error') as any
      error.reason = 'timeout'
      error.code = 'OTHER_ERROR'

      expect(isTimeoutError(error)).toBe(true)
    })

    it('should return false for undefined', () => {
      expect(isTimeoutError(undefined)).toBe(false)
    })

    it('should return false for non-error object', () => {
      const notAnError = { message: 'not an error' }
      expect(isTimeoutError(notAnError as Error)).toBe(false)
    })
  })

  describe('splitSignature', () => {
    it('should split a valid signature', () => {
      // Example ECDSA signature (r + s + v format)
      const sigBytes =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' +
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' +
        '1b'

      const result = splitSignature(sigBytes)

      expect(result).toBeInstanceOf(Signature)
      expect(result.r).toBeDefined()
      expect(result.s).toBeDefined()
      expect(result.v).toBeDefined()
    })

    it('should handle different signature formats', () => {
      // Compact signature format
      const compactSig =
        '0x' +
        '1111111111111111111111111111111111111111111111111111111111111111' +
        '2222222222222222222222222222222222222222222222222222222222222222' +
        '1c'

      const result = splitSignature(compactSig)

      expect(result).toBeInstanceOf(Signature)
      expect(typeof result.r).toBe('string')
      expect(typeof result.s).toBe('string')
    })
  })

  describe('joinSignature', () => {
    it('should join a signature from components', () => {
      const splitSig = {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        v: 27,
      }

      const result = joinSignature(splitSig)

      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(132) // 0x + 64 (r) + 64 (s) + 2 (v) = 132
    })

    it('should join and split signature in round-trip', () => {
      // Use a valid signature format with realistic values
      // r and s must be valid curve points
      const originalSig =
        '0x' +
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' +
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' +
        '1b'

      // Split and rejoin
      const split = splitSignature(originalSig)
      const rejoined = joinSignature(split)

      expect(rejoined.toLowerCase()).toBe(originalSig.toLowerCase())
    })

    it('should handle Signature object directly', () => {
      const sig = Signature.from({
        r: '0x1111111111111111111111111111111111111111111111111111111111111111',
        s: '0x2222222222222222222222222222222222222222222222222222222222222222',
        v: 28,
      })

      const result = joinSignature(sig)

      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('splitSignature and joinSignature integration', () => {
    it('should be inverse operations', () => {
      // Create a signature from components
      const components = {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        v: 27,
      }

      // Join to string
      const joined = joinSignature(components)

      // Split back to components
      const split = splitSignature(joined)

      // Verify components match
      expect(split.r.toLowerCase()).toBe(components.r.toLowerCase())
      expect(split.s.toLowerCase()).toBe(components.s.toLowerCase())
      expect(split.v).toBe(components.v)
    })
  })
})
