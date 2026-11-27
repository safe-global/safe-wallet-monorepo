import { useChain } from '@/hooks/useChains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import {
  CheckStatus,
  verdictAttestation,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { getSafenetExplorerUrl } from './statusPresentation'

export type SafenetLinks = {
  /** Proof of a verified BENIGN: the attestation transaction. Null for every other state. */
  attestationHref: string | null
  /** The check's page on the Safenet explorer — never proof. */
  explorerHref: string
}

export const useSafenetLinks = (
  publicStatus: PublicCheckStatus,
  snapshot: SafenetCheckSnapshot | undefined,
  chainId: string,
  safeTxHash: string,
): SafenetLinks => {
  // The Safenet chain (where the attestation landed), not the Safe's.
  const safenetChain = useChain(snapshot?.chainId ?? '')
  const explorerHref = getSafenetExplorerUrl(chainId, safeTxHash)

  // A session-pinned BENIGN can outlive the read that carried its attestation; only a present one is proof.
  const attested = publicStatus === CheckStatus.BENIGN && snapshot ? verdictAttestation(snapshot) : undefined
  if (!attested) return { attestationHref: null, explorerHref }

  const txLink = safenetChain ? getExplorerLink(attested.transactionHash, safenetChain.blockExplorerUriTemplate) : null
  return { attestationHref: txLink?.href ?? null, explorerHref }
}
