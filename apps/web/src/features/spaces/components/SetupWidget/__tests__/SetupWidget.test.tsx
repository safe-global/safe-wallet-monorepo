import { render, screen, fireEvent } from '@/tests/test-utils'
import SetupWidget from '../index'

describe('SetupWidget', () => {
  it('renders the widget title', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Set up your Space')).toBeInTheDocument()
  })

  it('renders all four setup steps', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Import your address book')).toBeInTheDocument()
    expect(screen.getByText('Add your Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Invite team members')).toBeInTheDocument()
    expect(screen.getByText('Explore Spaces')).toBeInTheDocument()
  })

  it('renders the dismiss button', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Dismiss')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss is clicked', () => {
    const onDismiss = jest.fn()
    render(<SetupWidget onDismiss={onDismiss} />)

    fireEvent.click(screen.getByText('Dismiss'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('logs to console when a step is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Import your address book'))

    expect(consoleSpy).toHaveBeenCalledWith('Setup step clicked:', 'address-book')
    consoleSpy.mockRestore()
  })

  it('renders the test id', () => {
    render(<SetupWidget />)

    expect(screen.getByTestId('space-dashboard-setup-widget')).toBeInTheDocument()
  })
})
