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
        nextBillingAt={Date.UTC(2026, 10, 1, 12)}
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent("Your paid subscription is active, you're on Business!")
    expect(screen.getByText("You'll pay €499 on Nov 1, 2026")).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to Workspace' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
