import { fireEvent, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { YEARLY_SAVINGS_LABEL, READ_ONLY_NOTE } from '../../PlanCards'
import { ENTERPRISE_TIER } from '../../planCatalog'
import type { PlanSeatOption, PlanTier } from '../../types'
import PlanCatalogV2 from '../PlanCatalogV2'

const option = (billingCycle: 'month' | 'year'): PlanSeatOption => ({
  paymentLinkId: `pl_b20${billingCycle}`,
  priceId: `price_b20${billingCycle}`,
  label: '20 Safe accounts',
  seats: 20,
  price: billingCycle === 'year' ? 17_424 : 1669,
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

    expect(screen.getByText('· save 13%')).toHaveClass('text-muted-foreground')
    expect(screen.queryByText(YEARLY_SAVINGS_LABEL)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Yearly/ }))
    expect(screen.getByText('· save 13%')).toHaveClass('text-foreground')
  })

  it('shows no saving when no plan has a yearly price', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), ENTERPRISE_TIER]} />)

    expect(screen.queryByText(/save 13%/)).not.toBeInTheDocument()
  })

  it('tells a member who is not an admin why there are no buttons', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), ENTERPRISE_TIER]} readOnly />)

    expect(screen.getByText(READ_ONLY_NOTE)).toBeInTheDocument()
  })

  it('switches every card to its yearly price from the billing-cycle toggle', () => {
    render(<PlanCatalogV2 tiers={[tier('month'), tier('year'), ENTERPRISE_TIER]} />)
    expect(screen.getByText('€1,669')).toBeInTheDocument()
    expect(screen.getAllByTestId('plan-price-line')[0]).toHaveTextContent('Billed monthly · excl. VAT')

    fireEvent.click(screen.getByRole('tab', { name: /Yearly/ }))

    expect(screen.getByText('€17,424')).toBeInTheDocument()
    expect(screen.getByText('/yr')).toBeInTheDocument()
    expect(screen.getAllByTestId('plan-price-line')[0]).toHaveTextContent('Billed yearly · excl. VAT')
  })

  it('keeps the picked Safe count when switching between monthly and yearly', async () => {
    const sized = (billingCycle: 'month' | 'year'): PlanTier => ({
      ...tier(billingCycle),
      options: [
        {
          ...option(billingCycle),
          paymentLinkId: `pl_b5${billingCycle}`,
          priceId: `price_b5${billingCycle}`,
          label: '5 Safe accounts',
          seats: 5,
        },
        option(billingCycle),
      ],
    })
    const { user } = renderWithUserEvent(<PlanCatalogV2 tiers={[sized('month'), sized('year')]} />)
    const seats = () => screen.getByRole('combobox', { name: 'Safe accounts for Business' })
    expect(seats()).toHaveTextContent('5 Safe accounts')

    await user.click(seats())
    await user.click(await screen.findByRole('option', { name: '20 Safe accounts' }))
    fireEvent.click(screen.getByRole('tab', { name: /Yearly/ }))
    expect(seats()).toHaveTextContent('20 Safe accounts')

    fireEvent.click(screen.getByRole('tab', { name: /Monthly/ }))
    expect(seats()).toHaveTextContent('20 Safe accounts')
  })
})
