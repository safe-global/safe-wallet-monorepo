import type { JsonRpcProvider } from 'ethers'
import { MODULE_GUARD_STORAGE_SLOT } from '../../constants'
import { readModuleGuard } from '../readModuleGuard'

describe('readModuleGuard', () => {
  it('reads the module guard slot and returns the right-aligned address', async () => {
    const getStorage = jest.fn().mockResolvedValue(`0x${'0'.repeat(24)}1edd8486031b69205c0fd84924dfe171c6c6688e`)
    const provider = { getStorage } as unknown as JsonRpcProvider

    await expect(readModuleGuard(provider, '0xSafe')).resolves.toBe('0x1edd8486031b69205c0fd84924dfe171c6c6688e')
    expect(getStorage).toHaveBeenCalledWith('0xSafe', MODULE_GUARD_STORAGE_SLOT)
  })

  it('returns the zero address for an empty slot', async () => {
    const provider = { getStorage: jest.fn().mockResolvedValue(`0x${'0'.repeat(64)}`) } as unknown as JsonRpcProvider
    await expect(readModuleGuard(provider, '0xSafe')).resolves.toBe(`0x${'0'.repeat(40)}`)
  })
})
