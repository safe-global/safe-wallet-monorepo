import { waitFor, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { useRouter } from 'next/router'
import HypernativeOAuthCallback from '../../pages/hypernative/oauth-callback'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock @/features/__core__ to prevent circular dependency issues
jest.mock('@/features/__core__', () => ({
  createFeatureHandle: jest.fn((name) => ({ name, __type: 'FeatureHandle' })),
  useLoadFeature: jest.fn(() => ({
    $isReady: true,
    $isLoading: false,
    $isDisabled: false,
  })),
}))

// Mock PKCE utilities
jest.mock('@/features/hypernative', () => {
  const actual = jest.requireActual('@/features/hypernative')
  return {
    ...actual,
    readPkce: jest.fn(),
    clearPkce: jest.fn(),
  }
})

// Mock OAuth config
jest.mock('@/features/hypernative/config/oauth', () => {
  const actual = jest.requireActual('@/features/hypernative/config/oauth')
  return {
    ...actual,
    HYPERNATIVE_OAUTH_CONFIG: {
      authUrl: 'https://api.hypernative.xyz/oauth/authorize',
      clientId: 'TEST_CLIENT_ID',
      redirectUri: '',
    },
    getRedirectUri: jest.fn(),
  }
})

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  HYPERNATIVE_EVENTS: jest.requireActual('@/services/analytics').HYPERNATIVE_EVENTS,
}))

import { readPkce, clearPkce } from '@/features/hypernative'
import { getRedirectUri } from '@/features/hypernative/config/oauth'

describe('HypernativeOAuthCallback', () => {
  const mockRouterPush = jest.fn()
  const mockWindowClose = jest.fn()
  const mockReplaceState = jest.fn()
  const mockExchangeToken = jest.fn()

  // Get references to the mocked functions
  const mockReadPkce = readPkce as jest.MockedFunction<typeof readPkce>
  const mockClearPkce = clearPkce as jest.MockedFunction<typeof clearPkce>
  const mockGetRedirectUri = getRedirectUri as jest.MockedFunction<typeof getRedirectUri>

  beforeEach(() => {
    jest.clearAllMocks()
    mockReadPkce.mockReturnValue({})
    mockClearPkce.mockImplementation(() => {})
    mockGetRedirectUri.mockReturnValue('http://localhost:3000/hypernative/oauth-callback')

    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: false,
      query: {},
      push: mockRouterPush,
    })

    // Setup window.close mock
    window.close = mockWindowClose

    // Setup window.history mock
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: mockReplaceState,
      },
      writable: true,
      configurable: true,
    })

    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        pathname: '/hypernative/oauth-callback',
        hash: '',
      },
      writable: true,
      configurable: true,
    })

    // Set up default successful response
    mockExchangeToken.mockImplementation(() => ({
      unwrap: jest.fn().mockResolvedValue({
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    }))

    jest.spyOn(hypernativeApi, 'useExchangeTokenMutation').mockReturnValue([
      mockExchangeToken,
      {
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: undefined,
        data: undefined,
        reset: jest.fn(),
        originalArgs: undefined,
      },
    ] as ReturnType<typeof hypernativeApi.useExchangeTokenMutation>)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should show loading state initially', () => {
    render(<HypernativeOAuthCallback />)

    expect(screen.getByText('Authentication in progress')).toBeInTheDocument()
    expect(screen.getByText(/Hypernative authentication is in progress/i)).toBeInTheDocument()
    expect(screen.getByText(/close this window/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should not process callback until router is ready', () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: false,
      query: { code: 'test-code', state: 'test-state' },
    })

    render(<HypernativeOAuthCallback />)

    // Should still show loading, not try to process
    expect(screen.getByText('Authentication in progress')).toBeInTheDocument()
    expect(mockExchangeToken).not.toHaveBeenCalled()
  })

  it('should handle successful OAuth callback', async () => {
    // Setup query params and PKCE data BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'auth-code-123', state: 'state-456' },
    })

    mockReadPkce.mockReturnValue({
      state: 'state-456',
      codeVerifier: 'verifier-789',
    })

    render(<HypernativeOAuthCallback />)

    // Wait for token exchange
    await waitFor(
      () => {
        expect(mockExchangeToken).toHaveBeenCalled()
      },
      { timeout: 3000 },
    )

    // Wait for success state
    await waitFor(
      () => {
        expect(screen.getByText('Login successful')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    expect(screen.getByText(/signed in to Hypernative/i)).toBeInTheDocument()

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalledWith(
      {},
      document.title,
      expect.stringContaining('/hypernative/oauth-callback'),
    )

    // Check that PKCE data was cleaned up
    expect(mockClearPkce).toHaveBeenCalled()

    // Verify the mutation was called with correct parameters
    expect(mockExchangeToken).toHaveBeenCalledWith({
      grant_type: 'authorization_code',
      code: 'auth-code-123',
      redirect_uri: 'http://localhost:3000/hypernative/oauth-callback',
      client_id: 'TEST_CLIENT_ID',
      code_verifier: 'verifier-789',
    })

    // Verify getRedirectUri was called
    expect(mockGetRedirectUri).toHaveBeenCalled()

    // Verify analytics event was tracked
    expect(trackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_CONNECTED)
  })

  it('should handle missing authorization code', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { state: 'test-state' }, // Missing code
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      codeVerifier: 'verifier-123',
    })

    render(<HypernativeOAuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Missing authorization code in callback URL/)).toBeInTheDocument()
    })

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle missing state parameter', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code' }, // Missing state
    })

    mockReadPkce.mockReturnValue({})

    render(<HypernativeOAuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Missing state parameter in callback URL/)).toBeInTheDocument()
    })

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle invalid OAuth state (CSRF protection)', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'wrong-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'correct-state',
      codeVerifier: 'verifier-123',
    })

    render(<HypernativeOAuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Invalid OAuth state parameter - possible CSRF attack/)).toBeInTheDocument()
    })

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle missing PKCE verifier', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      // Missing codeVerifier
    })

    render(<HypernativeOAuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Missing PKCE code verifier - authentication flow corrupted/)).toBeInTheDocument()
    })

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle OAuth error in query params', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        error: 'access_denied',
        error_description: 'User denied authorization',
      },
    })

    mockReadPkce.mockReturnValue({})

    render(<HypernativeOAuthCallback />)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/OAuth authorization failed: User denied authorization/)).toBeInTheDocument()
    })

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle token exchange failure', async () => {
    // Setup query params and PKCE data BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      codeVerifier: 'verifier-123',
    })

    // Mock failed token exchange - RTK Query error format
    const mockError = {
      data: 'invalid_grant',
      status: 400,
    }
    mockExchangeToken.mockImplementation(() => ({
      unwrap: jest.fn().mockRejectedValue(mockError),
    }))

    render(<HypernativeOAuthCallback />)

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('invalid_grant')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Verify analytics event was NOT tracked on failure
    expect(trackEvent).not.toHaveBeenCalled()

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle invalid token response', async () => {
    // Setup query params and PKCE data BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      codeVerifier: 'verifier-123',
    })

    // Mock token response missing required fields
    // RTK Query transformResponse will extract data, but if data is invalid, it will still be returned
    // The component validates the response structure
    mockExchangeToken.mockImplementation(() => ({
      unwrap: jest.fn().mockResolvedValue({
        token_type: 'Bearer',
        // Missing access_token and expires_in
      }),
    }))

    render(<HypernativeOAuthCallback />)

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        // The error message will be from the component's validation
        expect(screen.getByText(/Invalid token response: missing access_token or expires_in/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up on error
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should handle window without opener', async () => {
    // Setup query params and PKCE data BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      codeVerifier: 'verifier-123',
    })

    // No window.opener - set this BEFORE rendering
    Object.defineProperty(window, 'opener', {
      value: null,
      writable: true,
      configurable: true,
    })

    // Setup RTK Query mock for successful token exchange
    mockExchangeToken.mockImplementation(() => ({
      unwrap: jest.fn().mockResolvedValue({
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    }))

    render(<HypernativeOAuthCallback />)

    await waitFor(
      () => {
        expect(screen.getByText('Login successful')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    expect(screen.getByText(/signed in to Hypernative/i)).toBeInTheDocument()

    // Check that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()

    // Check that PKCE was cleaned up
    expect(mockClearPkce).toHaveBeenCalled()
  })

  it('should prevent double processing with hasProcessedRef', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'test-state',
      codeVerifier: 'verifier-123',
    })

    render(<HypernativeOAuthCallback />)

    // Wait for first processing
    await waitFor(() => {
      expect(mockExchangeToken).toHaveBeenCalledTimes(1)
    })

    // Verify readPkce was called only once (not called again on potential re-render)
    const readPkceCallCount = mockReadPkce.mock.calls.length
    expect(readPkceCallCount).toBe(1)

    // The hasProcessedRef guard ensures that even if the component re-renders
    // or useEffect runs again, the callback won't process twice
  })

  it('should reset hasProcessedRef on error to allow retry', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'wrong-state' },
    })

    mockReadPkce.mockReturnValue({
      state: 'correct-state',
      codeVerifier: 'verifier-123',
    })

    render(<HypernativeOAuthCallback />)

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/Invalid OAuth state parameter/)).toBeInTheDocument()
    })

    // Verify that clearPkce was called on error (this happens in the catch block)
    // The hasProcessedRef flag is reset in the catch block, allowing retry
    expect(mockClearPkce).toHaveBeenCalled()
    // Verify that URL history was cleaned
    expect(mockReplaceState).toHaveBeenCalled()
  })
})
