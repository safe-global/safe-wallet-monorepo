import { buildSupportReference, formatSupportReference, getErrorCode } from '../supportReference'

describe('supportReference', () => {
  describe('getErrorCode', () => {
    it('extracts a GS code from the reason', () => {
      expect(getErrorCode({ reason: 'GS026', message: 'whatever' })).toBe('GS026')
    })

    it('extracts a GS code embedded in the message', () => {
      expect(getErrorCode({ message: 'execution reverted: "GS013" (action="estimateGas")' })).toBe('GS013')
    })

    it('ignores GS-like strings that are not real codes', () => {
      expect(getErrorCode({ message: 'GS999 is not a real code' })).toBe('UNKNOWN')
    })

    it('extracts an app coded-error number', () => {
      expect(getErrorCode({ message: '804: Error executing a transaction' })).toBe('804')
    })

    it('prefers a GS code over a coded-error number', () => {
      expect(getErrorCode({ message: '804: reverted with GS026' })).toBe('GS026')
    })

    it('returns UNKNOWN for unmapped errors', () => {
      expect(getErrorCode({ message: 'HTTP request failed. Status: 500' })).toBe('UNKNOWN')
      expect(getErrorCode(undefined)).toBe('UNKNOWN')
      expect(getErrorCode(null)).toBe('UNKNOWN')
    })
  })

  describe('buildSupportReference', () => {
    it('builds a reference with all fields', () => {
      const ref = buildSupportReference(
        { reason: 'GS026' },
        { network: 'Ethereum', txHash: '0xabc', timestamp: '2026-08-10T00:00:00.000Z' },
      )
      expect(ref).toEqual({
        code: 'GS026',
        txHash: '0xabc',
        network: 'Ethereum',
        timestamp: '2026-08-10T00:00:00.000Z',
      })
    })

    it('defaults the timestamp to now when not provided', () => {
      const ref = buildSupportReference({ message: 'boom' })
      expect(ref.code).toBe('UNKNOWN')
      expect(() => new Date(ref.timestamp).toISOString()).not.toThrow()
    })
  })

  describe('formatSupportReference', () => {
    it('formats all present fields, one per line', () => {
      const text = formatSupportReference({
        code: 'GS026',
        txHash: '0xabc',
        network: 'Ethereum',
        timestamp: '2026-08-10T00:00:00.000Z',
      })
      expect(text).toBe('Code: GS026\nTransaction: 0xabc\nNetwork: Ethereum\nTime: 2026-08-10T00:00:00.000Z')
    })

    it('omits absent optional fields', () => {
      const text = formatSupportReference({ code: 'UNKNOWN', timestamp: '2026-08-10T00:00:00.000Z' })
      expect(text).toBe('Code: UNKNOWN\nTime: 2026-08-10T00:00:00.000Z')
    })

    it('never contains a URL, request body, or library version', () => {
      const text = formatSupportReference(
        buildSupportReference(
          { message: 'HTTP request failed. URL: https://x.drpc.org body: {"method":"eth_call"} viem@2.52.2' },
          { network: 'Ethereum' },
        ),
      )
      expect(text).not.toMatch(/https?:\/\//)
      expect(text).not.toMatch(/eth_call/)
      expect(text).not.toMatch(/viem@/)
    })
  })
})
