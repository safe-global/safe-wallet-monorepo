import { SAFENET_EXPLORER_URL } from '@safe-global/utils/features/safenet-checks/constants'

// MOCK: the real link targets the attestation; this is the explorer's safeTx route.
export const getSafenetExplorerHref = (chainId: string, safeTxHash: string): string =>
  `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=${chainId}&safeTxHash=${safeTxHash}`
