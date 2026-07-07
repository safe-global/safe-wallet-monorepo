import { render, screen } from '@/tests/test-utils'
import LaunchScreen from './index'
import { useLaunchScreen } from './useLaunchScreen'

jest.mock('./useLaunchScreen')

const mockUseLaunchScreen = useLaunchScreen as jest.Mock

describe('LaunchScreen', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the logo, progress bar and caption inside a status region while visible', () => {
    mockUseLaunchScreen.mockReturnValue({ visible: true })
    render(<LaunchScreen />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId('launch-screen')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByAltText('Safe')).toBeInTheDocument()
    expect(screen.getByText('Loading Safe{Wallet}…')).toBeInTheDocument()
    expect(screen.getByTestId('launch-progress-bar')).toHaveStyle({ width: '30%' })
  })

  it('marks itself not busy, non-interactive and full while exiting', () => {
    mockUseLaunchScreen.mockReturnValue({ visible: false })
    render(<LaunchScreen />)

    const root = screen.getByTestId('launch-screen')
    expect(root).toHaveAttribute('aria-busy', 'false')
    expect(root).toHaveClass('opacity-0')
    expect(screen.getByTestId('launch-progress-bar')).toHaveStyle({ width: '100%' })
  })
})
