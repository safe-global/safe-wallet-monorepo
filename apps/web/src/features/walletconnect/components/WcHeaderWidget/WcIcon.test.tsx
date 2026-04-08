import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WcIcon from './WcIcon'

jest.mock('@/components/common/Track', () => {
  const MockTrack = ({ children }: { children: React.ReactNode }) => <>{children}</>
  MockTrack.displayName = 'Track'
  return { __esModule: true, default: MockTrack }
})

describe('WcIcon', () => {
  const defaultProps = {
    onClick: jest.fn(),
    sessionCount: 0,
    isError: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the WalletConnect button', () => {
    render(<WcIcon {...defaultProps} />)

    expect(screen.getByLabelText('WalletConnect')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    render(<WcIcon {...defaultProps} />)

    await userEvent.click(screen.getByLabelText('WalletConnect'))
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  it('shows success badge when sessionCount > 0', () => {
    render(<WcIcon {...defaultProps} sessionCount={2} />)

    expect(screen.getByLabelText('2 WalletConnect sessions')).toBeInTheDocument()
  })

  it('shows error badge when isError is true', () => {
    render(<WcIcon {...defaultProps} isError />)

    expect(screen.getByLabelText('WalletConnect error')).toBeInTheDocument()
  })

  it('does not show badge when sessionCount is 0 and no error', () => {
    render(<WcIcon {...defaultProps} />)

    expect(screen.queryByLabelText(/WalletConnect sessions/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('WalletConnect error')).not.toBeInTheDocument()
  })
})
