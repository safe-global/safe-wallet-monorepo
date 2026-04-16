import { SignerInfo } from '@/src/types/address'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getSafeWebAuthnSignerFactoryDeployment } from '@safe-global/safe-modules-deployments'

const hasSignerFactory = (chainId: string): boolean => {
  const deployment = getSafeWebAuthnSignerFactoryDeployment({ network: chainId })
  return !!deployment?.networkAddresses[chainId]
}

export const extractAppSigners = (
  signers: Record<string, SignerInfo>,
  detailedExecutionInfo?: MultisigExecutionDetails,
  chain?: Chain,
): SignerInfo[] => {
  if (!detailedExecutionInfo || !('signers' in detailedExecutionInfo)) {
    return []
  }

  const { signers: signersList } = detailedExecutionInfo

  return signersList
    .filter((signer) => signers[signer.value])
    .map((signer) => signers[signer.value])
    .filter((signer) => {
      // Filter out passkey signers on chains without a deployed signer factory
      if (signer.type === 'passkey' && chain && !hasSignerFactory(chain.chainId)) {
        return false
      }
      return true
    })
}
