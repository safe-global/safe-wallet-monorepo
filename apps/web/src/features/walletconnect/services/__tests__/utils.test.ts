import { getInternalError } from '@walletconnect/utils'
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
    it.each(['Missing or invalid. Record was recently deleted - proposal: 1234', 'No matching key. proposal: 1234'])(
      'detects "%s"',
      (message) => {
        expect(isExpiredProposalError(new Error(message))).toBe(true)
      },
    )

    // Built by the SDK, so an upgrade that rewords the error fails here instead of in production
    it('detects the SDK error for a missing proposal', () => {
      const { message } = getInternalError('NO_MATCHING_KEY', 'proposal: 1234')
      expect(isExpiredProposalError(new Error(message))).toBe(true)
    })

    it.each(['User rejected', 'Network request failed', ''])('ignores "%s"', (message) => {
      expect(isExpiredProposalError(new Error(message))).toBe(false)
    })
  })
})
