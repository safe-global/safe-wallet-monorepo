import { render } from '@/tests/test-utils'
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCalendly.mockReturnValue({
      isLoaded: false,
      isSecondStep: false,
      hasScheduled: false,
    })
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
})
