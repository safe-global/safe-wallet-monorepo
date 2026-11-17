// The guard needs the module guard slot, which Safe added in v1.5.0, so every policy shares this floor
export const MIN_POLICY_GUARD_SAFE_VERSION = '1.5.0'

// Source: https://github.com/safe-global/policy-indexer/blob/main/config.yaml — same address on every chain
// One guard per root-activation delay, all with a 604800s expiry
export const SAFE_POLICY_GUARD_BY_DELAY = {
  '0s': '0x55c241591E12CE3c58491D02b737F12D3199ae95',
  '60s': '0xC83bC185770ac0Da8A970f35695064eEe62e236c',
  '180s': '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f',
  '600s': '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57',
  '3600s': '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20',
  '86400s': '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED',
} as const

const KNOWN_POLICY_GUARDS: ReadonlySet<string> = new Set(
  Object.values(SAFE_POLICY_GUARD_BY_DELAY).map((address) => address.toLowerCase()),
)

export const isKnownPolicyGuard = (guard: string | null | undefined): boolean =>
  !!guard && KNOWN_POLICY_GUARDS.has(guard.toLowerCase())
