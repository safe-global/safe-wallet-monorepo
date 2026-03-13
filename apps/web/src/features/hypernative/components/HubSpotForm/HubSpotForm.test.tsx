import { render, screen } from '@/tests/test-utils'
import HubSpotForm from './HubSpotForm'

describe('HubSpotForm', () => {
  const defaultProps = {
    portalId: 'test-portal-id',
    formId: 'test-form-id',
    region: 'eu1' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form title and description', () => {
    render(<HubSpotForm {...defaultProps} />)

    expect(screen.getByText('Request demo')).toBeInTheDocument()
    expect(screen.getByText('Share your details to book a demo call.')).toBeInTheDocument()
  })

  it('should render the HubSpot form container', () => {
    render(<HubSpotForm {...defaultProps} />)

    const formContainer = document.getElementById('hubspot-form-container')
    expect(formContainer).toBeInTheDocument()
  })

  it('should accept onSubmit callback prop', () => {
    const onSubmitMock = jest.fn()

    // Just verify the component renders with the prop - integration testing
    // the actual HubSpot form submission is beyond the scope of unit tests
    render(<HubSpotForm {...defaultProps} onSubmit={onSubmitMock} />)

    expect(screen.getByText('Request demo')).toBeInTheDocument()
  })

  it('should load HubSpot script on mount', () => {
    render(<HubSpotForm {...defaultProps} />)

    const scripts = document.querySelectorAll('script[src*="hsforms"]')
    expect(scripts.length).toBeGreaterThan(0)
  })
})
