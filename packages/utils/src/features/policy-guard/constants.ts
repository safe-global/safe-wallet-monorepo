// The guard needs the module guard slot, which Safe added in v1.5.0, so every policy shares this floor
export const MIN_POLICY_GUARD_SAFE_VERSION = '1.5.0'

// The delay of the guard the setup installs: every later policy change waits it out
export const POLICY_GUARD_DELAY_SECONDS = 600

// A value transfer has no calldata, so the guard keys native-transfer access by an empty selector
export const NATIVE_TRANSFER_SELECTOR = '0x00000000'
