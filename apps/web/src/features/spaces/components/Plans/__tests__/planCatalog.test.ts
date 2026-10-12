import {
  getCardFeatures,
  POLICIES,
  WORKSPACE_2FA,
} from '@safe-global/views/features/spaces/components/Plans/planCatalog'

const SHARED = [
  'Shared address book',
  'Activity log',
  'Advanced threat analysis',
  'Transaction simulation',
  WORKSPACE_2FA,
]
const FROM_BUSINESS = [POLICIES]

describe('getCardFeatures', () => {
  it('lists the Oct 6 feature list in the same order on every card', () => {
    expect(getCardFeatures('Starter')).toEqual(['10 sponsored transactions per month', ...SHARED])
    expect(getCardFeatures('Business')).toEqual(['50 sponsored transactions per month', ...SHARED, ...FROM_BUSINESS])
    expect(getCardFeatures('Enterprise')).toEqual([
      'Unlimited sponsored transactions',
      ...SHARED,
      ...FROM_BUSINESS,
      'Custom Safe capacity',
      'Tailored contract & billing terms',
    ])
  })

  it('has no list for an unknown plan', () => {
    expect(getCardFeatures('Legacy')).toBeUndefined()
  })
})
