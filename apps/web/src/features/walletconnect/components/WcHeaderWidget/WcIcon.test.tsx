import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WcIcon from './WcIcon'

jest.mock('@/components/common/Track', () => {
  return {
    __esModule: true,

    default: (props: any) => <>{props.children}</>,
  }
})

jest.mock('@/components/safe-apps/SafeAppIconCard', () => {
  return {
    __esModule: true,

    default: (props: any) => <img alt={props.alt} />,
  }
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

  it('shows dApp icon when 1 session with icon', () => {
    render(<WcIcon {...defaultProps} sessionCount={1} sessionIcon="https://cow.fi/icon.png" />)

    expect(screen.getByLabelText('Connected dApp')).toBeInTheDocument()
    expect(screen.getByAltText('Connected dApp icon')).toBeInTheDocument()
  })

  it('shows session count badge when multiple sessions', () => {
    render(<WcIcon {...defaultProps} sessionCount={3} />)

    const badge = screen.getByLabelText('3 WalletConnect sessions')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('3')
  })

  it('shows error badge when isError is true', () => {
    render(<WcIcon {...defaultProps} isError />)

    expect(screen.getByLabelText('WalletConnect error')).toBeInTheDocument()
  })

  it('does not show badge when sessionCount is 0 and no error', () => {
    render(<WcIcon {...defaultProps} />)

    expect(screen.queryByLabelText(/WalletConnect sessions/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('WalletConnect error')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Connected dApp')).not.toBeInTheDocument()
  })
})
