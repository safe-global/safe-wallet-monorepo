import { fireEvent, render, screen } from '@/tests/test-utils'
import TrialFlow from '../TrialFlow'

jest.mock('../StartTrialModal', () => ({
  __esModule: true,
  default: ({ open, onContinue }: { open: boolean; onContinue: () => void }) =>
    open ? <button onClick={onContinue}>finish trial setup</button> : null,
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SafeProTrialActivatedModal: ({ open, trialEndsAt }: { open: boolean; trialEndsAt: number }) =>
      open ? <div data-testid="activated" data-ends={trialEndsAt} /> : null,
  }),
  createFeatureHandle: () => ({}),
}))

describe('TrialFlow', () => {
  it('closes the trial dialog and shows the activation modal ending trialDays from now', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T00:00:00Z'))
    const onOpenChange = jest.fn()
    render(<TrialFlow trialDays={30} open onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'finish trial setup' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('activated')).toHaveAttribute('data-ends', String(Date.UTC(2026, 10, 5)))
    jest.useRealTimers()
  })
})
