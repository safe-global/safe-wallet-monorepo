import { getMultiSendCallOnlyDeployments, getMultiSendDeployments } from '@safe-global/safe-deployments'
import type { SafeVersion } from '@safe-global/types-kit'
import { hasMatchingDeployment } from '../services/contracts/deployments'
import { sameAddress } from './addresses'
import { ZERO_ADDRESS } from './constants'

// MultiSend / MultiSendCallOnly versions that default a sub-transaction `to` of the zero address to
// `address(this)`. Introduced in 1.5.0; earlier deployments (1.3.0, 1.4.1, …) forward the zero
// address as-is, so a zero `to` there is a real call to the zero address and must be left untouched.
const ZERO_ADDRESS_DEFAULT_VERSIONS: SafeVersion[] = ['1.5.0']

/**
 * Whether the given MultiSend / MultiSendCallOnly deployment defaults a zero-address sub-transaction
 * `to` to the executing Safe (`address(this)`). True only for v1.5.0+ deployments.
 *
 * @param multiSendAddress - the MultiSend library the batch is delegatecalled into (the batch's `to`)
 * @param chainId - the chain the batch executes on
 */
export const multiSendDefaultsToSelf = (multiSendAddress: string, chainId: string): boolean =>
  hasMatchingDeployment(getMultiSendDeployments, multiSendAddress, chainId, ZERO_ADDRESS_DEFAULT_VERSIONS) ||
  hasMatchingDeployment(getMultiSendCallOnlyDeployments, multiSendAddress, chainId, ZERO_ADDRESS_DEFAULT_VERSIONS)

/**
 * Resolves the target of a MultiSend batched sub-transaction to the executing Safe when its `to` is
 * the zero address.
 *
 * MultiSend v1.5.0+ rewrites a zero-address `to` to `address(this)` — the Safe executing the batch
 * via `delegatecall`. Older deployments call the zero address as-is, so callers MUST gate this on
 * {@link multiSendDefaultsToSelf}; this helper only performs the substitution.
 *
 * @param to - decoded sub-transaction target (possibly the zero address)
 * @param safeAddress - the Safe executing the batch (MultiSend's `address(this)`)
 */
export const resolveMultiSendToAddress = (to: string, safeAddress?: string): string =>
  safeAddress && sameAddress(to, ZERO_ADDRESS) ? safeAddress : to
