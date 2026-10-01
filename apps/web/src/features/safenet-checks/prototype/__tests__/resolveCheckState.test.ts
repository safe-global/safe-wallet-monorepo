import { CheckStatus } from '@safe-global/utils/features/safenet-checks/types'
import {
  CHECK_ETA_MS,
  MOCK_RISK_DETAILS,
  SUBMITTED_DURATION_MS,
  fromPublicStatus,
  resolveCheckState,
} from '../resolveCheckState'
import { resolveRole } from '../useSafenetCheckState'
import { DEFAULT_SCENARIO } from '../useSafenetScenario'
import type { SafenetScenario } from '../types'

const START = 1_700_000_000_000

const scenario = (change: Partial<SafenetScenario> = {}): SafenetScenario => ({ ...DEFAULT_SCENARIO, ...change })

describe('resolveCheckState', () => {
  it('shows the before-signing note to the first signer, whatever the outcome', () => {
    expect(resolveCheckState(scenario({ outcome: 'risk' }), 'first-signer', START, START)).toEqual({
      phase: 'before-sign',
    })
  })

  it('shows the check as locked when enhanced execution is off', () => {
    expect(resolveCheckState(scenario({ enhancedExecution: false }), 'co-signer', START, START)).toEqual({
      phase: 'locked',
    })
  })

  it('goes submitted, then checking with an ETA, then the outcome over about a minute', () => {
    const s = scenario({ timing: 'about-60s', outcome: 'no-issues' })

    expect(resolveCheckState(s, 'co-signer', START, START + SUBMITTED_DURATION_MS - 1).phase).toBe('submitted')
    expect(resolveCheckState(s, 'co-signer', START, START + SUBMITTED_DURATION_MS)).toEqual({
      phase: 'checking',
      startedAtMs: START,
      etaMs: START + CHECK_ETA_MS,
    })
    expect(resolveCheckState(s, 'executor', START, START + CHECK_ETA_MS).phase).toBe('no-issues')
  })

  it('keeps checking forever when the check never resolves', () => {
    const s = scenario({ timing: 'never', outcome: 'no-issues' })
    expect(resolveCheckState(s, 'co-signer', START, START + 10 * CHECK_ETA_MS).phase).toBe('checking')
  })

  it('holds a running outcome instead of cycling back to it', () => {
    const s = scenario({ timing: 'about-60s', outcome: 'submitted' })
    expect(resolveCheckState(s, 'co-signer', START, START + 10 * CHECK_ETA_MS).phase).toBe('submitted')
  })

  it('returns the outcome straight away when timing is instant', () => {
    expect(resolveCheckState(scenario({ timing: 'instant', outcome: 'risk' }), 'co-signer', START, START)).toEqual({
      phase: 'risk',
      startedAtMs: START,
      riskDetails: MOCK_RISK_DETAILS,
    })
  })

  it('shows executed transactions with their outcome, never a running check', () => {
    const s = scenario({ timing: 'never', outcome: 'unavailable' })
    expect(resolveCheckState(s, 'first-signer', START, START, { isExecuted: true }).phase).toBe('unavailable')
  })

  it('gives every role the same check, so co-signers never restart the wait', () => {
    const s = scenario({ timing: 'about-60s' })
    const now = START + 30_000
    expect(resolveCheckState(s, 'co-signer', START, now)).toEqual(resolveCheckState(s, 'executor', START, now))
  })
})

describe('resolveRole', () => {
  const flow = { isCreation: false, willExecute: false, onlyExecute: false }

  it.each([
    [{ ...flow, isCreation: true }, 'first-signer'],
    [{ ...flow, isCreation: true, willExecute: true }, 'single-owner'],
    [{ ...flow, willExecute: true }, 'executor'],
    [{ ...flow, onlyExecute: true }, 'executor'],
    [flow, 'co-signer'],
  ] as const)('derives the role from the tx flow (%o → %s)', (input, role) => {
    expect(resolveRole('auto', input)).toBe(role)
  })

  it('lets the scenario force a role', () => {
    expect(resolveRole('executor', { ...flow, isCreation: true })).toBe('executor')
  })
})

describe('fromPublicStatus', () => {
  it.each([
    [CheckStatus.SUBMITTED, 'submitted'],
    [CheckStatus.IN_PROGRESS, 'checking'],
    [CheckStatus.BENIGN, 'no-issues'],
    [CheckStatus.MALICIOUS, 'risk'],
    [CheckStatus.TIMED_OUT, 'unavailable'],
    [CheckStatus.UNAVAILABLE, 'unavailable'],
  ] as const)('maps %s to %s', (status, outcome) => {
    expect(fromPublicStatus(status)).toBe(outcome)
  })
})
