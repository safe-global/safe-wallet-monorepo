/**
 * Security Feature - Public API
 *
 * Runs a battery of security scanners over each Safe and surfaces grade/score
 * data for the Security Hub. No components live here — security UI is owned by
 * the spaces feature.
 *
 * ## Usage
 *
 * ```typescript
 * import { SecurityFeature, useSecurityScan } from '@/features/security'
 * import type { ScanContext, ScanResult } from '@/features/security/types'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const security = useLoadFeature(SecurityFeature)
 *
 *   // Services return undefined until $isReady — gate synchronous callers
 *   const key = security.$isReady ? security.scanKey(address, chainId) : ''
 *
 *   // Hooks are direct imports, always loaded
 *   const scan = useSecurityScan(ctx)
 * }
 * ```
 *
 * Gated on FEATURES.SECURITY_HUB so ops can roll out the Hub independently of broader
 * Spaces UI. Spaces itself remains gated on FEATURES.SPACES; both flags must be on for
 * the Hub to render.
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SecurityContract } from './contract'

// Feature handle — gated on the dedicated Security Hub flag
export const SecurityFeature = createFeatureHandle<SecurityContract>('security', FEATURES.SECURITY_HUB)

// Contract type (for explicit annotations if needed)
export type { SecurityContract } from './contract'

// Pure data constants — eagerly available, no need to go through the feature handle
export { SEVERITY_RANK, SAFE_GRADE_RANK } from './data/scanners/constants'

// Hooks exported directly — always loaded, not lazy
export { default as useSecurityScan } from './hooks/useSecurityScan'
export { default as useSecurityHubFeatureRedirect } from './hooks/useSecurityHubFeatureRedirect'
