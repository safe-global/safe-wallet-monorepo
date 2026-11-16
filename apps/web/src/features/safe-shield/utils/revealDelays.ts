export const BASE_DELAY = 300
export const STAGGER_STEP = 150

export type AnalysisCard = 'recipient' | 'contract' | 'deadlock' | 'threat' | 'customChecks' | 'simulation'

export const CARD_ORDER: readonly AnalysisCard[] = [
  'recipient',
  'contract',
  'deadlock',
  'threat',
  'customChecks',
  'simulation',
]

export const PRO_CARD_ORDER: readonly AnalysisCard[] = [
  'threat',
  'customChecks',
  'recipient',
  'contract',
  'deadlock',
  'simulation',
]

/**
 * Staggers the reveal of the shown analysis cards in their display order, so the cascade has no gaps.
 *
 * @param order - The cards in the order the layout displays them.
 * @param shown - Which cards have something to show.
 * @returns The reveal delay (ms) of each shown card; hidden cards have none.
 */
export const getRevealDelays = (
  order: readonly AnalysisCard[],
  shown: Record<AnalysisCard, boolean>,
): Partial<Record<AnalysisCard, number>> => {
  const delays: Partial<Record<AnalysisCard, number>> = {}
  order
    .filter((card) => shown[card])
    .forEach((card, index) => {
      delays[card] = BASE_DELAY + index * STAGGER_STEP
    })
  return delays
}
