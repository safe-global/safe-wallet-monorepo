import type { JsonRpcProvider } from 'ethers'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { GUARD_STORAGE_SLOT, MODULE_GUARD_STORAGE_SLOT } from '../../public/constants'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { readGuardSlots } from '../readGuardSlots'

jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const SAFE = checksumAddress(faker.finance.ethereumAddress())
const slotOf = (address: string) => `0x${'0'.repeat(24)}${address.slice(2).toLowerCase()}`

const providerWithSlots = (slots: Record<string, string>) =>
  ({
    getStorage: jest.fn((_: string, slot: string) => Promise.resolve(slots[slot])),
  }) as unknown as JsonRpcProvider

describe('readGuardSlots', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should, when both slots are set, return each guard checksummed', async () => {
    const txGuard = checksumAddress(faker.finance.ethereumAddress())
    const moduleGuard = checksumAddress(faker.finance.ethereumAddress())
    const provider = providerWithSlots({
      [GUARD_STORAGE_SLOT]: slotOf(txGuard),
      [MODULE_GUARD_STORAGE_SLOT]: slotOf(moduleGuard),
    })

    await expect(readGuardSlots(provider, SAFE)).resolves.toEqual({ txGuard, moduleGuard })
    expect(provider.getStorage).toHaveBeenCalledWith(SAFE, GUARD_STORAGE_SLOT)
    expect(provider.getStorage).toHaveBeenCalledWith(SAFE, MODULE_GUARD_STORAGE_SLOT)
  })

  it('should, when a slot is empty or a short zero, return the zero address for it', async () => {
    const provider = providerWithSlots({
      [GUARD_STORAGE_SLOT]: `0x${'0'.repeat(64)}`,
      [MODULE_GUARD_STORAGE_SLOT]: '0x0',
    })

    await expect(readGuardSlots(provider, SAFE)).resolves.toEqual({ txGuard: ZERO_ADDRESS, moduleGuard: ZERO_ADDRESS })
  })

  it('should, when a read fails, log and rethrow the error', async () => {
    const rpcError = new Error('rpc down')
    const provider = { getStorage: jest.fn().mockRejectedValue(rpcError) } as unknown as JsonRpcProvider

    await expect(readGuardSlots(provider, SAFE)).rejects.toBe(rpcError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._653, rpcError, getRpcErrorContext(provider))
  })

  it('should, when the RPC rate-limits, rethrow without logging a fault', async () => {
    const rateLimit = Object.assign(new Error('Too Many Requests'), {
      code: 'SERVER_ERROR',
      response: { statusCode: 429 },
    })
    const provider = { getStorage: jest.fn().mockRejectedValue(rateLimit) } as unknown as JsonRpcProvider

    await expect(readGuardSlots(provider, SAFE)).rejects.toBe(rateLimit)
    expect(logError).not.toHaveBeenCalled()
  })
})
