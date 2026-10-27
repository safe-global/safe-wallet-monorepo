import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'

/**
 * The MultiSend deployment a Safe batches through, which is the access target the policy
 * must be bound to.
 *
 * Falls back to the 1.3.0 deployment when the Safe's own version has none on this chain —
 * the same resolution the recovery module uses. Returns undefined when the chain has no
 * MultiSend deployment at all, in which case there is no batch access to govern.
 */
export const getMultiSendAddress = (chainId: string, safeVersion?: string | null): string | undefined => {
  const deployment =
    (safeVersion ? getMultiSendCallOnlyDeployment({ network: chainId, version: safeVersion }) : undefined) ??
    getMultiSendCallOnlyDeployment({ network: chainId, version: '1.3.0' }) ??
    getMultiSendCallOnlyDeployment({ network: chainId })

  return deployment?.networkAddresses[chainId] ?? deployment?.defaultAddress
}
