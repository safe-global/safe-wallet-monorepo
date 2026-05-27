import { type JsonRpcProvider, isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  isGenericProxy,
  getGenericProxyMasterCopy,
  isGnosisProxy,
  getGnosisProxyMasterCopy,
} from '@/features/recovery/services'

export const GNOSIS_PAY_DELAY_MODIFIER_ADDRESS = '0x4a97e65188a950dd4b0f21f9b5434daee0bbf9f5'
export const GNOSIS_CHAIN_ID = '100'

/**
 * Walks the proxy bytecode chain for a module address and returns true if it
 * resolves to the canonical Gnosis Pay Delay master copy. Limited to chain 100.
 */
export async function isGnosisPayDelayModifier(
  chainId: string,
  moduleAddress: string,
  provider: JsonRpcProvider,
): Promise<boolean> {
  if (!isAddress(moduleAddress) || chainId !== GNOSIS_CHAIN_ID) return false

  if (sameAddress(GNOSIS_PAY_DELAY_MODIFIER_ADDRESS, moduleAddress)) {
    return true
  }

  const bytecode = await provider.getCode(moduleAddress)

  if (isGenericProxy(bytecode)) {
    const masterCopy = getGenericProxyMasterCopy(bytecode)
    return await isGnosisPayDelayModifier(chainId, masterCopy, provider)
  }

  if (isGnosisProxy(bytecode)) {
    const masterCopy = await getGnosisProxyMasterCopy(moduleAddress, provider)
    return await isGnosisPayDelayModifier(chainId, masterCopy, provider)
  }

  return false
}
