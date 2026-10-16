import type { Address } from 'viem'

/**
 * The SafePolicyGuard deployments, keyed by the configuration delay each one is built with.
 *
 * The delay is fixed per deployment, so the address is what identifies it. A guard outside this
 * set is some other contract: its behaviour is unknown, so nothing may be predicted about it.
 */
export const SAFE_POLICY_GUARD_BY_DELAY: Record<number, Address> = {
  0: '0x55c241591E12CE3c58491D02b737F12D3199ae95',
  5: '0x5202B1ebE100812437d47eae769e155945fbba6a',
  3600: '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20',
  86400: '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED',
}

const KNOWN_GUARDS: ReadonlySet<string> = new Set(
  Object.values(SAFE_POLICY_GUARD_BY_DELAY).map((address) => address.toLowerCase()),
)

/** Whether the Safe's guard is a SafePolicyGuard, and so answers a policy check. */
export const isKnownPolicyGuard = (guard: string | null | undefined): boolean =>
  !!guard && KNOWN_GUARDS.has(guard.toLowerCase())
