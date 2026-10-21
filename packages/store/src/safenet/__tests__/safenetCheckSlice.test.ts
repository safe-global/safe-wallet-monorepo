import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
} from '@safe-global/utils/features/safenet-checks'
import {
  checkKey,
  pinVerdict,
  recordCheckRequest,
  safenetCheckInitialState,
  safenetCheckSlice,
  selectCheckRequestedAtMs,
  selectPinnedVerdict,
  type SafenetCheckSliceState,
} from '../safenetCheckSlice'

const reduce = (state: SafenetCheckSliceState, action: Parameters<typeof safenetCheckSlice.reducer>[1]) =>
  safenetCheckSlice.reducer(state, action)

const HASH_A = '0x' + 'aa'.repeat(32)
const HASH_B = '0x' + 'bb'.repeat(32)
const SAFE = '0x0000000000000000000000000000000000000abc'
const OTHER_SAFE = '0x00000000000000000000000000000000000000ff'
const A = { safeTxHash: HASH_A, chainId: '100', safeAddress: SAFE }
const B = { safeTxHash: HASH_B, chainId: '100', safeAddress: SAFE }

describe('safenetCheckSlice', () => {
  it('starts empty', () => {
    expect(safenetCheckInitialState).toEqual({ pinned: {}, requested: {} })
  })

  it('pins a verdict keyed by the check identity', () => {
    const next = reduce(
      safenetCheckInitialState,
      pinVerdict({ ...A, status: CheckStatus.IN_PROGRESS, atBlock: '42', verification: UNVERIFIED_ATTESTATION }),
    )
    expect(next.pinned[checkKey(A)]).toEqual({
      status: CheckStatus.IN_PROGRESS,
      atBlock: '42',
      verification: UNVERIFIED_ATTESTATION,
    })
  })

  it('overwrites the pin for the same check and keeps other checks untouched', () => {
    const verified = {
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: ('0x' + '11'.repeat(32)) as `0x${string}`,
      message: ('0x' + '22'.repeat(32)) as `0x${string}`,
    }
    let state = reduce(
      safenetCheckInitialState,
      pinVerdict({ ...A, status: CheckStatus.IN_PROGRESS, atBlock: '42', verification: UNVERIFIED_ATTESTATION }),
    )
    state = reduce(
      state,
      pinVerdict({ ...B, status: CheckStatus.SUBMITTED, atBlock: '10', verification: UNVERIFIED_ATTESTATION }),
    )
    state = reduce(state, pinVerdict({ ...A, status: CheckStatus.BENIGN, atBlock: '99', verification: verified }))

    expect(state.pinned[checkKey(A)]).toEqual({ status: CheckStatus.BENIGN, atBlock: '99', verification: verified })
    expect(state.pinned[checkKey(B)].status).toBe(CheckStatus.SUBMITTED)
  })

  it('selects a pinned verdict, or undefined when none exists', () => {
    const state = reduce(
      safenetCheckInitialState,
      pinVerdict({ ...A, status: CheckStatus.BENIGN, atBlock: '99', verification: UNVERIFIED_ATTESTATION }),
    )
    const root = { [safenetCheckSlice.name]: state }
    expect(selectPinnedVerdict(root, A)?.status).toBe(CheckStatus.BENIGN)
    expect(selectPinnedVerdict(root, B)).toBeUndefined()
  })

  it('records when a check was requested, per check identity', () => {
    const state = reduce(safenetCheckInitialState, recordCheckRequest({ ...A, requestedAtMs: 1_000 }))
    const root = { [safenetCheckSlice.name]: state }

    expect(selectCheckRequestedAtMs(root, A)).toBe(1_000)
    expect(selectCheckRequestedAtMs(root, B)).toBeUndefined()
    expect(selectCheckRequestedAtMs(root, { ...A, chainId: '1' })).toBeUndefined()
    expect(selectCheckRequestedAtMs(root, { ...A, safeAddress: SAFE.toUpperCase().replace('0X', '0x') })).toBe(1_000)
  })

  it('keeps the latest request time of a check', () => {
    let state = reduce(safenetCheckInitialState, recordCheckRequest({ ...A, requestedAtMs: 1_000 }))
    state = reduce(state, recordCheckRequest({ ...A, requestedAtMs: 5_000 }))

    expect(selectCheckRequestedAtMs({ [safenetCheckSlice.name]: state }, A)).toBe(5_000)
  })

  describe('identity', () => {
    it('separates the same hash on two chains', () => {
      const state = reduce(
        safenetCheckInitialState,
        pinVerdict({ ...A, status: CheckStatus.BENIGN, atBlock: '99', verification: UNVERIFIED_ATTESTATION }),
      )
      const root = { [safenetCheckSlice.name]: state }

      // Safe <=1.2.0 omits the chain id from its domain hash, so this is one
      // hash on two chains, not one check.
      expect(selectPinnedVerdict(root, { ...A, chainId: '1' })).toBeUndefined()
      expect(selectPinnedVerdict(root, A)?.status).toBe(CheckStatus.BENIGN)
    })

    it('separates the same hash on two Safes', () => {
      const state = reduce(
        safenetCheckInitialState,
        pinVerdict({ ...A, status: CheckStatus.BENIGN, atBlock: '99', verification: UNVERIFIED_ATTESTATION }),
      )
      const root = { [safenetCheckSlice.name]: state }

      expect(selectPinnedVerdict(root, { ...A, safeAddress: OTHER_SAFE })).toBeUndefined()
    })

    it('reads the same pin however the Safe address is cased', () => {
      const state = reduce(
        safenetCheckInitialState,
        pinVerdict({ ...A, status: CheckStatus.BENIGN, atBlock: '99', verification: UNVERIFIED_ATTESTATION }),
      )
      const root = { [safenetCheckSlice.name]: state }

      expect(selectPinnedVerdict(root, { ...A, safeAddress: SAFE.toUpperCase().replace('0X', '0x') })?.status).toBe(
        CheckStatus.BENIGN,
      )
    })
  })
})
