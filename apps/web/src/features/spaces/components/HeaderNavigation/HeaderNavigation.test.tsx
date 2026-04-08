import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderNavigation } from './HeaderNavigation'

describe('HeaderNavigation', () => {
  const defaultProps = {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
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

  it('shows batch count badge when batchCount > 0', () => {
    render(<HeaderNavigation {...defaultProps} showBatch batchCount={3} />)

    expect(screen.getByLabelText('3 batched transactions')).toBeInTheDocument()
  })

  it('hides batch count badge when batchCount is 0', () => {
    render(<HeaderNavigation {...defaultProps} showBatch batchCount={0} />)

    expect(screen.queryByLabelText(/batched transactions/)).not.toBeInTheDocument()
  })

  it('shows unread notification badge when messages > 0', () => {
    render(<HeaderNavigation {...defaultProps} messages={5} />)

    expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument()
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
