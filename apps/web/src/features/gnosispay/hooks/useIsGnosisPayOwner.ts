import {
  isGenericProxy,
  getGenericProxyMasterCopy,
  isGnosisProxy,
  getGnosisProxyMasterCopy,
} from '@/features/recovery/services'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type JsonRpcProvider, isAddress } from 'ethers'

import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

const GNOSIS_PAY_DELAY_MODIFIER_ADDRESS = '0x4a97e65188a950dd4b0f21f9b5434daee0bbf9f5'

async function isGnosisPayDelayModifier(
  chainId: string,
  moduleAddress: string,
  provider: JsonRpcProvider,
): Promise<boolean> {
  if (!isAddress(moduleAddress) || chainId !== '100') return false

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

export const useIsGnosisPayOwner = () => {
  const chainId = useChainId()
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()

  const { safe } = useSafeInfo()

  const [gnosisPayDelayModifier] = useAsync(async () => {
    if (!web3ReadOnly || !safe.modules) {
      return undefined
    }
    const delayModuleMap = await Promise.all(
      safe.modules.map((module) => isGnosisPayDelayModifier(chainId, module.value, web3ReadOnly)),
    )
    const idx = delayModuleMap.findIndex((v) => v)
    return idx >= 0 ? safe.modules[idx] : undefined
  }, [chainId, safe.modules, web3ReadOnly])

  return useAsync(async () => {
    if (!wallet?.address || !gnosisPayDelayModifier || !web3ReadOnly) {
      return false
    }
    const delayContract = getModuleInstance(KnownContracts.DELAY, gnosisPayDelayModifier.value, web3ReadOnly)
    return delayContract.isModuleEnabled(wallet.address)
  }, [gnosisPayDelayModifier, wallet?.address, web3ReadOnly])
}
