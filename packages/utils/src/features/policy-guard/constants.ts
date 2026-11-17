// The guard needs the module guard slot, which Safe added in v1.5.0, so every policy shares this floor
export const MIN_POLICY_GUARD_SAFE_VERSION = '1.5.0'

// A value transfer has no calldata, so the guard keys native-transfer access by an empty selector
export const NATIVE_TRANSFER_SELECTOR = '0x00000000'
