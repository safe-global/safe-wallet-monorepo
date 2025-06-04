import { Wallet } from 'ethers'
import { SiweMessage } from 'siwe'
import { ERROR_MSG } from '@/src/store/constants'
import { authenticateSigner, clearAuthCache } from '../backend'

// Mock the store and SiweMessage
const mockStore = {
  dispatch: jest.fn(),
}

jest.mock('@/src/store', () => ({
  store: mockStore,
}))

jest.mock('@/src/store/utils/singletonStore', () => ({
  getStore: () => mockStore,
}))

jest.mock('siwe', () => {
  return {
    SiweMessage: jest.fn().mockImplementation(function (
      this: { prepareMessage: () => string },
      params: Record<string, unknown>,
    ) {
      this.prepareMessage = () => 'prepared-siwe-message'
      Object.assign(this, params)
    }),
  }
})

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
  },
}))

describe('authenticateSigner', () => {
  const mockSigner = {
    address: '0x1234567890123456789012345678901234567890',
    signMessage: jest.fn().mockResolvedValue('signed-message'),
  } as unknown as Wallet

  const mockChainId = '1'
  const mockNonce = 'test-nonce-123'

  beforeEach(() => {
    clearAuthCache()
    jest.clearAllMocks()

    // First dispatch (for nonce)
    const mockNonceUnwrap = jest.fn().mockResolvedValue({ nonce: mockNonce })
    const mockNonceDispatchReturn = { unwrap: mockNonceUnwrap }

    // Second dispatch (for verify)
    const mockVerifyUnwrap = jest.fn().mockResolvedValue({})
    const mockVerifyDispatchReturn = { unwrap: mockVerifyUnwrap }

    // Setup the dispatch mock to return different values on sequential calls
    mockStore.dispatch.mockReturnValueOnce(mockNonceDispatchReturn).mockReturnValueOnce(mockVerifyDispatchReturn)
  })

  it('should authenticate a signer', async () => {
    // Call the function
    await authenticateSigner(mockSigner, mockChainId)

    // Check the signature was requested with the prepared message
    expect(mockSigner.signMessage).toHaveBeenCalledWith('prepared-siwe-message')

    // Check that store.dispatch was called for verification
    expect(mockStore.dispatch).toHaveBeenCalledTimes(2)

    // Check that SiweMessage constructor was called with the correct parameters
    expect(SiweMessage).toHaveBeenCalledWith({
      address: mockSigner.address,
      chainId: Number(mockChainId),
      domain: 'global.safe.mobileapp',
      statement: 'Safe Wallet wants you to sign in with your Ethereum account',
      nonce: mockNonce,
      uri: 'https://safe.global',
      version: '1',
      issuedAt: expect.any(String),
    })
  })

  it('should return early if signer is null', async () => {
    await authenticateSigner(null, mockChainId)

    expect(mockStore.dispatch).not.toHaveBeenCalled()
    expect(mockSigner.signMessage).not.toHaveBeenCalled()
  })

  it('should use cached authentication if available', async () => {
    // First call to cache the auth
    await authenticateSigner(mockSigner, mockChainId)

    // Reset mocks
    jest.clearAllMocks()

    // Second call should use cache
    await authenticateSigner(mockSigner, mockChainId)

    // Check that dispatch was not called again
    expect(mockStore.dispatch).not.toHaveBeenCalled()
  })

  it('should throw an error if nonce is missing', async () => {
    mockStore.dispatch.mockReset()
    // override only the first queued return value
    const mockNonceUnwrap = jest.fn().mockResolvedValue({ nonce: null })
    const mockNonceDispatchReturn = { unwrap: mockNonceUnwrap }

    // replace the first of the two return-values
    mockStore.dispatch.mockReturnValueOnce(mockNonceDispatchReturn)

    // Check that it throws an error
    await expect(authenticateSigner(mockSigner, mockChainId)).rejects.toThrow(ERROR_MSG)
  })
})
