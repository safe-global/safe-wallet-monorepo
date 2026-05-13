import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderNavigation } from './HeaderNavigation'

describe('HeaderNavigation', () => {
  const defaultProps = {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    isConnected: true,
  }

  it('renders notifications and wallet buttons by default', () => {
    render(<HeaderNavigation {...defaultProps} />)

    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Wallet/)).toBeInTheDocument()
  })

  it('truncates wallet address to 6...4 format', () => {
    render(<HeaderNavigation {...defaultProps} />)

    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
  })

  it('shows ENS name instead of address when provided', () => {
    render(<HeaderNavigation {...defaultProps} walletEns="vitalik.eth" />)

    expect(screen.getByText('vitalik.eth')).toBeInTheDocument()
    expect(screen.queryByText('0x1234...5678')).not.toBeInTheDocument()
  })

  it('shows "Connect Wallet" text when wallet is not connected', () => {
    render(<HeaderNavigation walletAddress="" isConnected={false} />)

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('shows search button when showSearch is true', () => {
    render(<HeaderNavigation {...defaultProps} showSearch />)

    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('hides search button by default', () => {
    render(<HeaderNavigation {...defaultProps} />)

    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument()
  })

  it('renders walletConnectSlot when provided', () => {
    render(<HeaderNavigation {...defaultProps} walletConnectSlot={<button aria-label="WalletConnect">WC</button>} />)

    expect(screen.getByLabelText('WalletConnect')).toBeInTheDocument()
  })

  it('does not render walletConnectSlot by default', () => {
    render(<HeaderNavigation {...defaultProps} />)

    expect(screen.queryByLabelText('WalletConnect')).not.toBeInTheDocument()
  })

  it('shows Batch button when showBatch is true', () => {
    render(<HeaderNavigation {...defaultProps} showBatch />)

    expect(screen.getByLabelText('Batch transactions')).toBeInTheDocument()
  })

  it('hides Batch button by default', () => {
    render(<HeaderNavigation {...defaultProps} />)

    expect(screen.queryByLabelText('Batch transactions')).not.toBeInTheDocument()
  })

  it('shows batch count number when batchCount > 0', () => {
    render(<HeaderNavigation {...defaultProps} showBatch batchCount={3} />)

    const badge = screen.getByLabelText('3 batched transactions')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('3')
  })

  it('caps batch count display at 99+', () => {
    render(<HeaderNavigation {...defaultProps} showBatch batchCount={150} />)

    const badge = screen.getByLabelText('150 batched transactions')
    expect(badge).toHaveTextContent('99+')
  })

  it('hides batch count badge when batchCount is 0', () => {
    render(<HeaderNavigation {...defaultProps} showBatch batchCount={0} />)

    expect(screen.queryByLabelText(/batched transactions/)).not.toBeInTheDocument()
  })

  it('shows unread notification count when messages > 0', () => {
    render(<HeaderNavigation {...defaultProps} messages={5} />)

    const badge = screen.getByLabelText('5 unread messages')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('5')
  })

  it('caps notification count display at 99+', () => {
    render(<HeaderNavigation {...defaultProps} messages={120} />)

    const badge = screen.getByLabelText('120 unread messages')
    expect(badge).toHaveTextContent('99+')
  })

  it('calls onBatchClick when batch button is clicked', async () => {
    const onBatchClick = jest.fn()
    render(<HeaderNavigation {...defaultProps} showBatch onBatchClick={onBatchClick} />)

    await userEvent.click(screen.getByLabelText('Batch transactions'))
    expect(onBatchClick).toHaveBeenCalledTimes(1)
  })

  it('renders walletConnectSlot in correct position', () => {
    render(<HeaderNavigation {...defaultProps} walletConnectSlot={<div data-testid="wc-slot" />} showBatch />)

    expect(screen.getByTestId('wc-slot')).toBeInTheDocument()
  })

  it('calls onNotificationsClick when notifications button is clicked', async () => {
    const onNotificationsClick = jest.fn()
    render(<HeaderNavigation {...defaultProps} onNotificationsClick={onNotificationsClick} />)

    await userEvent.click(screen.getByLabelText('Notifications'))
    expect(onNotificationsClick).toHaveBeenCalledTimes(1)
  })
})
