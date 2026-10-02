import { getCardComingSoonV2, getCardFeaturesV2 } from '../planCatalog'

describe('getCardFeaturesV2', () => {
  it('lists everything a plan includes, its own features before the shared ones', () => {
    const business = getCardFeaturesV2('Business')

    expect(business?.slice(0, 4)).toEqual([
      '50 eligible sponsored transactions per month, up to €5 each',
      'Spending limits',
      'Transaction proposers',
      'Self-custodial account recovery',
    ])
    expect(business).toEqual(expect.arrayContaining(['Shared address book', 'Transaction simulation']))
    expect(business).not.toContain('Custom Safe capacity')
  })

  it('gives Enterprise every card feature, with its own quota', () => {
    const enterprise = getCardFeaturesV2('Enterprise')

    expect(enterprise).toHaveLength(12)
    expect(enterprise).toContain('Unlimited eligible sponsored transactions, up to €10 each')
    expect(enterprise).not.toContain('50 eligible sponsored transactions per month, up to €5 each')
  })

  it('leaves out higher-plan features on Starter', () => {
    expect(getCardFeaturesV2('Starter')).not.toContain('Spending limits')
  })

  it('has no list for an unknown plan', () => {
    expect(getCardFeaturesV2('Legacy')).toBeUndefined()
  })
})

describe('getCardComingSoonV2', () => {
  it('lists the coming features on every plan that gets them', () => {
    expect(getCardComingSoonV2('Starter')).toEqual([])
    expect(getCardComingSoonV2('Business')).toEqual(getCardComingSoonV2('Enterprise'))
    expect(getCardComingSoonV2('Enterprise')).toHaveLength(3)
  })
})
