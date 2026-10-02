import { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  PHASE_PRESENTATION,
  SAFENET_ABOUT_COPY,
  SAFENET_ETA_COPY,
  SAFENET_OVERDUE_COPY,
  getActionNote,
  getEtaCopy,
} from '../copy'

const START = 1_700_000_000_000
const running = { etaMs: START + 60_000, nowMs: START + 30_000 }

describe('Safenet prototype copy', () => {
  it('explains Safenet in the empty state instead of a tooltip', () => {
    expect(PHASE_PRESENTATION['before-sign'].copy).toBe(`Checks this transaction after you sign. ${SAFENET_ABOUT_COPY}`)
    expect(SAFENET_ABOUT_COPY).toContain('about a minute')
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

  it('switches the ETA copy once the ETA has passed', () => {
    expect(getEtaCopy(60_000, 59_999)).toBe(SAFENET_ETA_COPY)
    expect(getEtaCopy(60_000, 60_000)).toBe(SAFENET_OVERDUE_COPY)
    expect(getEtaCopy(undefined, 1)).toBe(SAFENET_ETA_COPY)
  })
})

describe('getActionNote', () => {
  it('tells the first signer the check starts when they sign and is ready for the next signer', () => {
    expect(getActionNote('before-sign', 'first-signer', running).text).toBe(
      "Safenet starts checking once you sign. It takes about a minute. You can sign now, and it'll be ready for the next signer.",
    )
  })

  it('tells the last signer they can come back to execute', () => {
    expect(getActionNote('checking', 'final-signer', running).text).toBe(
      "Safenet is still checking. It takes about a minute. You can sign now and come back to execute once it's done.",
    )
  })

  it('lets the executor go ahead or come back, and says when it runs late', () => {
    expect(getActionNote('checking', 'executor', { etaMs: START, nowMs: START + 1 }).text).toBe(
      "Safenet is still checking. It's taking longer than usual. You can execute now or come back once it's done.",
    )
  })

  it('shows a risk as an alert naming the action to review before', () => {
    expect(getActionNote('risk', 'executor', running)).toEqual({
      text: 'Safenet found a risk in this transaction. Review it before you execute.',
      isRisk: true,
    })
  })
})
