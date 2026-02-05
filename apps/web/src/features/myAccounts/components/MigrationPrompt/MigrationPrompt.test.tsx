import { render, screen, fireEvent } from '@testing-library/react'
import MigrationPrompt from './index'

describe('MigrationPrompt', () => {
  const mockOnProceed = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the migration prompt', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    expect(screen.getByText(/Confirm your trusted Safes/i)).toBeInTheDocument()
    expect(screen.getByText(/Only trusted Safes will appear in your account list/i)).toBeInTheDocument()
  })

  it('should call onProceed when "Add" button is clicked', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    const selectButton = screen.getByRole('button', { name: /^Add$/i })
    fireEvent.click(selectButton)

    expect(mockOnProceed).toHaveBeenCalledTimes(1)
  })

  it('should render with testid', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    expect(screen.getByTestId('migration-prompt')).toBeInTheDocument()
  })
})
