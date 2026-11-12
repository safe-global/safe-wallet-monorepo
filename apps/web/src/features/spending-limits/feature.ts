import SpendingLimitsSettings from './components/SpendingLimitsSettings'
import SpendingLimitRow from './components/SpendingLimitRow'
import CreateSpendingLimit from './components/CreateSpendingLimit'
import ReviewSpendingLimit from './components/ReviewSpendingLimit'
import RemoveSpendingLimitReview from './components/RemoveSpendingLimitReview'
import ReviewSpendingLimitTx from './components/ReviewSpendingLimitTx'
import SpendingLimitsLoader from './components/SpendingLimitsLoader'
import TokenSelector from './components/TokenSelector'
import { loadSpendingLimits } from './services/spendingLimitLoader'
import {
  createNewSpendingLimitTx,
  createSpendingLimitEditTx,
  createSpendingLimitsTx,
  dispatchSpendingLimitTxExecution,
} from './services/spendingLimitExecution'
import { buildSpendingLimitEdit } from './services/spendingLimitEdit'

export default {
  // Components
  SpendingLimitsSettings,
  SpendingLimitRow,
  CreateSpendingLimit,
  ReviewSpendingLimit,
  RemoveSpendingLimitReview,
  ReviewSpendingLimitTx,
  SpendingLimitsLoader, // Global loader component - render once in app layout
  TokenSelector,

  // Services
  loadSpendingLimits,
  createNewSpendingLimitTx,
  createSpendingLimitsTx,
  createSpendingLimitEditTx,
  buildSpendingLimitEdit,
  dispatchSpendingLimitTxExecution,
}
