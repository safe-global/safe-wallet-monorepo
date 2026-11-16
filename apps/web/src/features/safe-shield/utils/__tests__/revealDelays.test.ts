import {
  BASE_DELAY,
  CARD_ORDER,
  PRO_CARD_ORDER,
  STAGGER_STEP,
  getRevealDelays,
  type AnalysisCard,
} from '../revealDelays'

const NONE_SHOWN: Record<AnalysisCard, boolean> = {
  recipient: false,
  contract: false,
  deadlock: false,
  threat: false,
  customChecks: false,
  simulation: false,
}

const showing = (...cards: AnalysisCard[]): Record<AnalysisCard, boolean> => ({
  ...NONE_SHOWN,
  ...Object.fromEntries(cards.map((card) => [card, true])),
})

const slot = (index: number) => BASE_DELAY + index * STAGGER_STEP

describe('getRevealDelays', () => {
  it('staggers every card in display order when all of them are shown', () => {
    const delays = getRevealDelays(
      CARD_ORDER,
      showing('recipient', 'contract', 'deadlock', 'threat', 'customChecks', 'simulation'),
    )

    expect(delays).toEqual({
      recipient: slot(0),
      contract: slot(1),
      deadlock: slot(2),
      threat: slot(3),
      customChecks: slot(4),
      simulation: slot(5),
    })
  })

  it('closes the gaps left by empty cards, so the first shown card gets the base delay', () => {
    const delays = getRevealDelays(CARD_ORDER, showing('contract', 'threat', 'simulation'))

    expect(delays).toEqual({ contract: slot(0), threat: slot(1), simulation: slot(2) })
  })

  it('follows the Safe Pro order, where the threat card comes before the counterparty checks', () => {
    const delays = getRevealDelays(PRO_CARD_ORDER, showing('recipient', 'threat', 'simulation'))

    expect(delays).toEqual({ threat: slot(0), recipient: slot(1), simulation: slot(2) })
  })

  it('gives no delay to any card when none is shown', () => {
    expect(getRevealDelays(CARD_ORDER, NONE_SHOWN)).toEqual({})
  })
})
