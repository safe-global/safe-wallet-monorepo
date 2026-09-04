import type { CloudCosignerPolicy } from '../types'

/**
 * The EIP-191 message an owner signs to update a Safe's cosigner policy. The cosigner service
 * rebuilds the identical string to verify the signature, so any change here is a protocol change
 * for both sides.
 */
export const buildPolicyMessage = ({
  chainId,
  safeAddress,
  issuedAt,
  policy,
}: {
  chainId: string
  safeAddress: string
  issuedAt: string
  policy: CloudCosignerPolicy
}): string => {
  return [
    'Safe cloud cosigner policy update',
    `Chain ID: ${chainId}`,
    `Safe: ${safeAddress}`,
    `Issued at: ${issuedAt}`,
    `Value threshold (USD): ${policy.valueThresholdUsd}`,
    `Review unknown contracts: ${policy.reviewUnknownContracts}`,
    'Instructions:',
    policy.instructions ?? '',
  ].join('\n')
}

export type SignedPolicyUpdate = {
  signature: string
  issuedAt: string
}

/**
 * Builds the policy message for "now" and signs it with the given signer function, so the
 * wallet-specific signing path stays injectable.
 */
export const signPolicyUpdate = async ({
  chainId,
  safeAddress,
  policy,
  signMessage,
  now = new Date(),
}: {
  chainId: string
  safeAddress: string
  policy: CloudCosignerPolicy
  signMessage: (message: string) => Promise<string>
  now?: Date
}): Promise<SignedPolicyUpdate> => {
  const issuedAt = now.toISOString()
  const signature = await signMessage(buildPolicyMessage({ chainId, safeAddress, issuedAt, policy }))
  return { signature, issuedAt }
}
