import { SafeProvider } from '@safe-global/protocol-kit'
import {
  getMultiSendCallOnlyContractInstance,
  getSafeContractInstance,
} from '@safe-global/protocol-kit/dist/src/contracts/contractInstances'
import type SafeBaseContract from '@safe-global/protocol-kit/dist/src/contracts/Safe/SafeBaseContract'
import type { SafeState as SafeInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { _getValidatedGetContractProps } from '@safe-global/utils/services/contracts/safeContracts'

const getGnosisSafeContract = async (safe: SafeInfo, safeProvider: SafeProvider) => {
  return getSafeContractInstance(
    _getValidatedGetContractProps(safe.version).safeVersion,
    safeProvider,
    safe.address.value,
  )
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

export const getReadOnlyMultiSendCallOnlyContract = async (safeVersion: SafeInfo['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getMultiSendCallOnlyContractInstance(_getValidatedGetContractProps(safeVersion).safeVersion, safeProvider)
}
