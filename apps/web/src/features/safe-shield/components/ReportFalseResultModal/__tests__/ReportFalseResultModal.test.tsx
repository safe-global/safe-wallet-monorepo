import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { ReportFalseResultModal } from '../ReportFalseResultModal'
import { faker } from '@faker-js/faker'

// Mock the useReportFalseResult hook
const mockReportFalseResult = jest.fn()
jest.mock('@/features/safe-shield/hooks/useReportFalseResult', () => ({
  useReportFalseResult: () => ({
    reportFalseResult: mockReportFalseResult,
    isLoading: false,
  }),
}))

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('ReportFalseResultModal', () => {
  const mockRequestId = faker.string.uuid()
  const mockOnClose = jest.fn()

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    requestId: mockRequestId,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the modal when open', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      expect(screen.getByText('Report incorrect result')).toBeInTheDocument()
      expect(screen.getByText(/Help us improve our security analysis/)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<ReportFalseResultModal {...defaultProps} open={false} />)

      expect(screen.queryByText('Report incorrect result')).not.toBeInTheDocument()
    })

    it('should render event type radio buttons', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      expect(screen.getByText('False positive')).toBeInTheDocument()
      expect(screen.getByText('False negative')).toBeInTheDocument()
      expect(screen.getByText('This transaction was incorrectly flagged as dangerous')).toBeInTheDocument()
      expect(screen.getByText("This transaction should have been flagged but wasn't")).toBeInTheDocument()
    })

    it('should render details text field', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      expect(screen.getByLabelText(/Details/)).toBeInTheDocument()
      expect(screen.getByText('0/1000 characters')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit report' })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when form is empty', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when only event type is selected', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const falsePositiveRadio = screen.getByRole('radio', { name: /False positive/i })
      fireEvent.click(falsePositiveRadio)

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when only details is filled', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: 'Test details' } })

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when form is valid', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const falsePositiveRadio = screen.getByRole('radio', { name: /False positive/i })
      fireEvent.click(falsePositiveRadio)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: 'Test details' } })

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call reportFalseResult with correct params on submit', async () => {
      mockReportFalseResult.mockResolvedValueOnce(true)

      render(<ReportFalseResultModal {...defaultProps} />)

      // Fill out the form
      const falsePositiveRadio = screen.getByRole('radio', { name: /False positive/i })
      fireEvent.click(falsePositiveRadio)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: 'Test details for submission' } })

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockReportFalseResult).toHaveBeenCalledWith({
          event: 'FALSE_POSITIVE',
          requestId: mockRequestId,
          details: 'Test details for submission',
        })
      })
    })

    it('should close modal on successful submission', async () => {
      mockReportFalseResult.mockResolvedValueOnce(true)

      render(<ReportFalseResultModal {...defaultProps} />)

      // Fill and submit
      fireEvent.click(screen.getByRole('radio', { name: /False negative/i }))
      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should not close modal on failed submission', async () => {
      mockReportFalseResult.mockResolvedValueOnce(false)

      render(<ReportFalseResultModal {...defaultProps} />)

      // Fill and submit
      fireEvent.click(screen.getByRole('radio', { name: /False positive/i }))
      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(mockReportFalseResult).toHaveBeenCalled()
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Cancel Button', () => {
    it('should call onClose when cancel is clicked', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Character Counter', () => {
    it('should update character count as user types', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: '12345' } })

      expect(screen.getByText('5/1000 characters')).toBeInTheDocument()
    })
  })
})
