import { AbiCoder, type JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { readGuardDelay } from '../readGuardDelay'

jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const GUARD = '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'
const DELAY_SELECTOR = '0x69b41170'

describe('readGuardDelay', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return the delay in seconds, when the guard answers DELAY()', async () => {
    const call = jest.fn().mockResolvedValue(AbiCoder.defaultAbiCoder().encode(['uint256'], [180]))
    const provider = { call } as unknown as JsonRpcProvider

    await expect(readGuardDelay(provider, GUARD)).resolves.toBe(180)
    expect(call).toHaveBeenCalledWith({ to: GUARD, data: DELAY_SELECTOR })
  })

  it('should log and rethrow, when the read fails', async () => {
    const rpcError = new Error('rpc down')
    const provider = { call: jest.fn().mockRejectedValue(rpcError) } as unknown as JsonRpcProvider

    await expect(readGuardDelay(provider, GUARD)).rejects.toBe(rpcError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._657, rpcError, getRpcErrorContext(provider))
  })

  it('should rethrow without logging, when the RPC rate-limits the read', async () => {
    const rateLimit = Object.assign(new Error('Too Many Requests'), {
      code: 'SERVER_ERROR',
      response: { statusCode: 429 },
    })
    const provider = { call: jest.fn().mockRejectedValue(rateLimit) } as unknown as JsonRpcProvider

    await expect(readGuardDelay(provider, GUARD)).rejects.toBe(rateLimit)
    expect(logError).not.toHaveBeenCalled()
  })
})
