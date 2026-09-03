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
})
