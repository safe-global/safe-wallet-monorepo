import useAsync from '@safe-global/utils/hooks/useAsync'
import { getReadOnlyMultiSendCallOnlyContract } from '@/services/contracts/safeContracts'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

/**
 * Hook to get the MultiSendCallOnly contract and its address.
 * On zkSync Era, returns the canonical contract for Safes using canonical mastercopies.
 */
export const useMultiSendContract = (safe: ExtendedSafeInfo) => {
  const safeSDK = useSafeSDK()

  const [multiSendContract] = useAsync(async () => {
    if (!safe.version || !safeSDK) return
    return await getReadOnlyMultiSendCallOnlyContract(safe.version, safe.chainId, safe.implementation?.value)
  }, [safe.version, safe.chainId, safe.implementation?.value, safeSDK])

  const [multiSendContractAddress = ''] = useAsync(async () => {
    if (!multiSendContract) return ''
    return multiSendContract.getAddress()
  }, [multiSendContract])

  return { multiSendContract, multiSendContractAddress }
}
