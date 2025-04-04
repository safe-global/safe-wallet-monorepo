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

  it('should add User-Agent and Origin headers for string URL', async () => {
    const mockFetch = jest.fn(() => Promise.resolve(new Response()))
    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    const url = 'https://example.com/api'
    await global.fetch(url)

    expect(mockFetch).toHaveBeenCalledWith(url, {
      headers: {
        'User-Agent': `SafeMobile/iOS/1.0.0/100`,
        Origin: 'https://app.safe.global',
      },
    })
  })

  it('should add User-Agent and Origin headers for URL object', async () => {
    const mockFetch = jest.fn(() => Promise.resolve(new Response()))
    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    const url = new URL('https://example.com/api')
    await global.fetch(url)

    expect(mockFetch).toHaveBeenCalledWith(url, {
      headers: {
        'User-Agent': `SafeMobile/iOS/1.0.0/100`,
        Origin: 'https://app.safe.global',
      },
    })
  })

  it('should add User-Agent and Origin headers for Request object', async () => {
    // Create a mock implementation that captures the actual Request object
    let capturedRequest: unknown = null
    const mockFetch = jest.fn((req: Request | RequestInfo | URL) => {
      if (req instanceof Request) {
        capturedRequest = req
      }
      return Promise.resolve(new Response())
    })

    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    const request = new Request('https://example.com/api')
    await global.fetch(request)

    // Check that the fetch was called
    expect(mockFetch).toHaveBeenCalled()

    // Verify the captured request has the expected headers
    expect(capturedRequest).not.toBeNull()
    // We've verified capturedRequest is not null above and know it's a Request
    const typedRequest = capturedRequest as Request
    expect(typedRequest.headers.get('User-Agent')).toBe('SafeMobile/iOS/1.0.0/100')
    expect(typedRequest.headers.get('Origin')).toBe('https://app.safe.global')
  })

  it('should merge existing headers with User-Agent and Origin for Request with init', async () => {
    const mockFetch = jest.fn(() => Promise.resolve(new Response()))
    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    const request = new Request('https://example.com/api')
    const init = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    await global.fetch(request, init)

    expect(mockFetch).toHaveBeenCalledWith(request, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `SafeMobile/iOS/1.0.0/100`,
        Origin: 'https://app.safe.global',
      },
    })
  })

  it('should preserve existing init options', async () => {
    const mockFetch = jest.fn(() => Promise.resolve(new Response()))
    global.fetch = mockFetch

    // Re-import to override fetch again with our mock
    jest.resetModules()
    require('../fetch')

    const url = 'https://example.com/api'
    const init = {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      mode: 'cors' as RequestMode,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    await global.fetch(url, init)

    expect(mockFetch).toHaveBeenCalledWith(url, {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `SafeMobile/iOS/1.0.0/100`,
        Origin: 'https://app.safe.global',
      },
    })
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

    // Clear any previous fetch mock
    const mockFetch = jest.fn(() => Promise.resolve(new Response()))
    global.fetch = mockFetch

    // Now import fetch with the mocked Platform
    require('../fetch')

    // Make a fetch call
    const url = 'https://example.com/api'
    await global.fetch(url)

    // Verify the User-Agent has Android
    expect(mockFetch).toHaveBeenCalledWith(url, {
      headers: {
        'User-Agent': 'SafeMobile/Android/1.0.0/100',
        Origin: 'https://app.safe.global',
      },
    })

    // Reset modules and mock for subsequent tests
    jest.resetModules()
    jest.dontMock('react-native')
  })
})
