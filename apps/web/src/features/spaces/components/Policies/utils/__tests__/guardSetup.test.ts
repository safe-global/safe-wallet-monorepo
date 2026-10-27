import type { GuardSetup, GuardSetupTransaction } from '@safe-global/views/features/spaces/components/Policies/types'
import { formatDuration, getGuardSetupProgress } from '../guardSetup'

const NOW = 1_800_000_000
const HOUR = 3_600

const tx = (confirmationsSubmitted: number): GuardSetupTransaction => ({
  safeTxHash: '0x1',
  nonce: 4,
  confirmationsSubmitted,
  confirmationsRequired: 2,
  proposedAt: NOW - HOUR,
})

const delayed = (overrides: Partial<Extract<GuardSetup, { flow: 'delayed' }>> = {}): GuardSetup => ({
  flow: 'delayed',
  status: 'pending-application',
  guard: '0x0000000000000000000000000000000000000001',
  root: '0xabc',
  configurations: [],
  readyAt: NOW + 3 * HOUR,
  expiresAt: NOW + 24 * HOUR,
  transaction: null,
  ...overrides,
})

const statesOf = (setup: GuardSetup) =>
  getGuardSetupProgress(setup, NOW).steps.map((step) => `${step.id}:${step.state}`)

describe('getGuardSetupProgress', () => {
  it('asks for the request to be proposed when the change is only a draft', () => {
    const progress = getGuardSetupProgress(
      delayed({ status: 'draft', guard: null, readyAt: null, expiresAt: null }),
      NOW,
    )

    expect(progress).toMatchObject({ status: 'not-requested', action: 'request', summary: 'Not requested yet' })
    expect(statesOf(delayed({ status: 'draft' }))).toEqual(['request:current', 'delay:upcoming', 'apply:upcoming'])
  })

  it('counts signatures on the queued request', () => {
    const setup = delayed({ status: 'configuration-in-signing', readyAt: null, expiresAt: null, transaction: tx(1) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({
      status: 'needs-signatures',
      action: 'review-transaction',
      summary: 'Step 1 of 3 · 1 of 2 signatures',
    })
    expect(statesOf(setup)).toEqual(['request:current', 'delay:upcoming', 'apply:upcoming'])
  })

  it('offers to execute a fully signed request', () => {
    const setup = delayed({ status: 'configuration-in-signing', readyAt: null, expiresAt: null, transaction: tx(2) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({
      status: 'ready-to-execute',
      summary: 'Step 1 of 3 · Ready to execute',
    })
  })

  it('shows the time left while the security delay runs, with nothing to do', () => {
    expect(getGuardSetupProgress(delayed(), NOW)).toMatchObject({
      status: 'security-delay',
      action: null,
      summary: 'Step 2 of 3 · Ready in 3h',
    })
    expect(statesOf(delayed())).toEqual(['request:complete', 'delay:current', 'apply:upcoming'])
  })

  it('lets owners sign the apply transaction during the delay', () => {
    const setup = delayed({ status: 'application-in-signing', transaction: tx(1) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({ status: 'security-delay', action: 'review-transaction' })
    expect(statesOf(setup)).toEqual(['request:complete', 'delay:current', 'apply:current'])
  })

  it('offers to apply once the delay has passed, even before CGW polls again', () => {
    const progress = getGuardSetupProgress(delayed(), NOW + 3 * HOUR)

    expect(progress).toMatchObject({
      status: 'ready-to-apply',
      action: 'apply',
      summary: 'Step 3 of 3 · Ready to apply',
    })
    expect(progress.steps.map((step) => step.state)).toEqual(['complete', 'complete', 'current'])
  })

  it('counts signatures on a queued apply after the delay', () => {
    const setup = delayed({ status: 'application-in-signing', readyAt: NOW - HOUR, transaction: tx(1) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({
      status: 'needs-signatures',
      summary: 'Step 3 of 3 · 1 of 2 signatures',
    })
  })

  it('offers to execute a fully signed apply', () => {
    const setup = delayed({ status: 'application-ready', readyAt: NOW - HOUR, transaction: tx(2) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({
      status: 'ready-to-execute',
      action: 'review-transaction',
      summary: 'Step 3 of 3 · Ready to execute',
    })
  })

  it('treats a fully signed apply as waiting while the delay runs', () => {
    const setup = delayed({ status: 'pending-application', transaction: tx(2) })

    expect(getGuardSetupProgress(setup, NOW)).toMatchObject({ status: 'security-delay', action: 'review-transaction' })
  })

  it('marks the change expired when CGW says so', () => {
    const progress = getGuardSetupProgress(
      delayed({ status: 'expired', readyAt: NOW - 2 * HOUR, expiresAt: NOW - HOUR }),
      NOW,
    )

    expect(progress).toMatchObject({ status: 'expired', action: 'request' })
    expect(progress.steps.map((step) => step.state)).toEqual(['complete', 'complete', 'failed'])
  })

  it('marks the change expired once the window closes between polls', () => {
    expect(getGuardSetupProgress(delayed({ readyAt: NOW - 2 * HOUR }), NOW + 24 * HOUR).status).toBe('expired')
  })

  it('has two steps before the guard is enabled', () => {
    const transaction = tx(1)
    const progress = getGuardSetupProgress({ flow: 'immediate', guard: '0x1', transaction }, NOW)

    expect(progress).toMatchObject({ status: 'needs-signatures', summary: 'Step 1 of 2 · 1 of 2 signatures' })
    expect(progress.steps.map((step) => `${step.id}:${step.state}`)).toEqual(['sign:current', 'execute:upcoming'])

    expect(getGuardSetupProgress({ flow: 'immediate', guard: '0x1', transaction: tx(2) }, NOW)).toMatchObject({
      status: 'ready-to-execute',
      summary: 'Step 2 of 2 · Ready to execute',
    })
  })
})

describe('formatDuration', () => {
  it.each([
    [30, 'less than a minute'],
    [61, '2 min'],
    [3 * HOUR, '3h'],
    [3 * HOUR + 15 * 60, '3h 15m'],
    [24 * HOUR, '1d'],
    [26 * HOUR, '1d 2h'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})
