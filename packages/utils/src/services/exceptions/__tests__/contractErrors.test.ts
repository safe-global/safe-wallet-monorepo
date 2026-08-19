import CONTRACT_ERRORS, {
  CONTRACT_ERROR_FALLBACK,
  GS026_MESSAGES,
  getContractErrorHandling,
  getContractErrorMessage,
  getGs026Message,
  getGsCodeFromError,
  isGsCode,
  type GsCode,
} from '../contractErrors'

const ALL_CODES = Object.keys(CONTRACT_ERRORS) as GsCode[]

// Every user-facing string this module can render (base messages + GS026 variants + fallback).
const ALL_USER_FACING_STRINGS = [
  ...Object.values(CONTRACT_ERRORS).map((meta) => meta.message),
  ...Object.values(GS026_MESSAGES),
  CONTRACT_ERROR_FALLBACK,
]

describe('contractErrors', () => {
  it('covers exactly the 32 GS codes in scope', () => {
    expect(ALL_CODES).toHaveLength(32)
  })

  it('maps every code to a non-empty message and a known handling', () => {
    for (const code of ALL_CODES) {
      const meta = CONTRACT_ERRORS[code]
      expect(meta.message.length).toBeGreaterThan(0)
      expect(['inline-validation', 'runtime', 'internal']).toContain(meta.handling)
    }
  })

  it('points every internal (Bucket C) code at the shared fallback', () => {
    const internalCodes = ALL_CODES.filter((code) => getContractErrorHandling(code) === 'internal')
    for (const code of internalCodes) {
      expect(getContractErrorMessage(code)).toBe(CONTRACT_ERROR_FALLBACK)
    }
  })

  describe('content rules (no technical strings — ACs 7 & 11)', () => {
    it.each(ALL_USER_FACING_STRINGS)('"%s" contains no forbidden content', (message) => {
      expect(message).not.toMatch(/https?:\/\//i) // no URL / docs link
      expect(message).not.toMatch(/request body/i) // no request body
      expect(message).not.toMatch(/@\d+\.\d+\.\d+/) // no library version (e.g. viem@2.52.2)
      expect(message).not.toMatch(/\b(viem|ethers|sdk)\b/i) // no library / SDK names
      expect(message).not.toMatch(/\bplease\b/i) // no "please"
      expect(message).not.toContain('!') // no exclamation mark
      expect(message).not.toMatch(/GS\d{3}/) // no GS code in the body
      expect(message).not.toMatch(/eth_[a-z]/i) // no RPC method names
      expect(message).not.toMatch(/0x[0-9a-f]{4,}/i) // no hex blobs / selectors
    })
  })

  describe('getContractErrorMessage', () => {
    it('interpolates the native asset for GS011', () => {
      expect(getContractErrorMessage('GS011', { nativeAsset: 'ETH' })).toBe(
        'Not enough ETH in this Safe Account to cover the network fee.',
      )
    })

    it('interpolates token and native asset for GS012', () => {
      expect(getContractErrorMessage('GS012', { token: 'USDC', nativeAsset: 'ETH' })).toBe(
        'Not enough USDC to cover the network fee. Pay with ETH instead.',
      )
    })

    it('leaves unknown placeholders untouched when no param is provided', () => {
      // Honest behaviour: a missing param must not throw or blank the message.
      expect(getContractErrorMessage('GS011')).toBe(
        'Not enough {nativeAsset} in this Safe Account to cover the network fee.',
      )
    })

    it('returns static messages verbatim', () => {
      expect(getContractErrorMessage('GS201')).toBe('Threshold cannot be higher than the number of signers')
    })
  })

  describe('GS026', () => {
    it('exposes three distinct cause messages', () => {
      const messages = Object.values(GS026_MESSAGES)
      expect(new Set(messages).size).toBe(3)
    })

    it('resolves each cause via getGs026Message', () => {
      expect(getGs026Message('NOT_SIGNER')).toBe(GS026_MESSAGES.NOT_SIGNER)
      expect(getGs026Message('STALE_NONCE')).toBe(GS026_MESSAGES.STALE_NONCE)
      expect(getGs026Message('BAD_SIGNATURE')).toBe(GS026_MESSAGES.BAD_SIGNATURE)
    })

    it('falls back for an unknown reactive cause', () => {
      expect(getContractErrorMessage('GS026')).toBe(CONTRACT_ERROR_FALLBACK)
    })
  })

  describe('isGsCode', () => {
    it('recognises known codes', () => {
      expect(isGsCode('GS026')).toBe(true)
      expect(isGsCode('GS400')).toBe(true)
    })

    it('rejects unknown values', () => {
      expect(isGsCode('GS999')).toBe(false)
      expect(isGsCode('Invalid owner provided')).toBe(false)
      expect(isGsCode(undefined)).toBe(false)
      expect(isGsCode(42)).toBe(false)
    })
  })

  describe('getGsCodeFromError', () => {
    it('extracts a GS code from an explicit code property', () => {
      // e.g. a pre-check error that identifies its GS code directly, with a clean message
      expect(getGsCodeFromError({ code: 'GS026', message: 'Another transaction used this nonce.' })).toBe('GS026')
    })

    it('ignores non-GS code properties', () => {
      expect(getGsCodeFromError({ code: 'CALL_EXCEPTION', message: 'no gs here' })).toBeUndefined()
      expect(getGsCodeFromError({ code: -32005, message: 'no gs here' })).toBeUndefined()
    })

    it('extracts a GS code from the reason', () => {
      expect(getGsCodeFromError({ reason: 'GS026', message: 'anything' })).toBe('GS026')
    })

    it('extracts a GS code embedded in the message', () => {
      expect(getGsCodeFromError({ message: 'execution reverted: "GS013" (action="estimateGas")' })).toBe('GS013')
    })

    it('returns undefined for non-GS errors', () => {
      expect(getGsCodeFromError({ message: 'HTTP request failed. Status: 500' })).toBeUndefined()
      expect(getGsCodeFromError({ message: 'GS999 is not a real code' })).toBeUndefined()
      expect(getGsCodeFromError(undefined)).toBeUndefined()
      expect(getGsCodeFromError(null)).toBeUndefined()
    })
  })

  it('matches the full message snapshot', () => {
    expect(CONTRACT_ERRORS).toMatchSnapshot()
  })
})
