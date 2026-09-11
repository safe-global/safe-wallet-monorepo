import type { SafenetChecksContract } from './types'
import SafenetAuditRow from './components/SafenetAuditRow'
import SafenetChecksSection from './components/SafenetChecksSection'
import SafenetQueueStatus from './components/SafenetQueueStatus'

const feature: SafenetChecksContract = {
  SafenetAuditRow,
  SafenetChecksSection,
  SafenetQueueStatus,
}

export default feature
