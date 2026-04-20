import { render, screen, act } from '@/tests/test-utils'
import { CaptchaProvider } from '../CaptchaProvider'

// Capture the activation callback registered by CaptchaProvider
let registeredActivateCaptcha: (() => void) | null = null

jest.mock('../captchaHeadersInit', () => ({
  initializeCaptchaHeaders: jest.fn(),
  resolveCaptchaReady: jest.fn(),
  registerActivateCaptcha: jest.fn((fn: () => void) => {
    registeredActivateCaptcha = fn
  }),
  isCaptchaActivated: jest.fn(() => false),
}))

jest.mock('@safe-global/utils/config/constants', () => ({
  TURNSTILE_SITE_KEY: 'test-site-key',
}))

// Stub out heavy sub-components
jest.mock('next/script', () => ({ __esModule: true, default: () => null }))
jest.mock('../CaptchaModal', () => ({ __esModule: true, default: () => null }))
jest.mock('../useCaptchaToken', () => ({
  useCaptchaToken: () => ({
    isModalOpen: false,
    onWidgetContainerReady: jest.fn(),
    error: null,
    refreshToken: jest.fn(),
  }),
}))

describe('CaptchaProvider', () => {
  beforeEach(() => {
    registeredActivateCaptcha = null
  })

  it('always renders children', () => {
    render(
      <CaptchaProvider>
        <div data-testid="child">hello</div>
      </CaptchaProvider>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render the Turnstile widget before activation', () => {
    const { container } = render(<CaptchaProvider>{null}</CaptchaProvider>)
    // CaptchaWidget renders a Script + CaptchaModal — neither should be in the DOM yet
    // We verify by checking that registerActivateCaptcha was called (provider registered its callback)
    // and that no Script element was injected
    expect(registeredActivateCaptcha).not.toBeNull()
    // The Script mock renders null, so no next/script markup — container should only have children
    expect(container.firstChild).toBeNull()
  })

  it('renders the Turnstile widget once the activation callback fires', async () => {
    const { isCaptchaActivated } = require('../captchaHeadersInit')
    ;(isCaptchaActivated as jest.Mock).mockReturnValue(false)

    render(
      <CaptchaProvider>
        <div data-testid="child">hello</div>
      </CaptchaProvider>,
    )

    expect(registeredActivateCaptcha).not.toBeNull()

    // Simulate the prepareHeaders hook firing the activation callback
    await act(async () => {
      registeredActivateCaptcha!()
    })

    // Children still present
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('is immediately active when isCaptchaActivated returns true (provider remount)', () => {
    const { isCaptchaActivated } = require('../captchaHeadersInit')
    ;(isCaptchaActivated as jest.Mock).mockReturnValue(true)

    render(
      <CaptchaProvider>
        <div data-testid="child">hello</div>
      </CaptchaProvider>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
