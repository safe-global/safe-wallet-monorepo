import { fireEvent, render, screen } from '@/tests/test-utils'
import StartTrialModal from '../StartTrialModal'

jest.mock('../SelectAccountsStep', () => ({
  __esModule: true,
  default: ({ limit, onContinue }: { limit: number; onContinue: (ids: string[]) => void }) => (
    <button onClick={() => onContinue(['1:0xA'])}>accounts step, limit {limit}</button>
  ),
}))

describe('StartTrialModal', () => {
  it('preselects Business, then reports tier, seats and safes after the accounts step', () => {
    const onContinue = jest.fn()
    render(<StartTrialModal trialDays={60} open onOpenChange={jest.fn()} onContinue={onContinue} />)

    expect(screen.getByText('Start your 60-day free trial of Safe Pro')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Business/ })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: /^Starter/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start free trial' }))

    fireEvent.click(screen.getByRole('button', { name: 'accounts step, limit 2' }))
    expect(onContinue).toHaveBeenCalledWith({ tierId: 'starter-month', seats: '2 Safe accounts', safeIds: ['1:0xA'] })
  })

  it('reports the plan straight away when the accounts step is off', () => {
    const onContinue = jest.fn()
    render(
      <StartTrialModal trialDays={30} open onOpenChange={jest.fn()} onContinue={onContinue} selectAccounts={false} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Start free trial' }))

    expect(onContinue).toHaveBeenCalledWith({ tierId: 'business-month', seats: '10 Safe accounts', safeIds: [] })
    expect(screen.queryByText(/accounts step/)).not.toBeInTheDocument()
  })
})
