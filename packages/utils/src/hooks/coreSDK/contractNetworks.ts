import type { ContractNetworksConfig } from '@safe-global/protocol-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  isCanonicalDeployment,
  getCanonicalMultiSendCallOnlyAddress,
  getCanonicalMultiSendAddress,
} from '@safe-global/utils/services/contracts/deployments'

type GetCanonicalMultiSendContractNetworksParams = {
  implementationAddress: string
  chainId: string
  safeVersion: SafeState['version']
  contractNetworks?: ContractNetworksConfig
}

export const getCanonicalMultiSendContractNetworks = ({
  implementationAddress,
  chainId,
  safeVersion,
  contractNetworks,
}: GetCanonicalMultiSendContractNetworksParams): ContractNetworksConfig | undefined => {
  if (!isCanonicalDeployment(implementationAddress, chainId, safeVersion)) {
    return contractNetworks
  }

  const canonicalMultiSendCallOnly = getCanonicalMultiSendCallOnlyAddress(safeVersion)
  const canonicalMultiSend = getCanonicalMultiSendAddress(safeVersion)

  return {
    ...contractNetworks,
    [chainId]: {
      ...contractNetworks?.[chainId],
      ...(canonicalMultiSendCallOnly && { multiSendCallOnlyAddress: canonicalMultiSendCallOnly }),
      ...(canonicalMultiSend && { multiSendAddress: canonicalMultiSend }),
    },
  }
}
