import { isClipboardSupported, isClipboardGranted, getClipboard } from '../clipboard'
import * as exceptions from '@/services/exceptions'

// Mock the logError function
jest.mock('@/services/exceptions', () => ({
  logError: jest.fn(),
  Errors: {
    _707: '_707',
    _708: '_708',
  },
}))

describe('clipboard utils', () => {
  const originalNavigator = global.navigator
  const mockLogError = exceptions.logError as jest.MockedFunction<typeof exceptions.logError>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  describe('isClipboardSupported', () => {
    it('should return true when user agent includes Firefox', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true,
        configurable: true,
      })

      expect(isClipboardSupported()).toBe(true)
    })

    it('should return false when user agent is Chrome', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
        configurable: true,
      })

      expect(isClipboardSupported()).toBe(false)
    })

    it('should return false when user agent is Safari', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
        writable: true,
        configurable: true,
      })

      expect(isClipboardSupported()).toBe(false)
    })

    it('should return false when user agent is Edge', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        writable: true,
        configurable: true,
      })

      expect(isClipboardSupported()).toBe(false)
    })

    it('should be case-sensitive for Firefox detection', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) firefox/91.0', // lowercase firefox
        writable: true,
        configurable: true,
      })

      expect(isClipboardSupported()).toBe(false)
    })
  })

  describe('isClipboardGranted', () => {
    it('should return false for Firefox', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 Firefox/91.0',
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(false)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should return true when permission is granted (Chrome/Safari)', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const mockQuery = jest.fn().mockResolvedValue({ state: 'granted' })
      Object.defineProperty(global.navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith({ name: 'clipboard-read' })
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should return false when permission is denied', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const mockQuery = jest.fn().mockResolvedValue({ state: 'denied' })
      Object.defineProperty(global.navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(false)
      expect(mockQuery).toHaveBeenCalledWith({ name: 'clipboard-read' })
    })

    it('should return false when permission is prompt', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const mockQuery = jest.fn().mockResolvedValue({ state: 'prompt' })
      Object.defineProperty(global.navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(false)
    })

    it('should handle error when permissions.query fails', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const error = new Error('Permission query failed')
      const mockQuery = jest.fn().mockRejectedValue(error)
      Object.defineProperty(global.navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(false)
      expect(mockLogError).toHaveBeenCalledWith(exceptions.Errors._707, error)
    })

    it('should handle error when permissions API is unavailable', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(global.navigator, 'permissions', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await isClipboardGranted()

      expect(result).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })
  })

  describe('getClipboard', () => {
    it('should return empty string for Firefox', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 Firefox/91.0',
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe('')
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should return clipboard text when available (Chrome/Safari)', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const clipboardText = '0x1234567890123456789012345678901234567890'
      const mockReadText = jest.fn().mockResolvedValue(clipboardText)
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe(clipboardText)
      expect(mockReadText).toHaveBeenCalled()
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should return empty string when readText returns empty', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const mockReadText = jest.fn().mockResolvedValue('')
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe('')
      expect(mockReadText).toHaveBeenCalled()
    })

    it('should handle multiline clipboard content', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const clipboardText = 'Line 1\nLine 2\nLine 3'
      const mockReadText = jest.fn().mockResolvedValue(clipboardText)
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe(clipboardText)
    })

    it('should handle error when readText fails', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const error = new Error('Clipboard read failed')
      const mockReadText = jest.fn().mockRejectedValue(error)
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe('')
      expect(mockLogError).toHaveBeenCalledWith(exceptions.Errors._708, error)
    })

    it('should handle error when clipboard API is unavailable', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(global.navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe('')
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should handle special characters in clipboard', async () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const clipboardText = '✓ Test ✗ Special © Characters ™'
      const mockReadText = jest.fn().mockResolvedValue(clipboardText)
      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBe(clipboardText)
    })
  })

  describe('integration tests', () => {
    it('should follow expected flow for non-Firefox browser with granted permission', async () => {
      // Setup Chrome with granted permissions
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Chrome/91.0',
        writable: true,
        configurable: true,
      })

      const mockQuery = jest.fn().mockResolvedValue({ state: 'granted' })
      const clipboardText = 'test clipboard content'
      const mockReadText = jest.fn().mockResolvedValue(clipboardText)

      Object.defineProperty(global.navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
        configurable: true,
      })

      Object.defineProperty(global.navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
        configurable: true,
      })

      // Check clipboard support (should be false for Chrome)
      expect(isClipboardSupported()).toBe(false)

      // Check if permission is granted
      const isGranted = await isClipboardGranted()
      expect(isGranted).toBe(true)

      // Read clipboard
      const content = await getClipboard()
      expect(content).toBe(clipboardText)
    })

    it('should follow expected flow for Firefox browser', async () => {
      // Setup Firefox
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 Firefox/91.0',
        writable: true,
        configurable: true,
      })

      // Check clipboard support (should be true for Firefox)
      expect(isClipboardSupported()).toBe(true)

      // Check if permission is granted (should be false for Firefox)
      const isGranted = await isClipboardGranted()
      expect(isGranted).toBe(false)

      // Try to read clipboard (should return empty for Firefox)
      const content = await getClipboard()
      expect(content).toBe('')
    })
  })
})
