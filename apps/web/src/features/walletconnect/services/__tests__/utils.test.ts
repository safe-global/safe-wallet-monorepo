import { splitError } from '../utils'

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
})
