import { fireEvent, render, screen } from '@/tests/test-utils'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { TryProModal } from '../TryProModal'

const option = (seats: number, price: number) => ({
  paymentLinkId: `pl_${seats}`,
  priceId: `price_${seats}`,
  label: `${seats} Safe accounts`,
  seats,
  price,
  originalPrice: null,
})
const TIERS: PlanTier[] = [
  {
    id: 'business-month',
    name: 'Business',
    currency: 'eur',
    billingCycle: 'month',
    options: [option(5, 100), option(10, 180)],
    features: ['Business feature'],
  },
]

describe('TryProModal', () => {
  it('shows the reason above the plan cards', () => {
    render(<TryProModal tiers={TIERS} reason="Because" onClose={jest.fn()} />)

    expect(screen.getByRole('dialog')).toHaveTextContent('Try Safe Pro')
    expect(screen.getByText('Because')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
  })

  it('closes from Not now', () => {
    const onClose = jest.fn()
    render(<TryProModal tiers={TIERS} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))

    expect(onClose).toHaveBeenCalled()
  })
})
