// EIP-5792 atomic-batch capability, advertised under both shapes:
//   - current spec: `atomic.status: 'supported'` — what real-world dApps (CowSwap, etc.) check for
//   - older draft: `atomicBatch.supported: true` — kept for dApps still on the old shape
export const ATOMIC_CAPABILITY = {
  atomic: { status: 'supported' },
  atomicBatch: { supported: true },
} as const

export type AtomicCapability = typeof ATOMIC_CAPABILITY

// Build a per-chain capability map keyed by hex chain id, e.g. { '0x1': ATOMIC_CAPABILITY }.
export const buildAtomicCapabilities = (chainIdsHex: string[]): Record<string, AtomicCapability> => {
  return Object.fromEntries(chainIdsHex.map((chainIdHex) => [chainIdHex, ATOMIC_CAPABILITY]))
}
