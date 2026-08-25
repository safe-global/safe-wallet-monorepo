import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'
import { resolvePresentation, STATUS_PRESENTATION, UNAVAILABLE_PRESENTATION } from '../statusPresentation'

const VERDICT_STATUSES = Object.keys(STATUS_PRESENTATION) as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>[]
const UNAVAILABLE_REASONS = Object.keys(UNAVAILABLE_PRESENTATION) as UnavailableReason[]

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
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN).toEqual(UNAVAILABLE_PRESENTATION.READ_FAILED)
    expect(UNAVAILABLE_PRESENTATION.WINDOW_UNCERTAIN.copy).not.toContain('No Safenet check was requested')
    expect(UNAVAILABLE_PRESENTATION.NO_CHECK.copy).toContain('No Safenet check was requested')
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

  it.each(VERDICT_STATUSES)('renders %s with its severity and the section heading', (status) => {
    expect(resolvePresentation(status, undefined, true)).toEqual({
      severity: STATUS_PRESENTATION[status].severity,
      copy: STATUS_PRESENTATION[status].copy,
      label: 'Safenet check',
      muted: false,
    })
  })

  it.each(VERDICT_STATUSES)('renders nothing for a %s pinned without its snapshot', (status) => {
    // A failed refetch drops the snapshot under a pinned verdict; the next
    // poll restores it, so the section stays out rather than showing a stub.
    expect(resolvePresentation(status, undefined, false)).toBeUndefined()
  })
})
