import {
  feePaymentSourcePreferenceSlice,
  setFeePaymentSourcePreference,
  selectFeePaymentSourcePreference,
  type FeePaymentSourcePreferenceState,
} from '../feePaymentSourcePreferenceSlice'
import type { RootState } from '@/store'

const SIGNER_A = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
const SIGNER_B = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'

const buildRootState = (preference: FeePaymentSourcePreferenceState): RootState =>
  ({ [feePaymentSourcePreferenceSlice.name]: preference }) as unknown as RootState

describe('feePaymentSourcePreferenceSlice', () => {
  it('starts empty', () => {
    expect(feePaymentSourcePreferenceSlice.getInitialState()).toEqual({})
  })

  it('persists the source under a lowercased signer address', () => {
    const state = feePaymentSourcePreferenceSlice.reducer(
      undefined,
      setFeePaymentSourcePreference({ signerAddress: SIGNER_A, source: 'WALLET' }),
    )

    expect(state).toEqual({ [SIGNER_A.toLowerCase()]: 'WALLET' })
  })

  it('overwrites the source for the same signer', () => {
    let state = feePaymentSourcePreferenceSlice.reducer(
      undefined,
      setFeePaymentSourcePreference({ signerAddress: SIGNER_A, source: 'WALLET' }),
    )
    state = feePaymentSourcePreferenceSlice.reducer(
      state,
      setFeePaymentSourcePreference({ signerAddress: SIGNER_A, source: 'PAY_FROM_SAFE' }),
    )

    expect(state).toEqual({ [SIGNER_A.toLowerCase()]: 'PAY_FROM_SAFE' })
  })

  it('keeps preferences for different signers independent', () => {
    let state = feePaymentSourcePreferenceSlice.reducer(
      undefined,
      setFeePaymentSourcePreference({ signerAddress: SIGNER_A, source: 'WALLET' }),
    )
    state = feePaymentSourcePreferenceSlice.reducer(
      state,
      setFeePaymentSourcePreference({ signerAddress: SIGNER_B, source: 'PAY_FROM_SAFE' }),
    )

    expect(state).toEqual({
      [SIGNER_A.toLowerCase()]: 'WALLET',
      [SIGNER_B.toLowerCase()]: 'PAY_FROM_SAFE',
    })
  })

  describe('selectFeePaymentSourcePreference', () => {
    it('returns the persisted source when the signer is known', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'WALLET' })

      expect(selectFeePaymentSourcePreference(root, SIGNER_A)).toBe('WALLET')
    })

    it('looks up the signer address case-insensitively', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'WALLET' })

      expect(selectFeePaymentSourcePreference(root, SIGNER_A.toUpperCase())).toBe('WALLET')
    })

    it('returns undefined when no preference is stored for the signer', () => {
      const root = buildRootState({})

      expect(selectFeePaymentSourcePreference(root, SIGNER_A)).toBeUndefined()
    })

    it('returns undefined when no signer address is provided', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'WALLET' })

      expect(selectFeePaymentSourcePreference(root, undefined)).toBeUndefined()
    })
  })
})
