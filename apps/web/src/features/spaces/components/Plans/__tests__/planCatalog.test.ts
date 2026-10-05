import { getCardFeaturesV2 } from '../planCatalog'

const SHARED = ['Shared address book', 'Activity log', 'Advanced threat analysis', 'Transaction simulation']
const FROM_BUSINESS = ['MFA authentication', 'Policy engine', 'Transaction proposers']

describe('getCardFeaturesV2', () => {
  it('lists the Oct 6 feature list in the same order on every card', () => {
    expect(getCardFeaturesV2('Starter')).toEqual(['10 sponsored transactions per month', ...SHARED])
    expect(getCardFeaturesV2('Business')).toEqual(['50 sponsored transactions per month', ...SHARED, ...FROM_BUSINESS])
    expect(getCardFeaturesV2('Enterprise')).toEqual([
      'Unlimited sponsored transactions',
      ...SHARED,
      ...FROM_BUSINESS,
      'Custom Safe capacity',
      'Tailored contract & billing terms',
    ])
  })

  it('has no list for an unknown plan', () => {
    expect(getCardFeaturesV2('Legacy')).toBeUndefined()
  })
})
