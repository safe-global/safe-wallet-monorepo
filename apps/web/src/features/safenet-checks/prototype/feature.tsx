import type { SafenetChecksPrototypeContract } from '../types'
import SafenetExecuteStatus from './components/SafenetExecuteStatus'
import SafenetHistoryRow from './components/SafenetHistoryRow'
import SafenetQueueChip from './components/SafenetQueueChip'
import SafenetScenarioDialog from './components/SafenetScenarioDialog'
import SafenetShieldRow from './components/SafenetShieldRow'

const feature: SafenetChecksPrototypeContract = {
  SafenetExecuteStatus,
  SafenetHistoryRow,
  SafenetQueueChip,
  SafenetScenarioDialog,
  SafenetShieldRow,
}

export default feature
