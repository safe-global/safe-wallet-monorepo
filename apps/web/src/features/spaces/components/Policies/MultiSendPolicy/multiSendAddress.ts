import { getAddress } from 'ethers'
import { getMultiSendCallOnlyDeployment, getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'

/** The Safe versions whose MultiSendCallOnly a first guard setup puts under MultiSendPolicy. */
const GOVERNED_MULTI_SEND_VERSIONS = ['1.3.0', '1.4.1', '1.5.0']

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

/** Every official MultiSendCallOnly of the governed versions on this chain, including 1.3.0's canonical and eip155 ones. */
export const getOfficialMultiSendCallOnlyAddresses = (chainId: string): string[] => {
  const addresses = GOVERNED_MULTI_SEND_VERSIONS.flatMap((version) => {
    const address = getMultiSendCallOnlyDeployments({ network: chainId, version })?.networkAddresses[chainId]
    return address === undefined ? [] : [address].flat()
  })
  return [...new Set(addresses.map((address) => getAddress(address)))]
}
