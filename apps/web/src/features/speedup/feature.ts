/**
 * Speedup Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * IMPORTANT: Hooks are NOT included here - they're exported from index.ts
 * to avoid Rules of Hooks violations (lazy-loading hooks changes hook count between renders).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(SpeedupFeature)
 */
import type { SpeedupContract } from './contract'

// Component imports
import SpeedUpModal from './components/SpeedUpModal'
import SpeedUpMonitor from './components/SpeedUpMonitor'

// Flat structure - naming conventions determine stub behavior:
// - PascalCase → component (stub renders null)
// - camelCase → service (undefined when not ready)
// NO hooks here - they're exported from index.ts
const feature: SpeedupContract = {
  // Components
  SpeedUpModal,
  SpeedUpMonitor,
}

export default feature
