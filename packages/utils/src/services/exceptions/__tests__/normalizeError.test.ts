import { normalizeError, sanitizeErrorMessage } from '../normalizeError'
import { ErrorDomain, ErrorLayer, ErrorType } from '../errorTaxonomy'

describe('sanitizeErrorMessage', () => {
  it('strips Ethereum addresses', () => {
    const result = sanitizeErrorMessage('Failed for owner 0x1234567890abcdef1234567890ABCDEF12345678 now')

    expect(result).not.toContain('0x1234567890abcdef1234567890ABCDEF12345678')
    expect(result).toContain('Failed for owner')
  })

  it('strips long calldata / hashes', () => {
    const calldata = '0x' + 'a'.repeat(200)
    const result = sanitizeErrorMessage(`Reverted with data ${calldata}`)

    expect(result).not.toContain(calldata)
    expect(result).toContain('Reverted with data')
  })

  it('never leaks a private-key-like hex blob', () => {
    const privateKey = '0x' + 'f'.repeat(64)
    const result = sanitizeErrorMessage(`key=${privateKey}`)

    expect(result).not.toContain(privateKey)
    expect(result).not.toContain('f'.repeat(64))
  })

  it('leaves a message without sensitive data untouched', () => {
    expect(sanitizeErrorMessage('User rejected the request')).toBe('User rejected the request')
  })
})

describe('normalizeError', () => {
  const base = { message: 'Code 804: Error executing a transaction', isUserFacing: true }

  it('classifies a known code by domain, type and layer', () => {
    const result = normalizeError({ ...base, code: 804 })

    expect(result.domain).toBe(ErrorDomain.TX_EXECUTION)
    expect(result.type).toBe(ErrorType.TX_EXECUTION_FAILED)
    expect(result.layer).toBe(ErrorLayer.OFF_CHAIN)
  })

  it('reports the numeric code as a string', () => {
    expect(normalizeError({ ...base, code: 804 }).code).toBe('804')
  })

  it('passes through isUserFacing', () => {
    expect(normalizeError({ ...base, code: 804, isUserFacing: false }).isUserFacing).toBe(false)
    expect(normalizeError({ ...base, code: 804, isUserFacing: true }).isUserFacing).toBe(true)
  })

  it('refines type to user_rejected when the message indicates a user rejection', () => {
    const result = normalizeError({
      code: 805,
      message: 'Code 805: Error proposing (user rejected the request)',
      isUserFacing: true,
    })

    expect(result.type).toBe(ErrorType.USER_REJECTED)
    expect(result.domain).toBe(ErrorDomain.TX_PROPOSAL) // domain still comes from the code
  })

  it('detects an ethers ACTION_REJECTED rejection', () => {
    const result = normalizeError({
      code: 804,
      message: 'Code 804: ... (ethers-user-denied) code=ACTION_REJECTED',
      isUserFacing: true,
    })

    expect(result.type).toBe(ErrorType.USER_REJECTED)
  })

  it('refines type to nonce_conflict when the message mentions a nonce issue', () => {
    const result = normalizeError({
      code: 805,
      message: 'Code 805: nonce too low',
      isUserFacing: true,
    })

    expect(result.type).toBe(ErrorType.NONCE_CONFLICT)
  })

  it('promotes layer to on_chain and captures the GS code on a revert', () => {
    const result = normalizeError({
      code: 804,
      message: 'Code 804: execution reverted GS013',
      isUserFacing: true,
    })

    expect(result.layer).toBe(ErrorLayer.ON_CHAIN)
    expect(result.type).toBe(ErrorType.ON_CHAIN_REVERT)
    expect(result.code).toBe('GS013')
  })

  it('falls back to the domain-by-hundred for a coded but unmapped error', () => {
    const result = normalizeError({
      code: 602, // 6xx present, but pretend-unmapped handled by hundred bucket
      message: 'Code 602: Error fetching history txs',
      isUserFacing: false,
    })

    // 602 IS mapped, so assert on a genuinely unmapped 6xx code:
    const unmapped = normalizeError({ code: 699, message: 'Code 699: something', isUserFacing: false })
    expect(unmapped.domain).toBe(ErrorDomain.DATA_LOADING)
    expect(unmapped.type).toBe(ErrorType.UNKNOWN)
    expect(result.domain).toBe(ErrorDomain.DATA_LOADING)
  })

  it('classifies an unknown / uncoded error as a frontend exception', () => {
    const result = normalizeError({ code: 0, message: 'Something exploded', isUserFacing: true })

    expect(result.domain).toBe(ErrorDomain.FRONTEND_EXCEPTION)
    expect(result.type).toBe(ErrorType.UNKNOWN)
  })

  it('sanitizes the message it returns', () => {
    const result = normalizeError({
      code: 804,
      message: 'Code 804: failed for 0x1234567890abcdef1234567890ABCDEF12345678',
      isUserFacing: true,
    })

    expect(result.sanitizedMessage).not.toContain('0x1234567890abcdef1234567890ABCDEF12345678')
  })
})
