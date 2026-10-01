import { getCardCaption, getReadyCopy } from '../copy'
import { getRailSafenetNote, getRailStep } from '../components/SafenetTxRail'

const START = 1_700_000_000_000

describe('getCardCaption', () => {
  it('tells the first signer the check runs after they sign', () => {
    expect(getCardCaption('before-sign', 'review', false)).toEqual({
      text: 'Safenet checks this transaction after you sign. It takes about a minute.',
      isRisk: false,
    })
  })

  it('names the action the signer can still take while the check runs', () => {
    expect(getCardCaption('checking', 'sign', false).text).toBe(
      'Safenet has not reported yet. You can sign now or wait for the result.',
    )
    expect(getCardCaption('checking', 'execute', true).text).toBe(
      'Waiting for the Safenet result. You can still execute now.',
    )
  })

  it('paints a risk red and names the action to review before', () => {
    expect(getCardCaption('risk', 'execute', false)).toEqual({
      text: 'Safenet found a risk in this transaction. Review it before you execute.',
      isRisk: true,
    })
  })
})

describe('getReadyCopy', () => {
  it('counts down to the ETA, then says it is running late', () => {
    expect(getReadyCopy(START + 60_000, START + 17_000)).toBe('Ready in ~43 seconds')
    expect(getReadyCopy(START + 60_000, START + 61_000)).toBe('Taking longer than usual')
  })
})

describe('getRailStep', () => {
  it.each([
    [{ step: 0, stepCount: 4, willExecute: false }, 'create'],
    [{ step: 2, stepCount: 4, willExecute: false }, 'confirm'],
    [{ step: 3, stepCount: 4, willExecute: false }, 'sign'],
    [{ step: 3, stepCount: 4, willExecute: true }, 'execute'],
    [{ step: 0, stepCount: 2, willExecute: false }, 'confirm'],
  ] as const)('maps %o to %s', (input, railStep) => {
    expect(getRailStep(input)).toBe(railStep)
  })
})

describe('getRailSafenetNote', () => {
  it.each([
    [{ phase: 'before-sign' }, 'Safenet starts here'],
    [{ phase: 'checking', etaMs: START + 60_000 }, 'Safenet checking · about 1 min'],
    [{ phase: 'no-issues' }, 'Safenet no issues found'],
    [{ phase: 'risk' }, 'Safenet risk detected'],
  ] as const)('describes %o as "%s"', (state, note) => {
    expect(getRailSafenetNote(state, START)).toBe(note)
  })
})
