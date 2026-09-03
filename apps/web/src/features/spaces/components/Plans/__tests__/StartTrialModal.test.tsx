import { fireEvent, render, screen } from '@/tests/test-utils'
import StartTrialModal from '../StartTrialModal'

describe('StartTrialModal', () => {
  it('preselects Business and reports the chosen tier', () => {
    const onContinue = jest.fn()
    render(<StartTrialModal trialDays={60} open onOpenChange={jest.fn()} onContinue={onContinue} />)

    expect(screen.getByText('Start your 60-day free trial of Safe Pro')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Business/ })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: /^Starter/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start free trial' }))

    expect(onContinue).toHaveBeenCalledWith('starter-month')
  })
})
