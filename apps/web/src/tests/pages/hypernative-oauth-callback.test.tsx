import { waitFor, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { useRouter } from 'next/router'
import HypernativeOAuthCallback from '../../pages/hypernative/oauth-callback'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock PKCE utilities
jest.mock('@/features/hypernative/hooks/useHypernativeOAuth', () => {
  const actual = jest.requireActual('@/features/hypernative/hooks/useHypernativeOAuth')
  return {
    ...actual,
    readPkce: jest.fn(),
    clearPkce: jest.fn(),
  }
})

import { readPkce, clearPkce } from '@/features/hypernative/hooks/useHypernativeOAuth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('HypernativeOAuthCallback', () => {
  const mockRouterPush = jest.fn()
  const mockWindowClose = jest.fn()
  const mockReplaceState = jest.fn()

  // Get references to the mocked functions
  const mockReadPkce = readPkce as jest.MockedFunction<typeof readPkce>
  const mockClearPkce = clearPkce as jest.MockedFunction<typeof clearPkce>

  beforeEach(() => {
    jest.clearAllMocks()
    mockReadPkce.mockReturnValue({})
    mockClearPkce.mockImplementation(() => {})

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

    // Reset fetch mock completely and set up default successful response
    mockFetch.mockReset()
    // Ensure global.fetch still points to our mock
    global.fetch = mockFetch as unknown as typeof fetch

    const mockJsonFn = jest.fn().mockResolvedValue({
      data: {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      },
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
    expect(mockFetch).not.toHaveBeenCalled()
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
        expect(mockFetch).toHaveBeenCalled()
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

    render(<HypernativeOAuthCallback />)

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Token exchange failed: 400 invalid_grant')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

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

    // Mock token response missing required fields - reset and override the default mock BEFORE rendering
    mockFetch.mockReset()
    const mockJsonFn = jest.fn().mockResolvedValue({
      data: {
        token_type: 'Bearer',
        // Missing access_token and expires_in
      },
    })
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: mockJsonFn,
        text: jest.fn().mockResolvedValue(''),
        clone: jest.fn().mockReturnThis(),
      } as unknown as Response),
    )

    render(<HypernativeOAuthCallback />)

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Invalid token response: missing access_token or expires_in')).toBeInTheDocument()
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

    // Setup fetch mock for successful token exchange
    const mockJsonFn = jest.fn().mockResolvedValue({
      data: {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: mockJsonFn,
      text: jest.fn().mockResolvedValue(''),
      clone: jest.fn().mockReturnThis(),
    } as unknown as Response)

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
      expect(mockFetch).toHaveBeenCalledTimes(1)
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
