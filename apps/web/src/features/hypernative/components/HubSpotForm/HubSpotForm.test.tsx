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

    // Mock environment variable
    process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY = JSON.stringify({
      AMERICAS: 'https://calendly.com/americas',
      EMEA: 'https://calendly.com/emea',
      APAC: 'https://calendly.com/apac',
    })
  })

  afterEach(() => {
    // Clean up environment
    delete process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY
  })

  it('should render the form title and description', () => {
    render(<HubSpotForm {...defaultProps} />)

    expect(screen.getByText('Request demo')).toBeInTheDocument()
    expect(screen.getByText('Share your details to verify your request and book your demo call.')).toBeInTheDocument()
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

  it('should load Calendly CSS on mount', () => {
    render(<HubSpotForm {...defaultProps} />)

    const calendlyLink = document.querySelector('link[href*="calendly"]')
    expect(calendlyLink).toBeInTheDocument()
  })

  it('should load Calendly script on mount', () => {
    render(<HubSpotForm {...defaultProps} />)

    const calendlyScript = document.querySelector('script[src*="calendly"]')
    expect(calendlyScript).toBeInTheDocument()
  })
})
