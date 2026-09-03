import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProTrialActivatedModal from '../index'

describe('SafeProTrialActivatedModal', () => {
  it('shows the trial end date and closes from the CTA', () => {
    const onOpenChange = jest.fn()
    render(<SafeProTrialActivatedModal open onOpenChange={onOpenChange} trialEndsAt={Date.UTC(2026, 11, 6, 12)} />)

    expect(screen.getByRole('heading')).toHaveTextContent('Your Safe Pro trial is active until Dec 6, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Go to Workspace' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('links the CTA to the create-workspace flow when given a href', () => {
    render(<SafeProTrialActivatedModal open onOpenChange={jest.fn()} trialEndsAt={0} ctaHref="/welcome/create-space" />)

    expect(screen.getByRole('link', { name: 'Go to Workspace' })).toHaveAttribute('href', '/welcome/create-space')
  })
})
