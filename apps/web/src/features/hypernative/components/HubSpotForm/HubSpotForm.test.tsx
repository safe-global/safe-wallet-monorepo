import { render, screen } from '@/tests/test-utils'
import HubSpotForm from './HubSpotForm'

type HbsptMock = {
  forms: {
    create: jest.Mock
  }
}

describe('HubSpotForm', () => {
  const defaultProps = {
    portalId: 'test-portal-id',
    formId: 'test-form-id',
    region: 'eu1' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete (window as Window & { hbspt?: HbsptMock }).hbspt
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

  it('should set the conversion page url hidden field when form is ready', () => {
    const createMock = jest.fn()
    ;(window as Window & { hbspt?: HbsptMock }).hbspt = {
      forms: { create: createMock },
    }

    render(<HubSpotForm {...defaultProps} />)

    const script = document.querySelector('script[src*="hsforms"]') as HTMLScriptElement | null
    expect(script).toBeTruthy()

    script?.onload?.(new Event('load'))

    expect(createMock).toHaveBeenCalledTimes(1)
    const config = createMock.mock.calls[0]?.[0] as { onFormReady: (form: HTMLFormElement) => void }
    expect(config.onFormReady).toBeInstanceOf(Function)

    const form = document.createElement('form')
    const urlField = document.createElement('input')
    urlField.name = 'conversion_page_url'
    urlField.type = 'hidden'
    form.appendChild(urlField)

    config.onFormReady(form)

    expect(urlField.value).toBe(window.location.href)
  })
})
