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

  describe('checkCollision', () => {
    it('returns null when no signer exists for the address', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      expect(result.current.checkCollision(ADDRESS_A, 'private-key')).toBeNull()
    })

    it('returns null when an unrelated address has a signer', () => {
      const { result } = renderHook(
        () => useSignerCollisionGuard(),
        preloadSigners({ [ADDRESS_B]: { ...pkSigner, value: ADDRESS_B } }),
      )
      expect(result.current.checkCollision(ADDRESS_A, 'walletconnect')).toBeNull()
    })

    it('returns null when the same type is re-imported (idempotent)', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: pkSigner }))
      expect(result.current.checkCollision(ADDRESS_A, 'private-key')).toBeNull()
    })

    it.each([
      ['private-key → walletconnect', pkSigner, 'walletconnect' as const],
      ['private-key → ledger', pkSigner, 'ledger' as const],
      ['ledger → private-key', ledgerSigner, 'private-key' as const],
      ['ledger → walletconnect', ledgerSigner, 'walletconnect' as const],
      ['walletconnect → private-key', wcSigner, 'private-key' as const],
      ['walletconnect → ledger', wcSigner, 'ledger' as const],
    ])('returns the existing signer on cross-type collision (%s)', (_label, existing, newType) => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: existing }))
      expect(result.current.checkCollision(ADDRESS_A, newType)).toEqual(existing)
    })

    it('matches case-insensitively via sameAddress', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({ [ADDRESS_A]: pkSigner }))
      expect(result.current.checkCollision(ADDRESS_A.toLowerCase(), 'walletconnect')).toEqual(pkSigner)
      expect(result.current.checkCollision(ADDRESS_A.toUpperCase(), 'walletconnect')).toEqual(pkSigner)
    })
  })

  describe('showCollisionAlert', () => {
    it('describes a private-key signer in the alert', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      result.current.showCollisionAlert(pkSigner)
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('private key'),
        expect.any(Array),
      )
    })

    it('describes a Ledger signer in the alert', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      result.current.showCollisionAlert(ledgerSigner)
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('Ledger'),
        expect.any(Array),
      )
    })

    it('names the wallet for a WalletConnect signer with walletName', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      result.current.showCollisionAlert(wcSigner)
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('MetaMask'),
        expect.any(Array),
      )
    })

    it('falls back to "WalletConnect" when walletName is missing', () => {
      const { result } = renderHook(() => useSignerCollisionGuard(), preloadSigners({}))
      result.current.showCollisionAlert(wcSignerNoName)
      expect(Alert.alert).toHaveBeenCalledWith(
        'Signer already imported',
        expect.stringContaining('WalletConnect'),
        expect.any(Array),
      )
    })
  })
})
