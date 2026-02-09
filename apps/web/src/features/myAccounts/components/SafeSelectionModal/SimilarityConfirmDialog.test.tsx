import { render, screen, fireEvent } from '@/tests/test-utils'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import type { SelectableSafe } from '../../hooks/useSafeSelectionModal.types'

const mockSafe: SelectableSafe = {
  chainId: '1',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Test Safe',
  isPinned: false,
  isReadOnly: false,
  lastVisited: 0,
  isSelected: false,
  similarityGroup: '123456_5678',
}

describe('SimilarityConfirmDialog', () => {
  const defaultProps = {
    open: true,
    safe: mockSafe,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog when open', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
  })

  it('should show warning message', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    expect(screen.getByText(/similar to another safe/i)).toBeInTheDocument()
  })

  it('should display the safe address', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Selected safe')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByText(/I understand, continue anyway/i))

    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(<SimilarityConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Similar address detected')).not.toBeInTheDocument()
  })
})
