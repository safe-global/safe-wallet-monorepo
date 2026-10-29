import { LS_NAMESPACE } from '../../../src/config/constants'

/**
 * Local storage that turns SAFE_PRO off through the feature flag override (dev builds only), so
 * the Safe Pro gate does not replace the spending limit actions with its upsell.
 */
export const safeProOffStorage = { [`${LS_NAMESPACE}featureFlagOverrides`]: { SAFE_PRO: false } }
