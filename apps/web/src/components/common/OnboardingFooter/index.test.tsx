import { render, screen } from '@testing-library/react'
import OnboardingFooter from '.'

describe('OnboardingFooter', () => {
  it('renders a Continue-only footer when no onBack is given', () => {
    render(<OnboardingFooter continueLabel="Continue" />)

    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Back/ })).not.toBeInTheDocument()
  })

  it('renders both buttons when onBack is given', () => {
    render(<OnboardingFooter onBack={jest.fn()} continueLabel="Continue" />)

    expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
  })

  it('should, when onBack is given, render Back and Continue as two equal halves of one wrapping row', () => {
    const { container } = render(<OnboardingFooter onBack={jest.fn()} continueLabel="Continue" />)

    const footer = container.firstElementChild
    expect(footer).toHaveClass('flex', 'flex-wrap', 'items-center')
    expect(footer?.className).not.toMatch(/flex-col/)
    expect(screen.getByRole('button', { name: /Back/ })).toHaveClass('flex-1')
    expect(screen.getByRole('button', { name: /Continue/ })).toHaveClass('flex-1')
  })

  it('should render no chevrons, which cost width the narrowest footer cannot spare', () => {
    const { container } = render(<OnboardingFooter onBack={jest.fn()} continueLabel="Continue" />)

    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('forwards the continue test id and disables the continue button', () => {
    render(<OnboardingFooter continueLabel="Continue" continueDisabled continueTestId="next" />)

    expect(screen.getByTestId('next')).toBeDisabled()
  })

  it('swaps the continue label for a spinner and disables it while loading', () => {
    render(<OnboardingFooter continueLabel="Continue" continueLoading continueTestId="next" />)

    expect(screen.queryByText('Continue')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.getByTestId('next')).toBeDisabled()
  })
})
