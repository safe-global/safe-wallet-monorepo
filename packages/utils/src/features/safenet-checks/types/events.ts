/**
 * Shared primitives for the Safenet read layer. Onchain integers are carried as
 * decimal strings so the tree stays Redux-serializable; the event types that
 * rely on that land with the decoder.
 *
 * `Hex` is the Safe SDK's own (`@safe-global/types-kit`, already a dependency
 * of this package) — re-exported so feature code keeps importing from
 * `../types`.
 */

export type { Hex } from '@safe-global/types-kit'
