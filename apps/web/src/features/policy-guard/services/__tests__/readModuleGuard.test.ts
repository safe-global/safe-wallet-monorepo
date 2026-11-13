import type { JsonRpcProvider } from 'ethers'
import { MODULE_GUARD_STORAGE_SLOT } from '../../constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { readModuleGuard } from '../readModuleGuard'

jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

describe('readModuleGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('reads the module guard slot and returns the checksummed right-aligned address', async () => {
    const getStorage = jest.fn().mockResolvedValue(`0x${'0'.repeat(24)}1edd8486031b69205c0fd84924dfe171c6c6688e`)
    const provider = { getStorage } as unknown as JsonRpcProvider

    await expect(readModuleGuard(provider, '0xSafe')).resolves.toBe('0x1Edd8486031b69205C0fD84924DFe171C6c6688E')
    expect(getStorage).toHaveBeenCalledWith('0xSafe', MODULE_GUARD_STORAGE_SLOT)
  })

  it('returns the zero address for an empty slot', async () => {
    const provider = { getStorage: jest.fn().mockResolvedValue(`0x${'0'.repeat(64)}`) } as unknown as JsonRpcProvider
    await expect(readModuleGuard(provider, '0xSafe')).resolves.toBe(`0x${'0'.repeat(40)}`)
  })

  it('returns the zero address for a short empty response', async () => {
    const provider = { getStorage: jest.fn().mockResolvedValue('0x0') } as unknown as JsonRpcProvider
    await expect(readModuleGuard(provider, '0xSafe')).resolves.toBe(`0x${'0'.repeat(40)}`)
  })

  it('logs and rethrows a failed read', async () => {
    const rpcError = new Error('rpc down')
    const provider = { getStorage: jest.fn().mockRejectedValue(rpcError) } as unknown as JsonRpcProvider
    await expect(readModuleGuard(provider, '0xSafe')).rejects.toBe(rpcError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._653, rpcError, getRpcErrorContext(provider))
  })

  it('rethrows a rate limit without logging it as a fault', async () => {
    const rateLimit = Object.assign(new Error('Too Many Requests'), {
      code: 'SERVER_ERROR',
      response: { statusCode: 429 },
    })
    const provider = { getStorage: jest.fn().mockRejectedValue(rateLimit) } as unknown as JsonRpcProvider
    await expect(readModuleGuard(provider, '0xSafe')).rejects.toBe(rateLimit)
    expect(logError).not.toHaveBeenCalled()
  })
})
