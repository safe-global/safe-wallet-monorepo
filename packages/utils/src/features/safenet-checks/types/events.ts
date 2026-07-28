/**
 * Shared primitives for the Safenet read layer. Onchain integers are carried as
 * decimal strings so the tree stays Redux-serializable; the event types that
 * rely on that land with the decoder.
 */

export type Hex = `0x${string}`
