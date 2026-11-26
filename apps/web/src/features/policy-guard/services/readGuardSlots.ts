import type { JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { logError } from '@/services/exceptions'
import { isRateLimitError } from '@/utils/transaction-errors'
import { GUARD_STORAGE_SLOT, MODULE_GUARD_STORAGE_SLOT } from '../public/constants'

export type GuardSlots = { txGuard: string; moduleGuard: string }

const toAddress = (slot: string): string => checksumAddress(`0x${slot.slice(2).padStart(64, '0').slice(-40)}`)

export const readGuardSlots = async (provider: JsonRpcProvider, safeAddress: string): Promise<GuardSlots> => {
  try {
    const [txGuard, moduleGuard] = await Promise.all([
      provider.getStorage(safeAddress, GUARD_STORAGE_SLOT),
      provider.getStorage(safeAddress, MODULE_GUARD_STORAGE_SLOT),
    ])
    return { txGuard: toAddress(txGuard), moduleGuard: toAddress(moduleGuard) }
  } catch (error) {
    if (!isRateLimitError(error)) logError(ErrorCodes._653, error, getRpcErrorContext(provider))
    throw error
  }
}
