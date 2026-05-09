import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { ReportFalseResultModal } from '../ReportFalseResultModal'
import { faker } from '@faker-js/faker'
import { trackEvent } from '@/services/analytics'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'

const mockReportFalseResult = jest.fn()
jest.mock('@/features/safe-shield/hooks/useReportFalseResult', () => ({
  useReportFalseResult: () => ({
    reportFalseResult: mockReportFalseResult,
    isLoading: false,
  }),
}))

jest.mock('@/services/analytics', () =>
  (
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
)

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

      expect(screen.getByText('Report false result')).toBeInTheDocument()
      expect(screen.getByText(/Help us improve our security analysis/)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<ReportFalseResultModal {...defaultProps} open={false} />)

      expect(screen.queryByText('Report false result')).not.toBeInTheDocument()
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
    it('should disable submit button when details is empty', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when details is filled', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: 'Test details' } })

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call reportFalseResult with correct data on submit', async () => {
      mockReportFalseResult.mockResolvedValueOnce(true)

      render(<ReportFalseResultModal {...defaultProps} />)

      const detailsInput = screen.getByLabelText(/Details/)
      fireEvent.change(detailsInput, { target: { value: 'Test details for submission' } })

      const submitButton = screen.getByRole('button', { name: 'Submit report' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockReportFalseResult).toHaveBeenCalledWith({
          request_id: mockRequestId,
          details: 'Test details for submission',
        })
      })
    })

    it('should close modal on successful submission', async () => {
      mockReportFalseResult.mockResolvedValueOnce(true)

      render(<ReportFalseResultModal {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should not close modal on failed submission', async () => {
      mockReportFalseResult.mockResolvedValueOnce(false)

      render(<ReportFalseResultModal {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(mockReportFalseResult).toHaveBeenCalled()
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Analytics Tracking', () => {
    it('should track REPORT_SUBMITTED when submit is clicked regardless of API success', async () => {
      mockReportFalseResult.mockResolvedValueOnce(true)

      render(<ReportFalseResultModal {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith(SAFE_SHIELD_EVENTS.REPORT_SUBMITTED)
      })
    })

    it('should track REPORT_SUBMITTED even when API fails', async () => {
      mockReportFalseResult.mockResolvedValueOnce(false)

      render(<ReportFalseResultModal {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Details/), { target: { value: 'Details' } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith(SAFE_SHIELD_EVENTS.REPORT_SUBMITTED)
      })
    })

    it('should not track REPORT_SUBMITTED when form is invalid', () => {
      render(<ReportFalseResultModal {...defaultProps} />)

      // Details is empty, so form is invalid and button is disabled
      // Clicking disabled button should not trigger tracking
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))

      expect(trackEvent).not.toHaveBeenCalledWith(SAFE_SHIELD_EVENTS.REPORT_SUBMITTED)
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
