import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { chainBuilder } from '@/tests/builders/chains'
import { logError } from '@/services/exceptions'
import { getReadOnlyProvider } from '../getReadOnlyProvider'

const mockLoadError = new Error('chunk failed')

jest.mock('@/hooks/wallets/sharedReadOnlyProvider', () => {
  throw mockLoadError
})
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({ getWeb3ReadOnly: () => undefined }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

describe('getReadOnlyProvider when the shared provider cannot be loaded', () => {
  it('logs and rethrows the load error', async () => {
    const sepolia = chainBuilder().with({ chainId: '11155111' }).build()
    await expect(getReadOnlyProvider(sepolia)).rejects.toBe(mockLoadError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._654, mockLoadError)
  })
})
