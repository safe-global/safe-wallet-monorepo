import { ContractVersions, getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { Delay, SupportedNetworks } from '@gnosis.pm/zodiac'
import { type JsonRpcProvider, isAddress } from 'ethers'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getGenericProxyMasterCopy, getGnosisProxyMasterCopy, isGenericProxy, isGnosisProxy } from './proxies'
import { MAX_RECOVERER_PAGE_SIZE } from './recovery-state'

export async function _getZodiacContract(
  chainId: string,
  moduleAddress: string,
  provider: JsonRpcProvider,
): Promise<string | undefined> {
  if (!isAddress(moduleAddress)) return

  const bytecode = await provider.getCode(moduleAddress)

  if (isGenericProxy(bytecode)) {
    const masterCopy = getGenericProxyMasterCopy(bytecode)
    return await _getZodiacContract(chainId, masterCopy, provider)
  }

  if (isGnosisProxy(bytecode)) {
    const masterCopy = await getGnosisProxyMasterCopy(moduleAddress, provider)
    return await _getZodiacContract(chainId, masterCopy, provider)
  }

  const zodiacChainContracts = ContractVersions[Number(chainId) as SupportedNetworks]
  const zodiacContract = Object.entries(zodiacChainContracts).find(([, addresses]) => {
    return Object.values(addresses).some((address) => {
      return sameAddress(address, moduleAddress)
    })
  })

  return zodiacContract?.[0]
}

async function isOfficialDelayModifier(chainId: string, moduleAddress: string, provider: JsonRpcProvider) {
  const zodiacContract = await _getZodiacContract(chainId, moduleAddress, provider)
  return zodiacContract === KnownContracts.DELAY
}

export async function _isOfficialRecoveryDelayModifier(
  chainId: string,
  delayModifier: Delay,
  provider: JsonRpcProvider,
) {
  // Zodiac-deployed Delay Modifiers only have other Zodiac contracts added as modules
  // If Delay Modifier only has non-Zodiac contracts as modules, it's a recovery-specific Delay Modifier
  const [modules] = await delayModifier.getModulesPaginated(SENTINEL_ADDRESS, MAX_RECOVERER_PAGE_SIZE)

  if (modules.length === 0) {
    return false
  }

  const types = await Promise.all(modules.map((module) => _getZodiacContract(chainId, module, provider)))

  const knownContracts = Object.values(KnownContracts)
  return types.every((type) => !knownContracts.includes(type as KnownContracts))
}

export async function getRecoveryDelayModifiers(
  chainId: string,
  modules: SafeState['modules'],
  provider: JsonRpcProvider,
): Promise<Array<Delay>> {
  if (!modules) {
    return []
  }

  const delayModifiers = await Promise.all(
    modules.map(async ({ value }) => {
      const isDelayModifier = await isOfficialDelayModifier(chainId, value, provider)
      return isDelayModifier && getModuleInstance(KnownContracts.DELAY, value, provider)
    }),
  ).then((instances) => instances.filter(Boolean) as Array<Delay>)

  const recoveryDelayModifiers = await Promise.all(
    delayModifiers.map(async (delayModifier) => {
      // TODO: Fetches "recoverers" of Delay Modifier, but we later fetch them again
      // in useRecoveryState. Could optimise this by returning the recoverers here
      const isRecoveryDelayModifier = await _isOfficialRecoveryDelayModifier(chainId, delayModifier, provider)
      return isRecoveryDelayModifier && delayModifier
    }),
  ).then((instances) => instances.filter(Boolean) as Array<Delay>)

  return recoveryDelayModifiers
}
