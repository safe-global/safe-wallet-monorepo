import { getSafeContract, getMultiSendCallOnlyContract, SafeProvider } from '@safe-global/protocol-kit'
import type { SafeBaseContract } from '@safe-global/protocol-kit'
import type { SafeState as SafeInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { _getValidatedGetContractProps } from '@safe-global/utils/services/contracts/safeContracts'
import {
  isCanonicalDeployment,
  getCanonicalMultiSendCallOnlyAddress,
} from '@safe-global/utils/services/contracts/deployments'

const getGnosisSafeContract = async (safe: SafeInfo, safeProvider: SafeProvider) => {
  return getSafeContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(safe.version).safeVersion,
    customSafeAddress: safe.address.value,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getReadOnlyCurrentGnosisSafeContract = async (safe: SafeInfo): Promise<SafeBaseContract<any>> => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getGnosisSafeContract(safe, safeProvider)
}

export const getReadOnlyMultiSendCallOnlyContract = async (
  safeVersion: SafeInfo['version'],
  chainId?: string,
  implementationAddress?: string,
) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  // On zkSync, if the Safe uses a canonical (EVM bytecode) mastercopy,
  // we must use canonical auxiliary contracts because EVM contracts
  // cannot delegatecall to EraVM contracts.
  let customContractAddress: string | undefined
  if (chainId && implementationAddress && isCanonicalDeployment(implementationAddress, chainId, safeVersion)) {
    customContractAddress = getCanonicalMultiSendCallOnlyAddress(chainId, safeVersion)
  }

  return getMultiSendCallOnlyContract({
    safeProvider,
    safeVersion: _getValidatedGetContractProps(safeVersion).safeVersion,
    customContracts: customContractAddress ? { multiSendCallOnlyAddress: customContractAddress } : undefined,
  })
}
