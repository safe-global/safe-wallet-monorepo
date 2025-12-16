import { render } from '@/tests/test-utils'
import HnCalendlyStep from '../HnCalendlyStep'

// Mock the hooks
jest.mock('../../../hooks/useCalendlyEventScheduled', () => ({
  useCalendlyEventScheduled: jest.fn(),
}))

jest.mock('../../../hooks/useCalendlyScript', () => ({
  useCalendlyScript: jest.fn(),
}))

import { useCalendlyEventScheduled } from '../../../hooks/useCalendlyEventScheduled'

const mockUseCalendlyEventScheduled = useCalendlyEventScheduled as jest.MockedFunction<typeof useCalendlyEventScheduled>

describe('HnCalendlyStep', () => {
  const mockOnBookingScheduled = jest.fn()
  const calendlyUrl = 'https://calendly.com/test-americas'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCalendlyEventScheduled.mockImplementation(() => {})
  })

  it('should render the Calendly widget container', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    const widgetElement = document.getElementById('calendly-widget')
    expect(widgetElement).toBeInTheDocument()
  })

  it('should call useCalendlyEventScheduled with onBookingScheduled callback', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    expect(mockUseCalendlyEventScheduled).toHaveBeenCalledWith(mockOnBookingScheduled)
  })

  it('should call useCalendlyEventScheduled with undefined if callback is not provided', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} />)

    expect(mockUseCalendlyEventScheduled).toHaveBeenCalledWith(undefined)
  })

  it('should render widget with correct styles', () => {
    render(<HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={mockOnBookingScheduled} />)

    const widgetElement = document.getElementById('calendly-widget')
    expect(widgetElement).toBeInTheDocument()
    expect(widgetElement).toHaveStyle({ minWidth: '320px', height: '700px' })
  })
})
