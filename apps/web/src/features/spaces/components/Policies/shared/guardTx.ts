import { Interface } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'

export const SAFE_SET_GUARD_ABI = ['function setGuard(address guard)'] as const

export const CONFIGURE_IMMEDIATELY_ABI = [
  'function configureImmediately(tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)[] configurations)',
] as const

export const OPERATION_CALL = 0

const safeIface = new Interface(SAFE_SET_GUARD_ABI)
const guardIface = new Interface(CONFIGURE_IMMEDIATELY_ABI)

/** One `Configuration` entry for `configureImmediately` (a SafePolicyGuard policy binding). */
export type PolicyConfiguration = {
  target: string
  selector: string
  operation: number
  policy: string
  data: string
}

/**
 * Builds the `setGuard(safePolicyGuard)` tx — a call to the Safe itself.
 * Reusable by every guard-enforced policy. The caller decides whether it's
 * needed (i.e. the guard isn't already installed) via `usePolicyGuard`.
 */
export const buildSetGuardTx = (safeAddress: string, safePolicyGuard: string): MetaTransactionData => ({
  to: safeAddress,
  value: '0',
  data: safeIface.encodeFunctionData('setGuard', [safePolicyGuard]),
})

/**
 * Builds the `configureImmediately(Configuration[])` tx against the guard.
 * Each policy builder supplies its own `Configuration[]`; this shared encoder
 * turns them into the guard call.
 */
export const encodeConfiguration = (
  safePolicyGuard: string,
  configurations: PolicyConfiguration[],
): MetaTransactionData => ({
  to: safePolicyGuard,
  value: '0',
  data: guardIface.encodeFunctionData('configureImmediately', [
    configurations.map((c) => [c.target, c.selector, c.operation, c.policy, c.data]),
  ]),
})
