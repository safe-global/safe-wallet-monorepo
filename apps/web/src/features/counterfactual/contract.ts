/**
 * Counterfactual Feature Contract - v3 flat structure
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 *
 * IMPORTANT:
 * - Hooks are NOT in the contract. They're exported directly from index.ts
 *   (always loaded, not lazy) to avoid Rules of Hooks violations.
 * - Store exports (slice, selectors, actions) are NOT included here
 *   because they must be available at Redux store initialization time.
 *   Import them directly from '@/features/counterfactual/store'
 */
import type { Dispatch, SetStateAction } from 'react'
import type { SignOrExecuteProps } from '@/components/tx/shared/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { PayMethod } from './types'

// Component imports for typeof pattern (enables IDE navigation)
import type ActivateAccountButton from './components/ActivateAccountButton'
import type ActivateAccountFlow from './components/ActivateAccountFlow'
import type CheckBalance from './components/CheckBalance'
import type CounterfactualForm from './components/CounterfactualForm'
import type CounterfactualHooks from './components/CounterfactualHooks'
import type CounterfactualStatusButton from './components/CounterfactualStatusButton'
import type { LoopIcon } from './components/CounterfactualStatusButton'
import type CounterfactualSuccessScreen from './components/CounterfactualSuccessScreen'
import type FirstTxFlow from './components/FirstTxFlow'
import type LazyCounterfactual from './components/LazyCounterfactual'
import type PayNowPayLater from './components/PayNowPayLater'

// Service imports for typeof pattern
import type {
  getUndeployedSafeInfo,
  replayCounterfactualSafeDeployment,
  activateReplayedSafe,
  getCounterfactualBalance,
} from './services/safeDeployment'

// Component prop types (for components with external props)
export interface PayNowPayLaterProps {
  totalFee: string
  canRelay: boolean
  isMultiChain: boolean
  payMethod: PayMethod
  setPayMethod: Dispatch<SetStateAction<PayMethod>>
}

export interface CounterfactualFormProps extends SignOrExecuteProps {
  safeTx?: SafeTransaction
  isCreation?: boolean
}

export interface FirstTxFlowProps {
  open: boolean
  onClose: () => void
}

/**
 * Counterfactual Feature Implementation - flat structure
 * This is what gets loaded when handle.load() is called.
 */
export interface CounterfactualImplementation {
  // Components (PascalCase) - stub renders null
  /** Button to activate a counterfactual safe */
  ActivateAccountButton: typeof ActivateAccountButton
  /** Flow for activating a counterfactual account */
  ActivateAccountFlow: typeof ActivateAccountFlow
  /** Balance check component for counterfactual safes */
  CheckBalance: typeof CheckBalance
  /** Form for counterfactual safe creation (uses madProps) */
  CounterfactualForm: typeof CounterfactualForm
  /** Hooks component that runs counterfactual-related effects */
  CounterfactualHooks: typeof CounterfactualHooks
  /** Status button showing counterfactual safe status */
  CounterfactualStatusButton: typeof CounterfactualStatusButton
  /** Loop icon used in status displays */
  LoopIcon: typeof LoopIcon
  /** Success screen after counterfactual safe creation */
  CounterfactualSuccessScreen: typeof CounterfactualSuccessScreen
  /** First transaction flow for counterfactual safes */
  FirstTxFlow: typeof FirstTxFlow
  /** Lazy loading wrapper for counterfactual components */
  LazyCounterfactual: typeof LazyCounterfactual
  /** Pay now / pay later selection component */
  PayNowPayLater: typeof PayNowPayLater

  // Services (camelCase) - stub is no-op
  /** Get Safe info for an undeployed safe */
  getUndeployedSafeInfo: typeof getUndeployedSafeInfo
  /** Replay a counterfactual safe deployment to another chain */
  replayCounterfactualSafeDeployment: typeof replayCounterfactualSafeDeployment
  /** Activate a replayed safe */
  activateReplayedSafe: typeof activateReplayedSafe
  /** Get balance for a counterfactual (undeployed) safe */
  getCounterfactualBalance: typeof getCounterfactualBalance
}

/**
 * Counterfactual Feature Contract - the full loaded feature type.
 */
export interface CounterfactualContract extends CounterfactualImplementation {
  readonly name: 'counterfactual'
  useIsEnabled: () => boolean | undefined
}
