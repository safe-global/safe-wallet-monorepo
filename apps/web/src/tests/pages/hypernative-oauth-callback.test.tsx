import { render, waitFor, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useRouter } from 'next/router'
import { configureStore } from '@reduxjs/toolkit'
import HypernativeOAuthCallback from '../../pages/hypernative/oauth-callback'
import { hnAuthSlice } from '@/features/hypernative/store/hnAuthSlice'
import { HN_AUTH_SUCCESS_EVENT, HN_AUTH_ERROR_EVENT } from '@/features/hypernative/hooks/useHypernativeOAuth'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('HypernativeOAuthCallback', () => {
  let store: ReturnType<typeof createTestStore>
  const mockRouterPush = jest.fn()
  const mockPostMessage = jest.fn()
  const mockWindowClose = jest.fn()

  // Mock sessionStorage
  const mockSessionStorage: Record<string, string> = {}
  const sessionStorageMock = {
    getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockSessionStorage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete mockSessionStorage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])
    }),
  }

  function createTestStore() {
    return configureStore({
      reducer: {
        [hnAuthSlice.name]: hnAuthSlice.reducer,
      },
    })
  }

  function createWrapper() {
    const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
    Wrapper.displayName = 'TestWrapper'
    return Wrapper
  }

  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
    sessionStorageMock.clear()

    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: false,
      query: {},
      push: mockRouterPush,
    })

    // Setup window.opener mock
    Object.defineProperty(window, 'opener', {
      value: {
        postMessage: mockPostMessage,
        closed: false,
      },
      writable: true,
      configurable: true,
    })

    // Setup window.close mock
    window.close = mockWindowClose

    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    })

    // Reset fetch mock completely and set up default successful response
    mockFetch.mockReset()
    // Ensure global.fetch still points to our mock
    global.fetch = mockFetch as unknown as typeof fetch

    const mockJsonFn = jest.fn().mockResolvedValue({
      access_token: 'test-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    })
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: mockJsonFn,
        text: jest.fn().mockResolvedValue(''),
        clone: jest.fn().mockReturnThis(),
      } as unknown as Response),
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should show loading state initially', () => {
    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    expect(screen.getByText('Authentication in progress...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should not process callback until router is ready', () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: false,
      query: { code: 'test-code', state: 'test-state' },
    })

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    // Should still show loading, not try to process
    expect(screen.getByText('Authentication in progress...')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle successful OAuth callback', async () => {
    // Setup query params and sessionStorage BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'auth-code-123', state: 'state-456' },
    })

    mockSessionStorage['hn_oauth_state'] = 'state-456'
    mockSessionStorage['hn_pkce_verifier'] = 'verifier-789'

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    // Wait for token exchange
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalled()
      },
      { timeout: 3000 },
    )

    // Wait for success state
    await waitFor(
      () => {
        expect(screen.getByText('Authentication successful!')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Check that postMessage was sent to parent
    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        type: HN_AUTH_SUCCESS_EVENT,
        token: 'test-access-token',
        expiresIn: 3600,
      },
      window.location.origin,
    )

    // Check that sessionStorage was cleaned up
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('hn_oauth_state')
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('hn_pkce_verifier')
  })

  it('should handle missing authorization code', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { state: 'test-state' }, // Missing code
    })

    mockSessionStorage['hn_oauth_state'] = 'test-state'

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Missing authorization code in callback URL/)).toBeInTheDocument()
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Missing authorization code in callback URL'),
      }),
      window.location.origin,
    )
  })

  it('should handle missing state parameter', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code' }, // Missing state
    })

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Missing state parameter in callback URL/)).toBeInTheDocument()
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Missing state parameter in callback URL'),
      }),
      window.location.origin,
    )
  })

  it('should handle invalid OAuth state (CSRF protection)', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'wrong-state' },
    })

    mockSessionStorage['hn_oauth_state'] = 'correct-state'

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Invalid OAuth state parameter - possible CSRF attack/)).toBeInTheDocument()
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Invalid OAuth state parameter - possible CSRF attack'),
      }),
      window.location.origin,
    )
  })

  it('should handle missing PKCE verifier', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockSessionStorage['hn_oauth_state'] = 'test-state'
    // Missing PKCE verifier

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Missing PKCE code verifier - authentication flow corrupted/)).toBeInTheDocument()
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Missing PKCE code verifier - authentication flow corrupted'),
      }),
      window.location.origin,
    )
  })

  it('should handle OAuth error in query params', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        error: 'access_denied',
        error_description: 'User denied authorization',
      },
    })

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/OAuth authorization failed: User denied authorization/)).toBeInTheDocument()
    })

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('OAuth authorization failed: User denied authorization'),
      }),
      window.location.origin,
    )
  })

  it('should handle token exchange failure', async () => {
    // Setup query params and sessionStorage BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockSessionStorage['hn_oauth_state'] = 'test-state'
    mockSessionStorage['hn_pkce_verifier'] = 'verifier-123'

    // Mock failed token exchange - reset and override the default mock BEFORE rendering
    mockFetch.mockReset()
    const mockTextFn = jest.fn().mockResolvedValue('invalid_grant')
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: mockTextFn,
        clone: jest.fn().mockReturnThis(),
      } as unknown as Response),
    )

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(
      () => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Token exchange failed: 400 invalid_grant')
      },
      { timeout: 3000 },
    )

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Token exchange failed: 400 invalid_grant'),
      }),
      window.location.origin,
    )
  })

  it('should handle invalid token response', async () => {
    // Setup query params and sessionStorage BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockSessionStorage['hn_oauth_state'] = 'test-state'
    mockSessionStorage['hn_pkce_verifier'] = 'verifier-123'

    // Mock token response missing required fields - reset and override the default mock BEFORE rendering
    mockFetch.mockReset()
    const mockJsonFn = jest.fn().mockResolvedValue({
      token_type: 'Bearer',
      // Missing access_token and expires_in
    })
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: mockJsonFn,
        text: jest.fn().mockResolvedValue(''),
        clone: jest.fn().mockReturnThis(),
      } as unknown as Response),
    )

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(
      () => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Invalid token response: missing access_token or expires_in')
      },
      { timeout: 3000 },
    )

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HN_AUTH_ERROR_EVENT,
        error: expect.stringContaining('Invalid token response: missing access_token or expires_in'),
      }),
      window.location.origin,
    )
  })

  it('should handle window without opener', async () => {
    // Setup query params and sessionStorage BEFORE rendering
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { code: 'test-code', state: 'test-state' },
    })

    mockSessionStorage['hn_oauth_state'] = 'test-state'
    mockSessionStorage['hn_pkce_verifier'] = 'verifier-123'

    // No window.opener - set this BEFORE rendering
    Object.defineProperty(window, 'opener', {
      value: null,
      writable: true,
      configurable: true,
    })

    // Setup fetch mock for successful token exchange
    const mockJsonFn = jest.fn().mockResolvedValue({
      access_token: 'test-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: mockJsonFn,
      text: jest.fn().mockResolvedValue(''),
      clone: jest.fn().mockReturnThis(),
    } as unknown as Response)

    render(<HypernativeOAuthCallback />, { wrapper: createWrapper() })

    await waitFor(
      () => {
        expect(screen.getByText('Authentication successful!')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // postMessage should not have been called since there's no opener
    expect(mockPostMessage).not.toHaveBeenCalled()
  })
})
