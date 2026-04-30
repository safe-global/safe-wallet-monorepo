import { buildPasskeyArg, resolveVerifierAddress } from '../identity'
import { UnsupportedChainError } from '../types'

jest.mock('@safe-global/protocol-kit', () => {
  const actual = jest.requireActual('@safe-global/protocol-kit')
  return {
    ...actual,
    getP256VerifierAddress: jest.fn((chainId: string) => {
      if (chainId === '11155111') return '0x0000000000000000000000000000000000000B71'
      throw new Error(`No verifier for chain ${chainId}`)
    }),
  }
})

describe('resolveVerifierAddress', () => {
  it('returns the address when protocol-kit knows the chain', () => {
    expect(resolveVerifierAddress('11155111')).toBe('0x0000000000000000000000000000000000000B71')
  })

  it('wraps protocol-kit errors in UnsupportedChainError', () => {
    expect(() => resolveVerifierAddress('999999')).toThrow(UnsupportedChainError)
    try {
      resolveVerifierAddress('999999')
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedChainError)
      expect((err as UnsupportedChainError).chainId).toBe('999999')
      expect((err as { cause?: Error }).cause).toBeInstanceOf(Error)
    }
  })
})

describe('buildPasskeyArg', () => {
  const passkey = {
    rawId: 'raw-id-base64url',
    coordinates: { x: '1', y: '2' },
  }

  it('returns a complete PasskeyArgType with verifier resolved', () => {
    const getFn = jest.fn()
    const arg = buildPasskeyArg({ passkey, chainId: '11155111', getFn })
    expect(arg).toEqual({
      rawId: 'raw-id-base64url',
      coordinates: { x: '1', y: '2' },
      verifierAddress: '0x0000000000000000000000000000000000000B71',
      getFn,
    })
  })

  it('omits getFn when not provided so protocol-kit falls back to its default', () => {
    const arg = buildPasskeyArg({ passkey, chainId: '11155111' })
    expect(arg).not.toHaveProperty('getFn')
    expect(arg.verifierAddress).toBe('0x0000000000000000000000000000000000000B71')
  })

  it('propagates UnsupportedChainError for unknown chains', () => {
    expect(() => buildPasskeyArg({ passkey, chainId: '999999' })).toThrow(UnsupportedChainError)
  })
})
