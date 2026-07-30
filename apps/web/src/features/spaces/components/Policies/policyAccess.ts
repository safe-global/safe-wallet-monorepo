/**
 * A policy is bound to an *access* — a (target, selector) pair on the Safe. The guard
 * also supports a catch-all access with neither set, which applies to any transaction
 * no specific access matches. That's the fallback policy.
 *
 * On the wire an active policy packs its access into `id` as `selector ‖ target`, so
 * the fallback's id is all zeros; pending bindings carry `target` and `selector`
 * separately, and both are zero.
 */

import { isFallbackAccessId } from './shared/accessSelector'

const isZeroHex = (value: string | null | undefined): boolean => !!value && /^0x0*$/i.test(value)

/** The fallback access, from a pending binding or a rebuilt configuration. */
export const isFallbackAccess = ({ target, selector }: { target?: string | null; selector?: string | null }): boolean =>
  isZeroHex(target) && isZeroHex(selector)

/**
 * The fallback access, from an active policy's packed `id`.
 *
 * Decoded rather than string-matched: a DELEGATECALL fallback has its operation bit set,
 * so it isn't an all-zero key.
 */
export const isFallbackPolicyId = (id: string | null | undefined): boolean => isFallbackAccessId(id)
