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

  return signersList.filter((signer) => signers[signer.value]).map((signer) => signers[signer.value])
}
