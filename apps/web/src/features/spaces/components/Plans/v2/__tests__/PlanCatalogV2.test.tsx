import { render, screen } from '@/tests/test-utils'
import { YEARLY_SAVINGS_LABEL, READ_ONLY_NOTE } from '../../PlanCards'
import { ENTERPRISE_TIER } from '../../planCatalog'
import type { PlanSeatOption, PlanTier } from '../../types'
import PlanCatalogV2 from '../PlanCatalogV2'

const option = (billingCycle: 'month' | 'year'): PlanSeatOption => ({
  paymentLinkId: `pl_b20${billingCycle}`,
  priceId: `price_b20${billingCycle}`,
  label: '20 Safe accounts',
  seats: 20,
  price: null,
  amountMinor: billingCycle === 'year' ? 1_742_400 : 166_900,
  originalPrice: null,
})

const tier = (billingCycle: 'month' | 'year'): PlanTier => ({
  id: `Business-${billingCycle}`,
  name: 'Business',
  currency: 'eur',
  billingCycle,
  options: [option(billingCycle)],
  features: [],
})

describe('PlanCatalogV2', () => {
  it('advertises the yearly saving with the v2 label', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), tier('year'), ENTERPRISE_TIER]} />)

    expect(screen.getByText('Save ~13%')).toBeInTheDocument()
    expect(screen.queryByText(YEARLY_SAVINGS_LABEL)).not.toBeInTheDocument()
  })

  it('shows no saving when no plan has a yearly price', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), ENTERPRISE_TIER]} />)

    expect(screen.queryByText('Save ~13%')).not.toBeInTheDocument()
  })

  it('tells a member who is not an admin why there are no buttons', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), ENTERPRISE_TIER]} readOnly />)

    expect(screen.getByText(READ_ONLY_NOTE)).toBeInTheDocument()
  })
})
