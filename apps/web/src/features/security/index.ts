/**
 * Security Feature - Public API
 *
 * Runs a battery of security scanners over each Safe and surfaces grade/score
 * data for the Security Hub. No components live here — security UI is owned by
 * the spaces feature.
 *
 * Gated on FEATURES.SECURITY_HUB so ops can roll out the Hub independently of broader
 * Spaces UI. Spaces itself remains gated on FEATURES.SPACES; both flags must be on for
 * the Hub to render.
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SecurityContract } from './contract'

export const SecurityFeature = createFeatureHandle<SecurityContract>('security', FEATURES.SECURITY_HUB)

export type { SecurityContract } from './contract'

// Pure data constants — eagerly available, no need to go through the feature handle
export { SEVERITY_RANK, SAFE_GRADE_RANK } from './data/scanners/constants'

// Hooks exported directly — always loaded, not lazy
export { default as useSecurityScan } from './hooks/useSecurityScan'
export { default as useSecurityHubFeatureRedirect } from './hooks/useSecurityHubFeatureRedirect'
export { useVulnerableSafe } from './hooks/useVulnerableModules'
