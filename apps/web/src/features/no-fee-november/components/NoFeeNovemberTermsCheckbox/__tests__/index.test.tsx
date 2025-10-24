import { render, screen, fireEvent } from '@/tests/test-utils'
import NoFeeNovemberTermsCheckbox from '@/features/no-fee-november/components/NoFeeNovemberTermsCheckbox'

describe('NoFeeNovemberTermsCheckbox', () => {
  const mockOnAcceptanceChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render checkbox and terms text', () => {
    render(<NoFeeNovemberTermsCheckbox onAcceptanceChange={mockOnAcceptanceChange} />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText(/I have read and accept the/)).toBeInTheDocument()
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument()
    expect(screen.getByText(/of the Safe Ecosystem Foundation No-Fee November sponsorship program/)).toBeInTheDocument()
  })

  it('should call onAcceptanceChange when checkbox is clicked', () => {
    render(<NoFeeNovemberTermsCheckbox onAcceptanceChange={mockOnAcceptanceChange} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockOnAcceptanceChange).toHaveBeenCalledWith(true)
  })

  it('should have correct link for Terms and Conditions', () => {
    render(<NoFeeNovemberTermsCheckbox onAcceptanceChange={mockOnAcceptanceChange} />)

    const termsLink = screen.getByText('Terms and Conditions')
    expect(termsLink.closest('a')).toHaveAttribute('href', 'https://help.safe.global/en/')
    expect(termsLink.closest('a')).toHaveAttribute('target', '_blank')
    expect(termsLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should toggle checkbox state correctly', () => {
    render(<NoFeeNovemberTermsCheckbox onAcceptanceChange={mockOnAcceptanceChange} />)

    const checkbox = screen.getByRole('checkbox')

    // Initially unchecked
    expect(checkbox).not.toBeChecked()

    // Click to check
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(mockOnAcceptanceChange).toHaveBeenCalledWith(true)

    // Click to uncheck
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(mockOnAcceptanceChange).toHaveBeenCalledWith(false)
  })
})
