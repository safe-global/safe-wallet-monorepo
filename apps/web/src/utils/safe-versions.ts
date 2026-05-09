import { hasSafeFeature as sdkHasSafeFeature, type SafeFeature } from '@safe-global/protocol-kit'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

// Note: backend returns `SafeInfo['version']` as `null` for unsupported contracts
export const hasSafeFeature = (feature: SafeFeature, version: SafeState['version']): boolean => {
  if (!version) {
    return false
  }
  return sdkHasSafeFeature(feature, version)
}
