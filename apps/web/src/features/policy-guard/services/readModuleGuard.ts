import type { JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { logError } from '@/services/exceptions'
import { isRateLimitError } from '@/utils/transaction-errors'
import { MODULE_GUARD_STORAGE_SLOT } from '../constants'

export const readModuleGuard = async (provider: JsonRpcProvider, safeAddress: string): Promise<string> => {
  try {
    const slot = await provider.getStorage(safeAddress, MODULE_GUARD_STORAGE_SLOT)
    return checksumAddress(`0x${slot.slice(2).padStart(64, '0').slice(-40)}`)
  } catch (error) {
    if (!isRateLimitError(error)) logError(ErrorCodes._653, error, getRpcErrorContext(provider))
    throw error
  }
}
