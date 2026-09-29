import type SpendingLimitsSettings from './components/SpendingLimitsSettings'
import type SpendingLimitRow from './components/SpendingLimitRow'
import type CreateSpendingLimit from './components/CreateSpendingLimit'
import type ReviewSpendingLimit from './components/ReviewSpendingLimit'
import type RemoveSpendingLimitReview from './components/RemoveSpendingLimitReview'
import type ReviewSpendingLimitTx from './components/ReviewSpendingLimitTx'
import type SpendingLimitsLoader from './components/SpendingLimitsLoader'
import type { loadSpendingLimits } from './services/spendingLimitLoader'
import type {
  createNewSpendingLimitTx,
  createSpendingLimitEditTx,
  createSpendingLimitsTx,
  dispatchSpendingLimitTxExecution,
} from './services/spendingLimitExecution'
import type { buildSpendingLimitDelta } from './services/spendingLimitDelta'

export interface SpendingLimitsContract {
  // Components (PascalCase) - stub renders null
  SpendingLimitsSettings: typeof SpendingLimitsSettings
  SpendingLimitRow: typeof SpendingLimitRow
  CreateSpendingLimit: typeof CreateSpendingLimit
  ReviewSpendingLimit: typeof ReviewSpendingLimit
  RemoveSpendingLimitReview: typeof RemoveSpendingLimitReview
  ReviewSpendingLimitTx: typeof ReviewSpendingLimitTx
  SpendingLimitsLoader: typeof SpendingLimitsLoader // Global loader - render once in app layout

  // Services (camelCase) - undefined when not ready
  loadSpendingLimits: typeof loadSpendingLimits
  createNewSpendingLimitTx: typeof createNewSpendingLimitTx
  createSpendingLimitsTx: typeof createSpendingLimitsTx
  createSpendingLimitEditTx: typeof createSpendingLimitEditTx
  buildSpendingLimitDelta: typeof buildSpendingLimitDelta
  dispatchSpendingLimitTxExecution: typeof dispatchSpendingLimitTxExecution
}
