import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { CounterfactualImplementation } from './contract'

// Feature handle - uses auto-derivation (counterfactual → FEATURES.COUNTERFACTUAL)
export const CounterfactualFeature = createFeatureHandle<CounterfactualImplementation>('counterfactual')

export { default as PayNowPayLater } from './components/PayNowPayLater'
export { LoopIcon } from './components/CounterfactualStatusButton'
