import { isExpiredProposalError, splitError } from '../utils'

describe('WalletConnect utils', () => {
  describe('splitError', () => {
    it('should return the error summary and detail', () => {
      const error = new Error('WalletConnect failed to switch chain: { session: "0x1234", chainId: 1 }')
      const [summary, detail] = splitError(error.message)
      expect(summary).toEqual('WalletConnect failed to switch chain')
      expect(detail).toEqual('{ session: "0x1234", chainId: 1 }')
    })

    it('should return the error summary if no details', () => {
      const error = new Error('WalletConnect failed to switch chain')
      const [summary, detail] = splitError(error.message)
      expect(summary).toEqual('WalletConnect failed to switch chain')
      expect(detail).toBeUndefined()
    })
  })

  describe('isExpiredProposalError', () => {
    it('detects a deleted proposal record', () => {
      const error = new Error('Missing or invalid. Record was recently deleted - proposal: 1234')
      expect(isExpiredProposalError(error)).toBe(true)
    })

    it('detects a missing proposal key', () => {
      const error = new Error('No matching key. proposal id doesn’t exist: 1234')
      expect(isExpiredProposalError(error)).toBe(true)
    })

    it('does not flag unrelated errors', () => {
      expect(isExpiredProposalError(new Error('User rejected'))).toBe(false)
      expect(isExpiredProposalError(new Error('Network request failed'))).toBe(false)
    })

    it('handles an error without a message', () => {
      expect(isExpiredProposalError(new Error())).toBe(false)
    })
  })
})
