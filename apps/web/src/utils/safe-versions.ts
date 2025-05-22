import {
  hasSafeFeature as sdkHasSafeFeature,
  type SAFE_FEATURES,
} from '@safe-global/protocol-kit/dist/src/utils/safeVersions'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

// Note: backend returns `SafeInfo['version']` as `null` for unsupported contracts
export const hasSafeFeature = (feature: SAFE_FEATURES, version: SafeState['version']): boolean => {
  if (!version) {
    return false
  }
  return sdkHasSafeFeature(feature, version)
}
