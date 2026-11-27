import { type JsonRpcProvider, isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  isGenericProxy,
  getGenericProxyMasterCopy,
  isGnosisProxy,
  getGnosisProxyMasterCopy,
} from '@/services/delay/proxies'

export const GNOSIS_PAY_DELAY_MODIFIER_ADDRESS = '0x4a97e65188a950dd4b0f21f9b5434daee0bbf9f5'

/**
 * Walks the proxy bytecode chain for a module address and returns true if it
 * resolves to the canonical Gnosis Pay Delay master copy. Feature availability is controlled by chain config.
 */
export async function isGnosisPayDelayModifier(
  moduleAddress: string,
  provider: JsonRpcProvider,
  visited = new Set<string>(),
): Promise<boolean> {
  if (!isAddress(moduleAddress) || visited.has(moduleAddress.toLowerCase()) || visited.size >= 16) return false
  visited.add(moduleAddress.toLowerCase())

  if (sameAddress(GNOSIS_PAY_DELAY_MODIFIER_ADDRESS, moduleAddress)) {
    return true
  }

  const bytecode = await provider.getCode(moduleAddress)

  if (isGenericProxy(bytecode)) {
    const masterCopy = getGenericProxyMasterCopy(bytecode)
    return await isGnosisPayDelayModifier(masterCopy, provider, visited)
  }

  if (isGnosisProxy(bytecode)) {
    const masterCopy = await getGnosisProxyMasterCopy(moduleAddress, provider)
    return await isGnosisPayDelayModifier(masterCopy, provider, visited)
  }

  return false
}
