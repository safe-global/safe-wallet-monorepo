/**
 * Gnosis Pay Feature Contract
 *
 * Heavy dependencies (`@gnosis.pm/zodiac`, the execution form, queue list,
 * skip-expired flow, per-tx warnings) live behind this contract and are only
 * loaded on a Gnosis Pay safe — see `feature.ts` and `index.ts`.
 *
 * Naming conventions:
 * - PascalCase → component (stub renders null when not ready)
 *
 * Lightweight hooks (`useIsGnosisPaySafe`, `useGnosisPayDelayModule`) are
 * exported eagerly from `index.ts` and intentionally NOT in the contract.
 */
import type GnosisPayBanner from './GnosisPayBanner'
import type GnosisPayQueue from './GnosisPayQueue'
import type GnosisPayExecutionForm from './GnosisPayExecutionForm'

export interface GnosisPayContract {
  GnosisPayBanner: typeof GnosisPayBanner
  GnosisPayQueue: typeof GnosisPayQueue
  GnosisPayExecutionForm: typeof GnosisPayExecutionForm
}
