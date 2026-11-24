import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { PlanLocation } from '@/services/analytics/mixpanel-events'
import type { PlanSeatOption, PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { PlanPicker } from '../PlanPicker'

const option = (seats: number, price: number, cycle: 'm' | 'y' = 'm'): PlanSeatOption => ({
  paymentLinkId: `pl_${seats}${cycle}`,
  priceId: `price_${seats}${cycle}`,
  label: `${seats} Safe accounts`,
  seats,
  price,
  originalPrice: null,
})

const tier = (name: string, billingCycle: 'month' | 'year', options: PlanSeatOption[]): PlanTier => ({
  id: `${name}-${billingCycle}`,
  name,
  currency: 'eur',
  billingCycle,
  options,
  features: [],
})

const TIERS = [
  tier('Starter', 'month', [option(2, 189)]),
  tier('Starter', 'year', [option(2, 1990, 'y')]),
  tier('Business', 'month', [option(5, 669), option(20, 1669)]),
  tier('Business', 'year', [option(5, 7190, 'y'), option(20, 17_990, 'y')]),
]

describe('PlanPicker', () => {
  it('shows one card whose plan and price follow the picked size, on either billing cycle', async () => {
    const onSubscribe = jest.fn()
    const { user } = renderWithUserEvent(
      <PlanPicker tiers={TIERS} initialSeats={3} location={PlanLocation.LOCKED_MODAL} onSubscribe={onSubscribe} />,
    )

    expect(screen.getAllByTestId('plan-card')).toHaveLength(1)
    expect(screen.getByRole('tab', { selected: true, name: '5 Safe accounts' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Business' })).toBeInTheDocument()
    expect(screen.getByText('€669')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '2 Safe accounts' }))
    expect(screen.getByRole('heading', { name: 'Starter' })).toBeInTheDocument()
    expect(screen.getByText('€189')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Yearly' }))
    expect(screen.getByRole('tab', { selected: true, name: '2 Safe accounts' })).toBeInTheDocument()
    expect(screen.getByText('€1,990')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue with Starter' }))
    expect(onSubscribe).toHaveBeenCalledWith({
      tier: expect.objectContaining({ id: 'Starter-year' }),
      option: expect.objectContaining({ paymentLinkId: 'pl_2y' }),
    })
  })

  it('shows a member the sizes without any button', () => {
    renderWithUserEvent(<PlanPicker tiers={TIERS} readOnly location={PlanLocation.REMINDER_MODAL} />)

    expect(screen.getByRole('tab', { selected: true, name: '2 Safe accounts' })).toBeInTheDocument()
    expect(screen.queryByTestId('plan-ctas')).not.toBeInTheDocument()
    expect(screen.getByText(/Only admins can change the plan/)).toBeInTheDocument()
  })
})
