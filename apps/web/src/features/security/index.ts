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
 * Gated on FEATURES.SPACES — the Security Hub only renders inside Spaces.
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SecurityContract } from './contract'

// Feature handle — gated on Spaces since the hub lives there
export const SecurityFeature = createFeatureHandle<SecurityContract>('security', FEATURES.SPACES)

// Contract type (for explicit annotations if needed)
export type { SecurityContract } from './contract'

// Hooks exported directly — always loaded, not lazy
export { default as useSecurityScan } from './hooks/useSecurityScan'
