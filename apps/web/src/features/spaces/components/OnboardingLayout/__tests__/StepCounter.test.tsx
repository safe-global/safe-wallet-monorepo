import { render, screen } from '@testing-library/react'
import StepCounter from '../StepCounter'

describe('StepCounter', () => {
  it('renders "STEP N / TOTAL" text', () => {
    render(<StepCounter currentStep={2} totalSteps={4} />)
    expect(screen.getByText('STEP 2 / 4')).toBeInTheDocument()
  })

  it('exposes accessible step label', () => {
    render(<StepCounter currentStep={3} totalSteps={4} />)
    expect(screen.getByRole('group', { name: 'Step 3 of 4' })).toBeInTheDocument()
  })
})
