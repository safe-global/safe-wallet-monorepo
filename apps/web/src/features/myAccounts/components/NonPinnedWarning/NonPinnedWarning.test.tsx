import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import NonPinnedWarning from './index'

describe('NonPinnedWarning', () => {
  const defaultProps = {
    safeAddress: '0x1234567890123456789012345678901234567890',
    safeName: undefined,
    chainId: '1',
    hasSimilarAddress: false,
    similarAddresses: [],
    isConfirmDialogOpen: false,
    onOpenConfirmDialog: jest.fn(),
    onCloseConfirmDialog: jest.fn(),
    onConfirmAdd: jest.fn(),
    onDismiss: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render warning banner', () => {
    render(<NonPinnedWarning {...defaultProps} />)

    expect(screen.getByTestId('non-pinned-warning')).toBeInTheDocument()
    expect(screen.getByText('Not in your trusted list')).toBeInTheDocument()
    expect(screen.getByText(/haven.t marked it as trusted yet/i)).toBeInTheDocument()
  })

  it('should call onOpenConfirmDialog when add button is clicked', () => {
    render(<NonPinnedWarning {...defaultProps} />)

    fireEvent.click(screen.getByTestId('add-to-pinned-list-button'))

    expect(defaultProps.onOpenConfirmDialog).toHaveBeenCalled()
  })

  it('should call onDismiss when dismiss button is clicked', () => {
    render(<NonPinnedWarning {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('dismiss'))

    expect(defaultProps.onDismiss).toHaveBeenCalled()
  })

  it('should show same message for all users', () => {
    render(<NonPinnedWarning {...defaultProps} />)

    expect(screen.getByText(/haven.t marked it as trusted yet/i)).toBeInTheDocument()
  })

  it('should show confirmation dialog when isConfirmDialogOpen is true', () => {
    render(<NonPinnedWarning {...defaultProps} isConfirmDialogOpen={true} />)

    expect(screen.getByTestId('add-trusted-safe-dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm trusted Safe')).toBeInTheDocument()
  })

  it('should show similar address warning in dialog when hasSimilarAddress is true', () => {
    const similarAddresses = [{ address: '0x1234567890123456789012345678901234567891', name: 'Similar Safe' }]
    render(
      <NonPinnedWarning
        {...defaultProps}
        isConfirmDialogOpen={true}
        hasSimilarAddress={true}
        similarAddresses={similarAddresses}
      />,
    )

    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
    expect(screen.getByText(/address poisoning attack/i)).toBeInTheDocument()
    expect(screen.getByText('I understand, add anyway')).toBeInTheDocument()
    expect(screen.getByText('Similar Safe in your account')).toBeInTheDocument()
  })

  it('should call onConfirmAdd when confirm button is clicked in dialog', async () => {
    render(<NonPinnedWarning {...defaultProps} isConfirmDialogOpen={true} />)

    const confirmButton = screen.getByTestId('confirm-add-trusted-safe-button')
    fireEvent.submit(confirmButton)

    await waitFor(() => {
      expect(defaultProps.onConfirmAdd).toHaveBeenCalled()
    })
  })

  it('should call onCloseConfirmDialog when cancel button is clicked in dialog', () => {
    render(<NonPinnedWarning {...defaultProps} isConfirmDialogOpen={true} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(defaultProps.onCloseConfirmDialog).toHaveBeenCalled()
  })
})
