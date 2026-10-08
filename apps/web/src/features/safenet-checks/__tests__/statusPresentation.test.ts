import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'
import { resolvePresentation, STATUS_PRESENTATION, UNAVAILABLE_PRESENTATION } from '../statusPresentation'

const VERDICT_STATUSES = Object.keys(STATUS_PRESENTATION) as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>[]
const UNAVAILABLE_REASONS = Object.keys(UNAVAILABLE_PRESENTATION) as UnavailableReason[]

/** PRD copy for verdict states — regression guard when product strings change. */
const PRD_STATUS_COPY = {
  [CheckStatus.SUBMITTED]: 'Check submitted to Safenet.',
  [CheckStatus.IN_PROGRESS]: 'Safenet is simulating this transaction.',
  [CheckStatus.BENIGN]: 'Safenet found no issues',
  [CheckStatus.MALICIOUS]: 'Safenet flagged this address/transaction as malicious',
  [CheckStatus.TIMED_OUT]: 'Safenet check is unavailable. You can still continue.',
} as const satisfies Record<Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string>

describe('resolvePresentation', () => {
  it.each(UNAVAILABLE_REASONS)('renders the %s copy with a neutral icon', (reason) => {
    expect(resolvePresentation(CheckStatus.UNAVAILABLE, reason, false)).toEqual({
      ...UNAVAILABLE_PRESENTATION[reason],
      severity: Severity.INFO,
      muted: true,
    })
  })

  it('claims an absent check only for the reason that proves one', () => {
    // A heuristic window found nothing where it looked. Saying "no check was
    // requested" there would assert a fact the read cannot support.
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN.copy).not.toContain('No Safenet check was requested')
    expect(UNAVAILABLE_PRESENTATION.READ_FAILED.copy).not.toContain('No Safenet check was requested')
    expect(UNAVAILABLE_PRESENTATION.NO_CHECK.copy).toContain('No Safenet check was requested')
  })

  it('never reports an uncertain window as a failed read', () => {
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN).not.toEqual(UNAVAILABLE_PRESENTATION.READ_FAILED)
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN.copy).not.toMatch(/couldn't reach/i)
  })

  it('tells the user they can continue whenever there is no verdict', () => {
    expect(UNAVAILABLE_PRESENTATION.READ_FAILED.copy).toContain('You can still continue.')
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN.copy).toContain('You can still continue.')
    expect(STATUS_PRESENTATION[CheckStatus.TIMED_OUT].copy).toContain('You can still continue.')
  })

  it.each(VERDICT_STATUSES)('matches PRD copy for %s', (status) => {
    expect(STATUS_PRESENTATION[status].copy).toBe(PRD_STATUS_COPY[status])
  })

  it('keeps the protocol timeout distinct from an unreadable status', () => {
    const timedOut = STATUS_PRESENTATION[CheckStatus.TIMED_OUT].copy
    expect(timedOut).toBe(PRD_STATUS_COPY[CheckStatus.TIMED_OUT])
    expect(timedOut).not.toEqual(UNAVAILABLE_PRESENTATION.READ_FAILED.copy)
    expect(timedOut).not.toMatch(/couldn't reach/i)
  })

  it('keeps the neutral icon even when a snapshot says no check was requested', () => {
    // NO_CHECK arrives with a snapshot; the state is still not a verdict.
    expect(resolvePresentation(CheckStatus.UNAVAILABLE, 'NO_CHECK', true)).toMatchObject({
      severity: Severity.INFO,
      muted: true,
    })
  })

  it('renders nothing while the first read has not resolved (no reason yet)', () => {
    expect(resolvePresentation(CheckStatus.UNAVAILABLE, undefined, false)).toBeUndefined()
  })

  it.each(VERDICT_STATUSES)('renders %s with its severity and state name as the heading', (status) => {
    expect(resolvePresentation(status, undefined, true)).toEqual({
      severity: STATUS_PRESENTATION[status].severity,
      copy: STATUS_PRESENTATION[status].copy,
      label: STATUS_PRESENTATION[status].label,
      muted: false,
    })
  })

  it.each(VERDICT_STATUSES)('renders nothing for a %s pinned without its snapshot', (status) => {
    // A failed refetch drops the snapshot under a pinned verdict; the next
    // poll restores it, so the section stays out rather than showing a stub.
    expect(resolvePresentation(status, undefined, false)).toBeUndefined()
  })
})
