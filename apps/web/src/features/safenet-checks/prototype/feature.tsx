import type { SafenetChecksPrototypeContract } from '../types'
import { startRecordingCheckStarts } from './checkStarts'
import SafenetCardCaption from './components/SafenetCardCaption'
import SafenetHistoryRow from './components/SafenetHistoryRow'
import SafenetQueueChip from './components/SafenetQueueChip'
import SafenetScenarioDialog from './components/SafenetScenarioDialog'
import SafenetShieldRow from './components/SafenetShieldRow'
import SafenetTxStatus from './components/SafenetTxStatus'

startRecordingCheckStarts()

const feature: SafenetChecksPrototypeContract = {
  SafenetCardCaption,
  SafenetHistoryRow,
  SafenetQueueChip,
  SafenetScenarioDialog,
  SafenetShieldRow,
  SafenetTxStatus,
}

export default feature
