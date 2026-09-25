import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProTrialActivatedModal from '../index'

describe('SafeProTrialActivatedModal', () => {
  it('shows the trial end date and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(<SafeProTrialActivatedModal open onOpenChange={onOpenChange} trialEndsAt={Date.UTC(2026, 11, 6, 12)} />)

    expect(screen.getByRole('heading')).toHaveTextContent('Your free access is active until Dec 6, 2026')
    expect(
      screen.getByText(/add a payment method before your free access ends — nothing is charged until you do/),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves the date out when the trial end is unknown', () => {
    render(<SafeProTrialActivatedModal open onOpenChange={jest.fn()} trialEndsAt={null} />)

    expect(screen.getByRole('heading')).toHaveTextContent(/^Your free access is active$/)
  })

  it('says the subscription starts on its own when checkout already took a payment method', () => {
    render(<SafeProTrialActivatedModal open onOpenChange={jest.fn()} trialEndsAt={0} hasPaymentMethod />)

    expect(screen.getByText(/starts on its own when your free access ends/)).toBeInTheDocument()
    expect(screen.queryByText(/add a payment method/)).not.toBeInTheDocument()
  })

  it('links the CTA to the given href', () => {
    render(
      <SafeProTrialActivatedModal
        open
        onOpenChange={jest.fn()}
        trialEndsAt={0}
        ctaHref="/welcome/select-safes"
        ctaLabel="Continue"
      />,
    )

    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/welcome/select-safes')
  })
})
