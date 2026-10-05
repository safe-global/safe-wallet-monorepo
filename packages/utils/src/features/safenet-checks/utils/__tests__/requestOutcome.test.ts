import { requestOutcome } from '../requestOutcome'

describe('requestOutcome', () => {
  it.each([
    ['PENDING', 'PENDING', 'PENDING'],
    ['FROZEN', 'DISPUTED', 'DISPUTED'],
    ['RESOLVED_APPROVED', 'APPROVED', 'RULED_SECURE'],
    ['RESOLVED_DENIED', 'DENIED', 'RULED_INSECURE'],
    ['TIMED_OUT', 'TIMED_OUT', 'NO_RULING'],
  ] as const)('%s is %s when one side voted and %s when both sides did', (state, uncontested, contested) => {
    expect(requestOutcome({ state, approveCount: 2, denyCount: 0 })).toBe(uncontested)
    expect(requestOutcome({ state, approveCount: 0, denyCount: 3 })).toBe(uncontested)
    expect(requestOutcome({ state, approveCount: 1, denyCount: 1 })).toBe(contested)
  })
})
