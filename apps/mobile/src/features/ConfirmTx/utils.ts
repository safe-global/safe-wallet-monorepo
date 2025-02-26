import { SignerInfo } from '@/src/types/address'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const extractAppSigners = (
  signers: Record<string, SignerInfo>,
  detailedExecutionInfo?: MultisigExecutionDetails,
): SignerInfo[] => {
  if (!detailedExecutionInfo || !('signers' in detailedExecutionInfo)) {
    return []
  }

  const { signers: signersList } = detailedExecutionInfo

  // TODO: remove this casting once we fix the cgw type problem
  return signersList.filter((signer) => signers[signer.value]) as unknown as SignerInfo[]
}
