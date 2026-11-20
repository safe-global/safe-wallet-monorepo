import { fireEvent, render, screen } from '@/tests/test-utils'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { TRY_PRO_REASONS, TryProProvider, useTryPro } from '../tryPro'

const TIERS: PlanTier[] = [
  {
    id: 'business-month',
    name: 'Business',
    currency: 'eur',
    billingCycle: 'month',
    options: [
      {
        paymentLinkId: 'pl_5',
        priceId: 'price_5',
        label: '5 Safe accounts',
        seats: 5,
        price: 100,
        originalPrice: null,
      },
    ],
    features: ['Business feature'],
  },
]

const Prompt = () => {
  const openTryPro = useTryPro()
  return openTryPro ? (
    <button onClick={() => openTryPro(TRY_PRO_REASONS.contract)}>Unlock</button>
  ) : (
    <span>Links to plans</span>
  )
}

describe('tryPro', () => {
  it('leaves prompts on their plans link outside the provider', () => {
    render(<Prompt />)

    expect(screen.getByText('Links to plans')).toBeInTheDocument()
  })

  it('opens Try Safe Pro with the prompt reason inside the provider', () => {
    render(
      <TryProProvider tiers={TIERS} safeCount={3}>
        <Prompt />
      </TryProProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(screen.getByRole('dialog')).toHaveTextContent(TRY_PRO_REASONS.contract)
  })
})
