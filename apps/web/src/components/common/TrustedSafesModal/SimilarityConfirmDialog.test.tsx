import { faker } from '@faker-js/faker'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { Dialog, DialogContent } from '@safe-global/views/components/ui/dialog'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import type { SelectableSafe } from './useTrustedSafesModal.types'

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
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
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

  it('shows the address without a chain prefix', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ shortName: 'eth' }).build())

    render(<SimilarityConfirmDialog {...defaultProps} />)

    expect(screen.queryAllByText('eth:')).toHaveLength(0)
  })

  it('bolds the first and last four hex characters of the address', () => {
    render(<SimilarityConfirmDialog {...defaultProps} />)

    const bold = Array.from(screen.getByRole('dialog').querySelectorAll('b')).map((b) => b.textContent)
    expect(bold).toEqual([mockSafe.address.slice(2, 6), mockSafe.address.slice(-4)])
  })

  it('shows a backdrop when opened from inside another dialog', () => {
    render(
      <Dialog open>
        <DialogContent>
          <SimilarityConfirmDialog {...defaultProps} />
        </DialogContent>
      </Dialog>,
    )

    expect(document.querySelectorAll('[data-slot="dialog-overlay"]')).toHaveLength(2)
  })

  it('uses the given description, address label and hint', () => {
    const copy = {
      description: faker.lorem.sentence(),
      addressLabel: faker.lorem.words(2),
      hint: faker.lorem.sentence(),
    }

    render(<SimilarityConfirmDialog {...defaultProps} {...copy} />)

    expect(screen.getByText(copy.description)).toBeInTheDocument()
    expect(screen.getByText(copy.addressLabel)).toBeInTheDocument()
    expect(screen.getByText(copy.hint)).toBeInTheDocument()
    expect(screen.queryByText('Selected safe')).not.toBeInTheDocument()
  })

  it('routes the caller stacking classes to the popup and the backdrop', () => {
    render(<SimilarityConfirmDialog {...defaultProps} className="popup-marker" overlayClassName="overlay-marker" />)

    const overlays = Array.from(document.querySelectorAll('[data-slot="dialog-overlay"]'))
    expect(screen.getByRole('dialog')).toHaveClass('popup-marker')
    expect(overlays.some((overlay) => overlay.classList.contains('overlay-marker'))).toBe(true)
  })
})
