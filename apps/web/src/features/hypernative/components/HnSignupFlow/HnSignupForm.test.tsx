import { render, screen } from '@/tests/test-utils'
import HnSignupForm from './HnSignupForm'
import * as HubSpotFormModule from '@/features/hypernative/components/HubSpotForm/HubSpotForm'

jest.mock('@/features/hypernative/components/HubSpotForm/HubSpotForm', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="hubspot-form-mock">HubSpot Form</div>),
}))

describe('HnSignupForm', () => {
  const defaultProps = {
    portalId: 'test-portal-id',
    formId: 'test-form-id',
    region: 'eu1' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the HubSpotForm component with correct props', () => {
    render(<HnSignupForm {...defaultProps} />)

    expect(screen.getByTestId('hubspot-form-mock')).toBeInTheDocument()
    expect(HubSpotFormModule.default).toHaveBeenCalledWith(
      expect.objectContaining({
        portalId: 'test-portal-id',
        formId: 'test-form-id',
        region: 'eu1',
        onSubmit: undefined,
      }),
      undefined,
    )
  })

  it('should pass onSubmit callback to HubSpotForm', () => {
    const onSubmitMock = jest.fn()

    render(<HnSignupForm {...defaultProps} onSubmit={onSubmitMock} />)

    expect(HubSpotFormModule.default).toHaveBeenCalledWith(
      expect.objectContaining({
        onSubmit: onSubmitMock,
      }),
      undefined,
    )
  })

  it('should render Cancel button when onCancel is provided', () => {
    const onCancelMock = jest.fn()

    render(<HnSignupForm {...defaultProps} onCancel={onCancelMock} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('should not render Cancel button when onCancel is not provided', () => {
    render(<HnSignupForm {...defaultProps} />)

    const cancelButton = screen.queryByRole('button', { name: /cancel/i })
    expect(cancelButton).not.toBeInTheDocument()
  })

  it('should call onCancel when Cancel button is clicked', () => {
    const onCancelMock = jest.fn()

    render(<HnSignupForm {...defaultProps} onCancel={onCancelMock} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    cancelButton.click()

    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })

  it('should use default region when not provided', () => {
    const { portalId, formId } = defaultProps

    render(<HnSignupForm portalId={portalId} formId={formId} />)

    expect(HubSpotFormModule.default).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'eu1',
      }),
      undefined,
    )
  })

  it('should render background column', () => {
    const { container } = render(<HnSignupForm {...defaultProps} />)

    // Check for the background column by checking for the grid structure
    const gridItems = container.querySelectorAll('[class*="Grid2"]')
    expect(gridItems.length).toBeGreaterThan(1)
  })
})
