import { getStepperNote } from '../SafenetStepperNote'

const START = 1_700_000_000_000

describe('getStepperNote', () => {
  it.each([
    [{ phase: 'before-sign' }, 'Safenet checks after you sign'],
    [{ phase: 'submitted' }, 'Safenet: submitted'],
    [{ phase: 'checking', etaMs: START + 60_000 }, 'Safenet: checking · about 1 min'],
    [{ phase: 'no-issues' }, 'Safenet: no issues found'],
    [{ phase: 'risk' }, 'Safenet: risk detected'],
    [{ phase: 'unavailable' }, 'Safenet: unavailable'],
    [{ phase: 'locked' }, 'Safenet: off'],
  ] as const)('describes %o as "%s"', (state, note) => {
    expect(getStepperNote(state, START)).toBe(note)
  })
})
