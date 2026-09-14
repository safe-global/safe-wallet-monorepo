import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProTrialActivatedModal from '../index'

describe('SafeProTrialActivatedModal', () => {
  it('shows the trial end date and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(<SafeProTrialActivatedModal open onOpenChange={onOpenChange} trialEndsAt={Date.UTC(2026, 11, 6, 12)} />)

    expect(screen.getByRole('heading')).toHaveTextContent('Your free trial is active until Dec 6, 2026')
    expect(screen.getByText(/Nothing is charged until you do/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add billing details now' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('links the CTA to the given href and offers billing details when asked', () => {
    const onAddBillingDetails = jest.fn()
    render(
      <SafeProTrialActivatedModal
        open
        onOpenChange={jest.fn()}
        trialEndsAt={0}
        ctaHref="/welcome/select-safes"
        ctaLabel="Continue"
        onAddBillingDetails={onAddBillingDetails}
      />,
    )

    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/welcome/select-safes')
    fireEvent.click(screen.getByRole('button', { name: 'Add billing details now' }))
    expect(onAddBillingDetails).toHaveBeenCalled()
  })
})
