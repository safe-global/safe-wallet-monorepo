import {
  gtfPaymentSourcePreferenceSlice,
  setGtfPaymentSourcePreference,
  selectGtfPaymentSourcePreference,
  type GtfPaymentSourcePreferenceState,
} from '../gtfPaymentSourcePreferenceSlice'
import type { RootState } from '@/store'

const SIGNER_A = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
const SIGNER_B = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'

const buildRootState = (preference: GtfPaymentSourcePreferenceState): RootState =>
  ({ [gtfPaymentSourcePreferenceSlice.name]: preference }) as unknown as RootState

describe('gtfPaymentSourcePreferenceSlice', () => {
  it('starts empty', () => {
    expect(gtfPaymentSourcePreferenceSlice.getInitialState()).toEqual({})
  })

  it('persists the source under a lowercased signer address', () => {
    const state = gtfPaymentSourcePreferenceSlice.reducer(
      undefined,
      setGtfPaymentSourcePreference({ signerAddress: SIGNER_A, source: 'signer' }),
    )

    expect(state).toEqual({ [SIGNER_A.toLowerCase()]: 'signer' })
  })

  it('overwrites the source for the same signer', () => {
    let state = gtfPaymentSourcePreferenceSlice.reducer(
      undefined,
      setGtfPaymentSourcePreference({ signerAddress: SIGNER_A, source: 'signer' }),
    )
    state = gtfPaymentSourcePreferenceSlice.reducer(
      state,
      setGtfPaymentSourcePreference({ signerAddress: SIGNER_A, source: 'safe' }),
    )

    expect(state).toEqual({ [SIGNER_A.toLowerCase()]: 'safe' })
  })

  it('keeps preferences for different signers independent', () => {
    let state = gtfPaymentSourcePreferenceSlice.reducer(
      undefined,
      setGtfPaymentSourcePreference({ signerAddress: SIGNER_A, source: 'signer' }),
    )
    state = gtfPaymentSourcePreferenceSlice.reducer(
      state,
      setGtfPaymentSourcePreference({ signerAddress: SIGNER_B, source: 'safe' }),
    )

    expect(state).toEqual({
      [SIGNER_A.toLowerCase()]: 'signer',
      [SIGNER_B.toLowerCase()]: 'safe',
    })
  })

  describe('selectGtfPaymentSourcePreference', () => {
    it('returns the persisted source when the signer is known', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'signer' })

      expect(selectGtfPaymentSourcePreference(root, SIGNER_A)).toBe('signer')
    })

    it('looks up the signer address case-insensitively', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'signer' })

      expect(selectGtfPaymentSourcePreference(root, SIGNER_A.toUpperCase())).toBe('signer')
    })

    it('returns undefined when no preference is stored for the signer', () => {
      const root = buildRootState({})

      expect(selectGtfPaymentSourcePreference(root, SIGNER_A)).toBeUndefined()
    })

    it('returns undefined when no signer address is provided', () => {
      const root = buildRootState({ [SIGNER_A.toLowerCase()]: 'signer' })

      expect(selectGtfPaymentSourcePreference(root, undefined)).toBeUndefined()
    })
  })
})
