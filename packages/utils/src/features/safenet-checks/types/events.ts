/**
 * Shared primitives for the Safenet read layer.
 *
 * Every onchain value that is a `uint256`/`uint64`/`uint` is carried as a
 * decimal `string` so the whole tree is Redux-serializable (no bigints ever
 * cross the decode boundary). Point coordinates and scalars (FROST `r`/`z`) are
 * likewise strings.
 */

export type Hex = `0x${string}`
