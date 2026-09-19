/**
 * Portfolio Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * IMPORTANT: Hooks are NOT included here - they're exported from index.ts
 * to avoid Rules of Hooks violations (lazy-loading hooks changes hook count between renders).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(PortfolioFeature)
 */
import type { PortfolioContract } from './contract'

// Component imports
import PortfolioRefreshHint from './components/PortfolioRefreshHint'

// Naming determines stub behavior: PascalCase → component (renders null), camelCase → service (undefined until ready).
// NO hooks here - they're exported from index.ts.
const feature: PortfolioContract = {
  // Components
  PortfolioRefreshHint,
}

export default feature
