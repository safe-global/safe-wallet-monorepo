/**
 * Stake Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag FEATURES.STAKING is enabled
 * 2. A consumer calls useLoadFeature(StakeFeature)
 */
import type { StakeContract } from './contract'

// Direct component imports (already lazy-loaded at feature level)
import StakingWidget from './components/StakingWidget'
import StakePage from './components/StakePage'
import StakeButton from './components/StakeButton'
import StakingConfirmationTx from './components/StakingConfirmationTx'

// Service imports
import { getStakeTitle } from './helpers/utils'

// Flat structure - naming determines stub behavior
const feature: StakeContract = {
  // Main Widgets
  StakingWidget,
  StakePage,

  // UI Components
  StakeButton,
  StakingConfirmationTx,

  // Services
  getStakeTitle,
}

export default feature satisfies StakeContract
