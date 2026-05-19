import { faker } from '@faker-js/faker'
import { findCollidingSigner } from '../findCollidingSigner'
import type { Signer } from '@/src/store/signersSlice'

const ADDRESS_A = faker.finance.ethereumAddress()
const ADDRESS_B = faker.finance.ethereumAddress()

const pkSigner: Signer = { value: ADDRESS_A, name: 'PK Owner', logoUri: null, type: 'private-key' }
const ledgerSigner: Signer = {
  value: ADDRESS_A,
  name: 'Ledger Owner',
  logoUri: null,
  type: 'ledger',
  derivationPath: "m/44'/60'/0'/0/0",
}
const wcSigner: Signer = { value: ADDRESS_A, name: 'WC Owner', logoUri: null, type: 'walletconnect' }

describe('findCollidingSigner', () => {
  it('returns null when no signer exists for the address', () => {
    expect(findCollidingSigner({}, ADDRESS_A, 'private-key')).toBeNull()
  })

  it('returns null when only an unrelated address has a signer', () => {
    expect(
      findCollidingSigner({ [ADDRESS_B]: { ...pkSigner, value: ADDRESS_B } }, ADDRESS_A, 'walletconnect'),
    ).toBeNull()
  })

  it('returns null on same-type re-import (idempotent)', () => {
    expect(findCollidingSigner({ [ADDRESS_A]: pkSigner }, ADDRESS_A, 'private-key')).toBeNull()
    expect(findCollidingSigner({ [ADDRESS_A]: wcSigner }, ADDRESS_A, 'walletconnect')).toBeNull()
  })

  it.each([
    ['private-key → walletconnect', pkSigner, 'walletconnect' as const],
    ['walletconnect → private-key', wcSigner, 'private-key' as const],
    ['private-key → ledger', pkSigner, 'ledger' as const],
    ['ledger → private-key', ledgerSigner, 'private-key' as const],
  ])('returns the existing signer on cross-type collision: %s', (_label, existing, newType) => {
    expect(findCollidingSigner({ [ADDRESS_A]: existing }, ADDRESS_A, newType)).toBe(existing)
  })

  it('matches case-insensitively', () => {
    expect(findCollidingSigner({ [ADDRESS_A]: pkSigner }, ADDRESS_A.toLowerCase(), 'walletconnect')).toBe(pkSigner)
    expect(findCollidingSigner({ [ADDRESS_A]: pkSigner }, ADDRESS_A.toUpperCase(), 'walletconnect')).toBe(pkSigner)
  })
})
