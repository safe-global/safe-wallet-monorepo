import type { CheckTarget } from '@safe-global/utils/features/safenet-checks'

/** Identity of one check: the Safe it belongs to, plus its transaction hash. */
export type CheckIdentity = CheckTarget & { safeTxHash: string }

/**
 * The key the query cache entry and the aim registry live under. A `safeTxHash`
 * is not an identity on its own: Safe <=1.2.0 leaves the chain id out of its
 * EIP-712 domain, so one hash can name a check on two chains, and a key made of
 * the hash alone would show chain A's state for chain B's view.
 */
export const checkKey = ({ chainId, safeAddress, safeTxHash }: CheckIdentity): string =>
  `${chainId}:${safeAddress.toLowerCase()}:${safeTxHash}`
