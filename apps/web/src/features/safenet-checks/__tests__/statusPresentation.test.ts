import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { CheckStatus, type PublicCheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'
import { resolvePresentation, STATUS_PRESENTATION, UNAVAILABLE_PRESENTATION } from '../statusPresentation'

const VERDICT_STATUSES = Object.keys(STATUS_PRESENTATION) as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>[]

describe('resolvePresentation', () => {
  it.each<UnavailableReason>(['NO_CHECK', 'READ_FAILED'])('renders the %s copy with a neutral icon', (reason) => {
    expect(resolvePresentation(CheckStatus.UNAVAILABLE, reason, false)).toEqual({
      ...UNAVAILABLE_PRESENTATION[reason],
      severity: Severity.INFO,
      muted: true,
    })
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
