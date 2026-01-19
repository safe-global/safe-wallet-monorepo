import { render, screen } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import HnCalendlyStep from '../HnCalendlyStep'

// Mock the unified hook
jest.mock('../../../hooks/useCalendly', () => ({
  useCalendly: jest.fn(),
}))

import { useCalendly } from '../../../hooks/useCalendly'

const mockUseCalendly = useCalendly as jest.MockedFunction<typeof useCalendly>

describe('HnCalendlyStep', () => {
  const mockOnBookingScheduled = jest.fn()
  const calendlyUrl = 'https://calendly.com/test-americas'
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseCalendly.mockReturnValue({
      isLoaded: false,
      isSecondStep: false,
      hasScheduled: false,
      hasError: false,
      refresh: mockRefresh,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render the Calendly widget container', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    const widgetElement = document.getElementById('calendly-widget')
    expect(widgetElement).toBeInTheDocument()
  })

  it('should call useCalendly with correct parameters', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    expect(mockUseCalendly).toHaveBeenCalled()
    const callArgs = mockUseCalendly.mock.calls[0]
    expect(callArgs[1]).toBe(calendlyUrl)
    expect(callArgs[2]).toBe(mockOnBookingScheduled)
  })

  it('should call useCalendly with undefined callback if not provided', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} />)

    expect(mockUseCalendly).toHaveBeenCalled()
    const callArgs = mockUseCalendly.mock.calls[0]
    expect(callArgs[2]).toBeUndefined()
  })

  it('should render widget with correct styles', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    const widgetElement = document.getElementById('calendly-widget')
    expect(widgetElement).toBeInTheDocument()
  })

  describe('reload functionality', () => {
    it('should show error UI when hasError is true', () => {
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: true,
        refresh: mockRefresh,
      })

      render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Please reload the page.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
    })

    it('should call refresh when reload button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: true,
        refresh: mockRefresh,
      })

      render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      const reloadButton = screen.getByRole('button', { name: /reload/i })
      await user.click(reloadButton)

      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })

    it('should reset skeleton state when reload button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: true,
        refresh: mockRefresh,
      })

      const { rerender } = render(
        <HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />,
      )

      // Click reload button
      const reloadButton = screen.getByRole('button', { name: /reload/i })
      await user.click(reloadButton)

      // Verify refresh was called
      expect(mockRefresh).toHaveBeenCalledTimes(1)

      // Update mock to simulate error cleared after refresh
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
        refresh: mockRefresh,
      })

      // Re-render with new state
      rerender(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      // Widget should be visible now
      const widgetElement = document.getElementById('calendly-widget')
      expect(widgetElement).toBeInTheDocument()
      expect(widgetElement).toHaveStyle({ display: 'block' })
    })

    it('should hide skeleton after timeout when reload is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: true,
        refresh: mockRefresh,
      })

      const { rerender } = render(
        <HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />,
      )

      const reloadButton = screen.getByRole('button', { name: /reload/i })
      await user.click(reloadButton)

      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
        refresh: mockRefresh,
      })

      rerender(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      jest.advanceTimersByTime(1500)

      // Widget should still be visible
      const widgetElement = document.getElementById('calendly-widget')
      expect(widgetElement).toBeInTheDocument()
    })

    it('should show widget container when hasError is false', () => {
      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
        refresh: mockRefresh,
      })

      render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      const widgetElement = document.getElementById('calendly-widget')
      expect(widgetElement).toBeInTheDocument()
      // Widget should be visible
      expect(widgetElement).toHaveStyle({ display: 'block' })
    })

    it('should open correct calendlyUrl in new tab when open in new tab button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

      mockUseCalendly.mockReturnValue({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: true,
        refresh: mockRefresh,
      })

      render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

      const openInNewTabButton = screen.getByRole('button', { name: /open in a new tab/i })
      await user.click(openInNewTabButton)

      expect(windowOpenSpy).toHaveBeenCalledWith(calendlyUrl, '_blank', 'noopener,noreferrer')

      windowOpenSpy.mockRestore()
    })
  })
})
