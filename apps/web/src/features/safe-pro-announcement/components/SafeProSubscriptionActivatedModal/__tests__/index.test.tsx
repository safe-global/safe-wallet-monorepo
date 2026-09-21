import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProSubscriptionActivatedModal from '../index'

describe('SafeProSubscriptionActivatedModal', () => {
  it('names the plan and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(
      <SafeProSubscriptionActivatedModal
        open
        onOpenChange={onOpenChange}
        planName="Business"
        seatsLabel="5 Safe accounts"
      />,
    )

    expect(screen.getByRole('heading')).toHaveTextContent("Your paid subscription is active, you're on Business!")
    expect(screen.getByTestId('subscription-seats')).toHaveTextContent('Business · 5 Safe accounts')

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
