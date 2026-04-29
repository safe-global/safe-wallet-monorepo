import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SignInButton from './index'

const mockSignIn = jest.fn()
const mockDispatch = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  OVERVIEW_EVENTS: { OPEN_ONBOARD: {} },
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    SIGN_IN_BUTTON: { action: 'Open sign in message', category: 'spaces' },
    AUTH_LOGIN_SUCCEEDED: { action: 'Auth (SIWE / Email) success', category: 'spaces' },
    AUTH_LOGIN_FAILED: { action: 'Auth (SIWE / Email) failure', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: mockSignIn, loading: false }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (value: number) => ({ type: 'auth/setAuthenticated', payload: value }),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/services/exceptions', () => ({
  logError: jest.fn(),
}))

jest.mock('@safe-global/utils/services/exceptions/ErrorCodes', () => ({
  default: { _640: '_640' },
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/components/welcome/WelcomeLogin/WalletLogin', () => ({
  __esModule: true,
  default: ({ onContinue }: { onContinue: () => void }) => <button onClick={onContinue}>Sign in</button>,
}))

describe('SignInButton tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks AUTH_LOGIN_SUCCEEDED with spaceId and method sent to both GA (label) and Mixpanel (additionalParameters)', async () => {
    mockSignIn.mockResolvedValue({ token: 'abc' })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED, label: '42' },
        { spaceId: '42', method: 'siwe' },
      )
    })
  })

  it('tracks AUTH_LOGIN_FAILED with failure_reason on sign in error', async () => {
    const error = new Error('User rejected')
    mockSignIn.mockRejectedValue(error)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
        'Failure Reason': 'User rejected',
        method: 'siwe',
      })
    })
  })

  it('tracks AUTH_LOGIN_FAILED when signIn returns an error object', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Signature failed') })

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
        'Failure Reason': 'Signature failed',
        method: 'siwe',
      })
    })
  })

  it('does not track AUTH_LOGIN_SUCCEEDED when signIn returns null', async () => {
    mockSignIn.mockResolvedValue(null)

    render(<SignInButton redirectLoading={false} afterSignIn={jest.fn()} />)
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED.action }),
        expect.anything(),
      )
    })
  })
})
