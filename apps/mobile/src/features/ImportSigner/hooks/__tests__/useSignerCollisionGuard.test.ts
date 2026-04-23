import { Alert } from 'react-native'
import { faker } from '@faker-js/faker'
import { renderHook } from '@/src/tests/test-utils'
import { useSignerCollisionGuard } from '../useSignerCollisionGuard'
import type { Signer } from '@/src/store/signersSlice'

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

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
const wcSigner: Signer = {
  value: ADDRESS_A,
  name: 'WC Owner',
  logoUri: null,
  type: 'walletconnect',
  walletName: 'MetaMask',
}
const wcSignerNoName: Signer = { value: ADDRESS_A, name: 'WC Owner', logoUri: null, type: 'walletconnect' }

const preloadSigners = (signers: Record<string, Signer>) => ({ signers })

describe('useSignerCollisionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('returns false (no block) when', () => {
    it('no signer exists for the address', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      expect(result.current.guardAgainstCollision(ADDRESS_A, 'private-key')).toBe(false)
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('an unrelated address has a signer', () => {
      const { result } = renderHook(
        () => useSignerCollisionGuard(),
        preloadSigners({ [ADDRESS_B]: { ...pkSigner, value: ADDRESS_B } }),
      )
      expect(result.current.guardAgainstCollision(ADDRESS_A, 'walletconnect')).toBe(false)
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('the same type is re-imported (idempotent)', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: pkSigner }))
      expect(result.current.guardAgainstCollision(ADDRESS_A, 'private-key')).toBe(false)
      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  describe('returns true and alerts on cross-type collision', () => {
    it.each([
      ['private-key → walletconnect', pkSigner, 'walletconnect' as const],
      ['walletconnect → private-key', wcSigner, 'private-key' as const],
      ['private-key → ledger', pkSigner, 'ledger' as const],
      ['ledger → private-key', ledgerSigner, 'private-key' as const],
    ])('%s', (_label, existing, newType) => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: existing }))
      expect(result.current.guardAgainstCollision(ADDRESS_A, newType)).toBe(true)
      expect(Alert.alert).toHaveBeenCalledWith('Signer already imported', expect.any(String), expect.any(Array))
    })

    it('matches case-insensitively via sameAddress', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: pkSigner }))
      expect(result.current.guardAgainstCollision(ADDRESS_A.toLowerCase(), 'walletconnect')).toBe(true)
      expect(result.current.guardAgainstCollision(ADDRESS_A.toUpperCase(), 'walletconnect')).toBe(true)
    })
  })

  describe('alert copy', () => {
    it('describes a private-key signer', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: pkSigner }))
      result.current.guardAgainstCollision(ADDRESS_A, 'walletconnect')
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('private key'),
        expect.any(Array),
      )
    })

    it('describes a Ledger signer', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: ledgerSigner }))
      result.current.guardAgainstCollision(ADDRESS_A, 'walletconnect')
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('Ledger'),
        expect.any(Array),
      )
    })

    it('names the wallet for a WalletConnect signer with walletName', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: wcSigner }))
      result.current.guardAgainstCollision(ADDRESS_A, 'private-key')
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('MetaMask'),
        expect.any(Array),
      )
    })

    it('falls back to "WalletConnect" when walletName is missing', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: wcSignerNoName }))
      result.current.guardAgainstCollision(ADDRESS_A, 'private-key')
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('WalletConnect'),
        expect.any(Array),
      )
    })
  })
})
