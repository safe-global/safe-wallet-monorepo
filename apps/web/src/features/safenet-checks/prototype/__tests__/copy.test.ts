import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { PHASE_PRESENTATION, SAFENET_ETA_COPY, SAFENET_OVERDUE_COPY, formatElapsed, getEtaCopy } from '../copy'

describe('Safenet prototype copy', () => {
  it.each([
    ['before-sign', 'Safenet checks this transaction after you sign. It takes about a minute.'],
    ['submitted', 'Sent to Safenet for an independent check.'],
    ['checking', 'Independent checkers are reviewing this transaction'],
    ['no-issues', 'Safenet found no issues.'],
    ['risk', 'Safenet found a risk in this transaction.'],
    ['unavailable', "Safenet couldn't check this transaction. You can still continue."],
    ['locked', 'Safenet check is off. Turn on enhanced execution to include it.'],
  ] as const)('uses the PRD copy for %s', (phase, copy) => {
    expect(PHASE_PRESENTATION[phase].copy).toBe(copy)
  })

  it('has no exclamation marks in any copy', () => {
    Object.values(PHASE_PRESENTATION).forEach(({ label, copy }) => {
      expect(`${label} ${copy}`).not.toContain('!')
    })
  })

  it('only marks a risk as critical', () => {
    const critical = Object.entries(PHASE_PRESENTATION).filter(([, { severity }]) => severity === Severity.CRITICAL)
    expect(critical.map(([phase]) => phase)).toEqual(['risk'])
  })

  it('formats elapsed time as m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(32_400)).toBe('0:32')
    expect(formatElapsed(65_000)).toBe('1:05')
    expect(formatElapsed(-500)).toBe('0:00')
  })

  it('switches the ETA copy once the ETA has passed', () => {
    expect(getEtaCopy(60_000, 59_999)).toBe(SAFENET_ETA_COPY)
    expect(getEtaCopy(60_000, 60_000)).toBe(SAFENET_OVERDUE_COPY)
    expect(getEtaCopy(undefined, 1)).toBe(SAFENET_ETA_COPY)
  })
})
