import { mergeMonotonic } from '../mergeMonotonic'
import { CheckStatus } from '../../types'

const ALL = Object.values(CheckStatus)

describe('mergeMonotonic', () => {
  it('takes the incoming status on first observation (null pinned)', () => {
    for (const next of ALL) {
      expect(mergeMonotonic(null, next)).toBe(next)
    }
  })

  it('is idempotent when pinned equals next', () => {
    for (const status of ALL) {
      expect(mergeMonotonic(status, status)).toBe(status)
    }
  })

  describe('terminal verdicts are sticky', () => {
    it('never walks back a BENIGN verdict, except to MALICIOUS', () => {
      for (const next of ALL) {
        const expected = next === CheckStatus.MALICIOUS ? CheckStatus.MALICIOUS : CheckStatus.BENIGN
        expect(mergeMonotonic(CheckStatus.BENIGN, next)).toBe(expected)
      }
    })

    it('lets a late arbitration result override a shown BENIGN', () => {
      expect(mergeMonotonic(CheckStatus.BENIGN, CheckStatus.MALICIOUS)).toBe(CheckStatus.MALICIOUS)
    })

    it('never walks back a MALICIOUS verdict', () => {
      for (const next of ALL) {
        expect(mergeMonotonic(CheckStatus.MALICIOUS, next)).toBe(CheckStatus.MALICIOUS)
      }
    })
  })

  describe('late upgrades from TIMED_OUT', () => {
    it('a late BENIGN replaces TIMED_OUT', () => {
      expect(mergeMonotonic(CheckStatus.TIMED_OUT, CheckStatus.BENIGN)).toBe(CheckStatus.BENIGN)
    })

    it('a late MALICIOUS replaces TIMED_OUT', () => {
      expect(mergeMonotonic(CheckStatus.TIMED_OUT, CheckStatus.MALICIOUS)).toBe(CheckStatus.MALICIOUS)
    })

    it('does not regress TIMED_OUT back to IN_PROGRESS or SUBMITTED', () => {
      expect(mergeMonotonic(CheckStatus.TIMED_OUT, CheckStatus.IN_PROGRESS)).toBe(CheckStatus.TIMED_OUT)
      expect(mergeMonotonic(CheckStatus.TIMED_OUT, CheckStatus.SUBMITTED)).toBe(CheckStatus.TIMED_OUT)
    })
  })

  describe('VERIFICATION_FAILED never becomes BENIGN', () => {
    it('keeps VERIFICATION_FAILED when a BENIGN arrives', () => {
      expect(mergeMonotonic(CheckStatus.VERIFICATION_FAILED, CheckStatus.BENIGN)).toBe(CheckStatus.VERIFICATION_FAILED)
    })

    it('allows an escalation to MALICIOUS', () => {
      expect(mergeMonotonic(CheckStatus.VERIFICATION_FAILED, CheckStatus.MALICIOUS)).toBe(CheckStatus.MALICIOUS)
    })
  })

  describe('non-terminal progress', () => {
    it('advances SUBMITTED → IN_PROGRESS', () => {
      expect(mergeMonotonic(CheckStatus.SUBMITTED, CheckStatus.IN_PROGRESS)).toBe(CheckStatus.IN_PROGRESS)
    })

    it('does not regress IN_PROGRESS → SUBMITTED', () => {
      expect(mergeMonotonic(CheckStatus.IN_PROGRESS, CheckStatus.SUBMITTED)).toBe(CheckStatus.IN_PROGRESS)
    })

    it('advances IN_PROGRESS → TIMED_OUT (stall path)', () => {
      expect(mergeMonotonic(CheckStatus.IN_PROGRESS, CheckStatus.TIMED_OUT)).toBe(CheckStatus.TIMED_OUT)
    })
  })

  describe('a transient UNAVAILABLE never clobbers a known status', () => {
    it('keeps every real pinned status when next is UNAVAILABLE', () => {
      for (const pinned of ALL) {
        if (pinned === CheckStatus.UNAVAILABLE) continue
        expect(mergeMonotonic(pinned, CheckStatus.UNAVAILABLE)).toBe(pinned)
      }
    })

    it('recovers from a pinned UNAVAILABLE to any real status', () => {
      expect(mergeMonotonic(CheckStatus.UNAVAILABLE, CheckStatus.IN_PROGRESS)).toBe(CheckStatus.IN_PROGRESS)
      expect(mergeMonotonic(CheckStatus.UNAVAILABLE, CheckStatus.BENIGN)).toBe(CheckStatus.BENIGN)
    })
  })
})
