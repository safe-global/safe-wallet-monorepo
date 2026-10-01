import type { SafenetChecksPrototypeContract } from '../types'
import SafenetExecuteStatus from './components/SafenetExecuteStatus'
import SafenetHistoryRow from './components/SafenetHistoryRow'
import SafenetQueueChip from './components/SafenetQueueChip'
import SafenetScenarioDialog from './components/SafenetScenarioDialog'
import SafenetShieldRow from './components/SafenetShieldRow'
import SafenetStepperNote from './components/SafenetStepperNote'

const feature: SafenetChecksPrototypeContract = {
  SafenetExecuteStatus,
  SafenetHistoryRow,
  SafenetQueueChip,
  SafenetScenarioDialog,
  SafenetShieldRow,
  SafenetStepperNote,
}

export default feature
