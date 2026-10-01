import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { withSafenetCheck } from '../shieldSummary'

const OK = { severity: Severity.OK, title: 'Checks passed' }
const CHECKS = { passed: 3, total: 3 }

describe('withSafenetCheck', () => {
  it.each([undefined, 'before-sign', 'locked'] as const)('leaves the header alone for %s', (phase) => {
    expect(withSafenetCheck(phase, OK, CHECKS)).toEqual({ overallStatus: OK, checks: CHECKS, isPending: false })
  })

  it('counts a running check and shows it in an info tone', () => {
    expect(withSafenetCheck('checking', OK, CHECKS)).toEqual({
      overallStatus: { severity: Severity.INFO, title: '3 of 4 · Safenet checking' },
      checks: { passed: 3, total: 4 },
      isPending: true,
    })
  })

  it('counts no issues found as a passed check', () => {
    expect(withSafenetCheck('no-issues', OK, CHECKS)).toEqual({
      overallStatus: OK,
      checks: { passed: 4, total: 4 },
      isPending: false,
    })
  })

  it('counts an unavailable check without passing it', () => {
    expect(withSafenetCheck('unavailable', OK, CHECKS).checks).toEqual({ passed: 3, total: 4 })
  })

  it('escalates the header to critical for a risk', () => {
    expect(withSafenetCheck('risk', OK, CHECKS).overallStatus).toEqual({
      severity: Severity.CRITICAL,
      title: 'Safenet found a risk',
    })
  })

  it('keeps a stronger existing warning while Safenet runs', () => {
    const warn = { severity: Severity.WARN, title: 'Low activity recipient' }
    expect(withSafenetCheck('checking', warn, CHECKS).overallStatus).toBe(warn)
  })

  it('keeps an existing critical title when Safenet also finds a risk', () => {
    const critical = { severity: Severity.CRITICAL, title: 'Malicious threat detected' }
    expect(withSafenetCheck('risk', critical, CHECKS).overallStatus).toBe(critical)
  })
})
