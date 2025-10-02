import { resolveUnstoppableAddress } from '.'
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
        process.env = { ...originalEnv, NEXT_PUBLIC_UNSTOPPABLE_API_KEY: mockApiKey }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('resolveUnstoppableAddress', () => {
        it('should resolve UD names using the SDK', async () => {
            const mockGetAddress = jest.fn().mockResolvedValue('0x1111111111111111111111111111111111111111')
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('brad.crypto', { token: 'ETH', network: 'ETH' })

            expect(address).toBe('0x1111111111111111111111111111111111111111')
            expect(mockGetAddress).toHaveBeenCalledWith('brad.crypto', 'ETH', 'ETH')
        })

        it('should handle different currencies and networks', async () => {
            const mockGetAddress = jest.fn().mockResolvedValue('0x3333333333333333333333333333333333333333')
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('brad.crypto', { token: 'MATIC', network: 'MATIC' })

            expect(address).toBe('0x3333333333333333333333333333333333333333')
            expect(mockGetAddress).toHaveBeenCalledWith('brad.crypto', 'MATIC', 'MATIC')
        })

        it('should return undefined if domain not found', async () => {
            const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnregisteredDomain'))
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('nonexistent.crypto')

            expect(address).toBe(undefined)
            expect(logError).not.toHaveBeenCalled()
        })

        it('should return undefined if record not found', async () => {
            const mockGetAddress = jest.fn().mockRejectedValue(new Error('RecordNotFound'))
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('brad.crypto', { token: 'BTC' })

            expect(address).toBe(undefined)
            expect(logError).not.toHaveBeenCalled()
        })

        it('should return undefined for unsupported domains', async () => {
            const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnsupportedDomain'))
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('test.nonexistent')

            expect(address).toBe(undefined)
            expect(logError).not.toHaveBeenCalled()
        })

        it('should return undefined for unspecified resolver', async () => {
            const mockGetAddress = jest.fn().mockRejectedValue(new Error('UnspecifiedResolver'))
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('test.crypto')

            expect(address).toBe(undefined)
            expect(logError).not.toHaveBeenCalled()
        })

        it('should log error for unexpected SDK errors', async () => {
            const mockGetAddress = jest.fn().mockRejectedValue(new Error('Network error'))
                ; (Resolution as jest.MockedClass<typeof Resolution>).mockImplementation(() => ({
                    getAddress: mockGetAddress,
                }) as any)

            const address = await resolveUnstoppableAddress('brad.crypto')

            expect(address).toBe(undefined)
            expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'UD resolution error: Network error')
        })

        it('should return undefined if API key is not configured', async () => {
            process.env.NEXT_PUBLIC_UNSTOPPABLE_API_KEY = ''

            const address = await resolveUnstoppableAddress('brad.crypto')

            expect(address).toBe(undefined)
            expect(logError).toHaveBeenCalledWith(
                '101: Failed to resolve the address',
                'NEXT_PUBLIC_UNSTOPPABLE_API_KEY not configured for UD resolution',
            )
        })

        it('should initialize Resolution with API key', async () => {
            const mockGetAddress = jest.fn().mockResolvedValue('0x4444444444444444444444444444444444444444')
            const MockedResolution = Resolution as jest.MockedClass<typeof Resolution>
            MockedResolution.mockImplementation(() => ({
                getAddress: mockGetAddress,
            }) as any)

            await resolveUnstoppableAddress('brad.crypto')

            expect(MockedResolution).toHaveBeenCalledWith({
                apiKey: mockApiKey,
            })
        })
    })
})
