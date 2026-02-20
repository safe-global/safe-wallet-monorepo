/**
 * Stake Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components and services.
 * Accessed via useLoadFeature(StakeFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 * - camelCase → Service (undefined when not ready, check $isReady before calling)
 *
 * IMPORTANT: Hooks are NOT in the contract - exported directly from index.ts
 */

import type StakingWidget from './components/StakingWidget'
import type StakePage from './components/StakePage'
import type StakeButton from './components/StakeButton'
import type StakingConfirmationTx from './components/StakingConfirmationTx'
import type { getStakeTitle } from './helpers/utils'

export interface StakeContract {
  // Main Widgets (PascalCase → stub renders null)
  StakingWidget: typeof StakingWidget
  StakePage: typeof StakePage

  // UI Components
  StakeButton: typeof StakeButton
  StakingConfirmationTx: typeof StakingConfirmationTx

  // Services (camelCase → undefined when not ready)
  getStakeTitle: typeof getStakeTitle
}
