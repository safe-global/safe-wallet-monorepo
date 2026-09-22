import { getSupportIdentityKey } from './supportIdentity'

describe('getSupportIdentityKey', () => {
  it('requires an authenticated identity and a signer for SIWE', () => {
    expect(getSupportIdentityKey()).toBeUndefined()
    expect(getSupportIdentityKey({ id: '1', authMethod: 'siwe' })).toBeUndefined()
    expect(getSupportIdentityKey({ id: '1', authMethod: 'oidc' })).toBe('oidc:1')
  })
  it('separates authentication methods, users and signers while normalizing address casing', () => {
    const session = { id: '1', authMethod: 'siwe' as const, signerAddress: '0xABC' }
    expect(getSupportIdentityKey(session)).toBe('siwe:1:0xabc')
    expect(getSupportIdentityKey({ ...session, signerAddress: '0xabc' })).toBe(getSupportIdentityKey(session))
    expect(getSupportIdentityKey({ ...session, id: '2' })).not.toBe(getSupportIdentityKey(session))
    expect(getSupportIdentityKey({ ...session, signerAddress: '0xDEF' })).not.toBe(getSupportIdentityKey(session))
  })
})
