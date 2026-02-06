import SpendingLimitsSettings from './components/SpendingLimitsSettings'
import SpendingLimitRow from './components/SpendingLimitRow'
import CreateSpendingLimit from './components/CreateSpendingLimit'
import ReviewSpendingLimit from './components/ReviewSpendingLimit'
import RemoveSpendingLimitReview from './components/RemoveSpendingLimitReview'
import ReviewSpendingLimitTx from './components/ReviewSpendingLimitTx'
import SpendingLimitsLoader from './components/SpendingLimitsLoader'
import { loadSpendingLimits } from './services/spendingLimitLoader'
import { createNewSpendingLimitTx, dispatchSpendingLimitTxExecution } from './services/spendingLimitExecution'

export default {
  // Components
  SpendingLimitsSettings,
  SpendingLimitRow,
  CreateSpendingLimit,
  ReviewSpendingLimit,
  RemoveSpendingLimitReview,
  ReviewSpendingLimitTx,
  SpendingLimitsLoader, // Global loader component - render once in app layout

  // Services
  loadSpendingLimits,
  createNewSpendingLimitTx,
  dispatchSpendingLimitTxExecution,
}
