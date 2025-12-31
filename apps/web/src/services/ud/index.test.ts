import { resolveUnstoppableAddress, reverseResolveUnstoppable, __resetResolutionForTesting } from '.'
import { logError } from '../exceptions'
import Resolution from '@unstoppabledomains/resolution'

// Mock Resolution SDK
jest.mock('@unstoppabledomains/resolution')

// Mock logError
jest.mock('../exceptions', () => ({
  logError: jest.fn(),
}))

describe('Unstoppable Domains', () => {
  const mockApiKey = 'test-api-key'
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    process.env = { ...originalEnv, NEXT_PUBLIC_UNSTOPPABLE_API_KEY: mockApiKey }

    // Reset the singleton instance
    __resetResolutionForTesting()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('resolveUnstoppableAddress', () => {
    it('should resolve UD names using the SDK', async () => {
      const mockGetAddress = jest.fn().mockResolvedValue('0x1111111111111111111111111111111111111111')
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('brad.crypto', { token: 'ETH', network: 'ETH' })

      expect(address).toBe('0x1111111111111111111111111111111111111111')
      expect(mockGetAddress).toHaveBeenCalledWith('brad.crypto', 'ETH', 'ETH')
    })

    it('should handle different currencies and networks', async () => {
      const mockGetAddress = jest.fn().mockResolvedValue('0x3333333333333333333333333333333333333333')
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('brad.crypto', { token: 'MATIC', network: 'MATIC' })

      expect(address).toBe('0x3333333333333333333333333333333333333333')
      expect(mockGetAddress).toHaveBeenCalledWith('brad.crypto', 'MATIC', 'MATIC')
    })

    it('should return undefined if domain not found', async () => {
      const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnregisteredDomain'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('nonexistent.crypto', { token: 'ETH', network: 'ETH' })

      expect(address).toBe(undefined)
      expect(mockGetAddress).toHaveBeenCalledWith('nonexistent.crypto', 'ETH', 'ETH')
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined if record not found', async () => {
      const mockGetAddress = jest.fn().mockRejectedValue(new Error('RecordNotFound'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('brad.crypto', { token: 'BTC', network: 'BTC' })

      expect(address).toBe(undefined)
      expect(mockGetAddress).toHaveBeenCalledWith('brad.crypto', 'BTC', 'BTC')
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined for unsupported domains', async () => {
      const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnsupportedDomain'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('test.nonexistent', { token: 'ETH', network: 'ETH' })

      expect(address).toBe(undefined)
      expect(mockGetAddress).toHaveBeenCalledWith('test.nonexistent', 'ETH', 'ETH')
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined for unspecified resolver', async () => {
      const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnspecifiedResolver'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('test.crypto', { token: 'ETH', network: 'ETH' })

      expect(address).toBe(undefined)
      expect(mockGetAddress).toHaveBeenCalledWith('test.crypto', 'ETH', 'ETH')
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined when token is not provided', async () => {
      const address = await resolveUnstoppableAddress('brad.crypto', { network: 'ETH' })

      expect(address).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined when network is not provided', async () => {
      const address = await resolveUnstoppableAddress('brad.crypto', { token: 'ETH' })

      expect(address).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined when no options are provided', async () => {
      const address = await resolveUnstoppableAddress('brad.crypto')

      expect(address).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should log error for unexpected SDK errors', async () => {
      const mockGetAddress = jest.fn().mockRejectedValue(new Error('Network error'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      const address = await resolveUnstoppableAddress('brad.crypto', { token: 'ETH', network: 'ETH' })

      expect(address).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'UD resolution error: Network error')
    })

    it('should return undefined if API key is not configured', async () => {
      process.env.NEXT_PUBLIC_UNSTOPPABLE_API_KEY = ''
      __resetResolutionForTesting() // Reset after changing env

      const address = await resolveUnstoppableAddress('brad.crypto')

      expect(address).toBe(undefined)
      expect(logError).toHaveBeenCalledWith(
        '101: Failed to resolve the address',
        'NEXT_PUBLIC_UNSTOPPABLE_API_KEY not configured for UD resolution',
      )
    })

    it('should only log initialization error once when called multiple times', async () => {
      process.env.NEXT_PUBLIC_UNSTOPPABLE_API_KEY = ''
      __resetResolutionForTesting() // Reset after changing env

      // Call multiple times
      await resolveUnstoppableAddress('test1.crypto', { token: 'ETH', network: 'ETH' })
      await resolveUnstoppableAddress('test2.crypto', { token: 'ETH', network: 'ETH' })
      await resolveUnstoppableAddress('test3.crypto', { token: 'ETH', network: 'ETH' })

      // Error should only be logged once, not three times
      expect(logError).toHaveBeenCalledTimes(1)
      expect(logError).toHaveBeenCalledWith(
        '101: Failed to resolve the address',
        'NEXT_PUBLIC_UNSTOPPABLE_API_KEY not configured for UD resolution',
      )
    })

    it('should initialize Resolution with API key', async () => {
      const mockGetAddress = jest.fn().mockResolvedValue('0x4444444444444444444444444444444444444444')
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
          }) as any,
      )

      await resolveUnstoppableAddress('brad.crypto')

      expect(MockedResolution).toHaveBeenCalledWith({
        apiKey: mockApiKey,
      })
    })
  })

  describe('reverseResolveUnstoppable', () => {
    it('should reverse resolve address to UD domain', async () => {
      const mockReverse = jest.fn().mockResolvedValue('brad.crypto')
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            reverse: mockReverse,
          }) as any,
      )

      const domain = await reverseResolveUnstoppable('0x1111111111111111111111111111111111111111')

      expect(domain).toBe('brad.crypto')
      expect(mockReverse).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111')
    })

    it('should return undefined if no reverse record found', async () => {
      const mockReverse = jest.fn().mockRejectedValue(new Error('ReverseResolutionNotSpecified'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            reverse: mockReverse,
          }) as any,
      )

      const domain = await reverseResolveUnstoppable('0x2222222222222222222222222222222222222222')

      expect(domain).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined if domain not registered', async () => {
      const mockReverse = jest.fn().mockRejectedValue(new Error('UnregisteredDomain'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            reverse: mockReverse,
          }) as any,
      )

      const domain = await reverseResolveUnstoppable('0x3333333333333333333333333333333333333333')

      expect(domain).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should log error for unexpected SDK errors', async () => {
      const mockReverse = jest.fn().mockRejectedValue(new Error('Network error'))
      const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
      MockedResolution.mockImplementation(
        () =>
          ({
            reverse: mockReverse,
          }) as any,
      )

      const domain = await reverseResolveUnstoppable('0x4444444444444444444444444444444444444444')

      expect(domain).toBe(undefined)
      expect(logError).toHaveBeenCalledWith(
        '101: Failed to resolve the address',
        'UD reverse resolution error: Network error',
      )
    })
  })
})
