/**
 * Counterfactual Feature Implementation - LAZY LOADED (v3 flat structure)
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(CounterfactualFeature)
 *
 * This ensures the counterfactual code and all related components
 * are NOT included in the bundle when the feature is disabled.
 */
import type { CounterfactualImplementation } from './contract'

// Direct imports - this file is already lazy-loaded
import ActivateAccountButton from './components/ActivateAccountButton'
import ActivateAccountFlow from './components/ActivateAccountFlow'
import CheckBalance from './components/CheckBalance'
import CounterfactualForm from './components/CounterfactualForm'
import CounterfactualHooks from './components/CounterfactualHooks'
import CounterfactualStatusButton, { LoopIcon } from './components/CounterfactualStatusButton'
import CounterfactualSuccessScreen from './components/CounterfactualSuccessScreen'
import FirstTxFlow from './components/FirstTxFlow'
import LazyCounterfactual from './components/LazyCounterfactual'
import PayNowPayLater from './components/PayNowPayLater'

// Services (heavy ones that need lazy-loading)
import {
  getUndeployedSafeInfo,
  replayCounterfactualSafeDeployment,
  activateReplayedSafe,
  getCounterfactualBalance,
} from './services/safeDeployment'

// Flat structure - naming conventions determine stub behavior:
// - PascalCase → component (stub renders null)
// - camelCase → service (stub is no-op)
const feature: CounterfactualImplementation = {
  // Components
  ActivateAccountButton,
  ActivateAccountFlow,
  CheckBalance,
  CounterfactualForm,
  CounterfactualHooks,
  CounterfactualStatusButton,
  LoopIcon,
  CounterfactualSuccessScreen,
  FirstTxFlow,
  LazyCounterfactual,
  PayNowPayLater,

  // Services
  getUndeployedSafeInfo,
  replayCounterfactualSafeDeployment,
  activateReplayedSafe,
  getCounterfactualBalance,
}

export default feature
