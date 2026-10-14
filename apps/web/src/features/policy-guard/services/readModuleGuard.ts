import type { JsonRpcProvider } from 'ethers'
import { MODULE_GUARD_STORAGE_SLOT } from '../constants'

export const readModuleGuard = async (provider: JsonRpcProvider, safeAddress: string): Promise<string> => {
  const slot = await provider.getStorage(safeAddress, MODULE_GUARD_STORAGE_SLOT)
  return `0x${slot.slice(-40)}`
}
