import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProSubscriptionActivatedModal from '../index'

describe('SafeProSubscriptionActivatedModal', () => {
  it('shows the plan, price and next billing date, and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(
      <SafeProSubscriptionActivatedModal
        open
        onOpenChange={onOpenChange}
        planName="Business"
        price={499}
        currency="eur"
        billingCycle="month"
        nextBillingAt={Date.UTC(2026, 9, 1, 12)}
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Your Workspace is now on Safe Pro')
    expect(screen.getByText('Business plan, €499 per month. Your next payment is on Oct 1, 2026.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to Workspace' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
