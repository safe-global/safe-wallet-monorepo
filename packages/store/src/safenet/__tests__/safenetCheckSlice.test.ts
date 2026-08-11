import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
} from '@safe-global/utils/features/safenet-checks'
import {
  pinVerdict,
  safenetCheckInitialState,
  safenetCheckSlice,
  selectPinnedVerdict,
  type SafenetCheckSliceState,
} from '../safenetCheckSlice'

const reduce = (state: SafenetCheckSliceState, action: Parameters<typeof safenetCheckSlice.reducer>[1]) =>
  safenetCheckSlice.reducer(state, action)

const HASH_A = '0x' + 'aa'.repeat(32)
const HASH_B = '0x' + 'bb'.repeat(32)

describe('safenetCheckSlice', () => {
  it('starts empty', () => {
    expect(safenetCheckInitialState).toEqual({ pinned: {} })
  })

  it('pins a verdict keyed by safeTxHash', () => {
    const next = reduce(
      safenetCheckInitialState,
      pinVerdict({
        safeTxHash: HASH_A,
        status: CheckStatus.IN_PROGRESS,
        atBlock: '42',
        verification: UNVERIFIED_ATTESTATION,
      }),
    )
    expect(next.pinned[HASH_A]).toEqual({
      status: CheckStatus.IN_PROGRESS,
      atBlock: '42',
      verification: UNVERIFIED_ATTESTATION,
    })
  })

  it('overwrites the pin for the same hash and keeps other hashes untouched', () => {
    const verified = {
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: ('0x' + '11'.repeat(32)) as `0x${string}`,
      message: ('0x' + '22'.repeat(32)) as `0x${string}`,
    }
    let state = reduce(
      safenetCheckInitialState,
      pinVerdict({
        safeTxHash: HASH_A,
        status: CheckStatus.IN_PROGRESS,
        atBlock: '42',
        verification: UNVERIFIED_ATTESTATION,
      }),
    )
    state = reduce(
      state,
      pinVerdict({
        safeTxHash: HASH_B,
        status: CheckStatus.SUBMITTED,
        atBlock: '10',
        verification: UNVERIFIED_ATTESTATION,
      }),
    )
    state = reduce(
      state,
      pinVerdict({ safeTxHash: HASH_A, status: CheckStatus.BENIGN, atBlock: '99', verification: verified }),
    )

    expect(state.pinned[HASH_A]).toEqual({ status: CheckStatus.BENIGN, atBlock: '99', verification: verified })
    expect(state.pinned[HASH_B].status).toBe(CheckStatus.SUBMITTED)
  })

  it('selects a pinned verdict, or undefined when none exists', () => {
    const state = reduce(
      safenetCheckInitialState,
      pinVerdict({
        safeTxHash: HASH_A,
        status: CheckStatus.BENIGN,
        atBlock: '99',
        verification: UNVERIFIED_ATTESTATION,
      }),
    )
    const root = { [safenetCheckSlice.name]: state }
    expect(selectPinnedVerdict(root, HASH_A)?.status).toBe(CheckStatus.BENIGN)
    expect(selectPinnedVerdict(root, HASH_B)).toBeUndefined()
  })
})
