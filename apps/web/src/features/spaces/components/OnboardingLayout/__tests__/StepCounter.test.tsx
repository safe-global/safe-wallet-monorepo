import { render, screen } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import StepCounter from '../StepCounter'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

describe('StepCounter', () => {
  it('renders "STEP N / TOTAL" text', () => {
    render(<StepCounter currentStep={2} totalSteps={4} />)
    expect(screen.getByText('STEP 2 / 4')).toBeInTheDocument()
  })

  it('tracks the step viewed by number and name', () => {
    render(<StepCounter currentStep={2} totalSteps={4} />)
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.WORKSPACE_CREATE_STEP_VIEWED, {
      'Step Number': 2,
      'Step Name': 'select_safes',
    })
  })

  it('exposes accessible step label', () => {
    render(<StepCounter currentStep={3} totalSteps={4} />)
    expect(screen.getByRole('group', { name: 'Step 3 of 4' })).toBeInTheDocument()
  })
})
