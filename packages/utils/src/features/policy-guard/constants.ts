// The guard needs the module guard slot, which Safe added in v1.5.0, so every policy shares this floor
export const MIN_POLICY_GUARD_SAFE_VERSION = '1.5.0'

const DEFAULT_POLICY_GUARD_DELAY_SECONDS = 180
const configuredPolicyGuardDelay = Number(
  process.env.NEXT_PUBLIC_POLICY_GUARD_DELAY_SECONDS ||
    process.env.EXPO_PUBLIC_POLICY_GUARD_DELAY_SECONDS ||
    DEFAULT_POLICY_GUARD_DELAY_SECONDS,
)

// The delay of the guard the setup installs: every later policy change waits it out
export const POLICY_GUARD_DELAY_SECONDS = Number.isFinite(configuredPolicyGuardDelay)
  ? configuredPolicyGuardDelay
  : DEFAULT_POLICY_GUARD_DELAY_SECONDS

// A value transfer has no calldata, so the guard keys native-transfer access by an empty selector
export const NATIVE_TRANSFER_SELECTOR = '0x00000000'
