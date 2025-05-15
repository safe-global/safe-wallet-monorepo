// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Platform } from 'react-native'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Application from 'expo-application'

// Mock the required dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '100',
}))

describe('fetch global override', () => {
  // Store the original fetch implementation
  const originalFetch = global.fetch

  // Restore original fetch after tests
  afterAll(() => {
    global.fetch = originalFetch
  })

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Reset the fetch override before each test by re-importing
    jest.resetModules()
    require('../fetch')
  })

  it('should add User-Agent and Origin headers for domain URL', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'https://example.com/api'
    await global.fetch(url)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBe('https://app.safe.global')
    }
  })

  it('should not add Origin header for localhost URL', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'http://localhost:8081/symbolicate'
    await global.fetch(url)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBeFalsy()
    }
  })

  it('should not add Origin header for IP address URL', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'http://192.168.0.252:8081/symbolicate'
    await global.fetch(url)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBeFalsy()
    }
  })

  it('should merge existing headers with User-Agent and Origin', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'https://example.com/api'
    const init = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    await global.fetch(url, init)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('Content-Type')).toBe('application/json')
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBe('https://app.safe.global')
    }
  })

  it('should preserve existing init options and not add Origin for IP URL', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'http://192.168.1.1:8081/api'
    const init = {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      mode: 'cors' as RequestMode,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    await global.fetch(url, init)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify request details
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.method).toBe('POST')
      expect(req.headers.get('Content-Type')).toBe('application/json')
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBeFalsy()
    }
  })

  it('should use Android in User-Agent when on Android', async () => {
    // Mock Platform.OS as Android before importing fetch
    jest.resetModules()

    // Mock the modules with Android OS
    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
      },
    }))

    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Now import fetch with the mocked Platform
    require('../fetch')

    // Make a fetch call
    const url = 'https://example.com/api'
    await global.fetch(url)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/Android/1.0.0/100')
      expect(req.headers.get('Origin')).toBe('https://app.safe.global')
    }

    // Reset modules and mock for subsequent tests
    jest.resetModules()
    jest.dontMock('react-native')
  })

  it('should correctly handle Headers instances in init', async () => {
    // Setup a mock implementation that captures the Request for inspection
    let capturedRequest: unknown = null

    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string') {
        capturedRequest = new Request(input, init)
      } else if (input instanceof URL) {
        capturedRequest = new Request(input.toString(), init)
      } else {
        capturedRequest = input
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    // Perform the fetch
    const url = 'https://example.com/api'
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')

    const init = { headers }

    await global.fetch(url, init)

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify headers
    expect(capturedRequest).not.toBeNull()
    if (capturedRequest) {
      const req = capturedRequest as Request
      expect(req.headers.get('Content-Type')).toBe('application/json')
      expect(req.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
      expect(req.headers.get('Origin')).toBe('https://app.safe.global')
    }
  })
})
