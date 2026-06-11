import { render, screen } from '@/tests/test-utils'
import LaunchScreenView from './LaunchScreenView'

describe('LaunchScreenView', () => {
  it('renders the logo, progress bar and caption inside a status region', () => {
    render(<LaunchScreenView progress={65} caption="Fetching your accounts…" />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId('launch-screen')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByAltText('Safe')).toBeInTheDocument()
    expect(screen.getByText('Fetching your accounts…')).toBeInTheDocument()
    expect(screen.getByTestId('launch-progress-bar')).toHaveStyle({ width: '65%' })
  })

  it('marks itself not busy and non-interactive while exiting', () => {
    render(<LaunchScreenView progress={100} caption="" exiting />)

    const root = screen.getByTestId('launch-screen')
    expect(root).toHaveAttribute('aria-busy', 'false')
    expect(root).toHaveClass('opacity-0')
  })
})
