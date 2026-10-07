import type { SafenetChecksContract } from './types'
import SafenetAuditRow from './components/SafenetAuditRow'
import SafenetChecksSection from './components/SafenetChecksSection'
import SafenetDetailsCard from './components/SafenetDetailsCard'
import SafenetQueueStatus from './components/SafenetQueueStatus'

const feature: SafenetChecksContract = {
  SafenetAuditRow,
  SafenetChecksSection,
  SafenetDetailsCard,
  SafenetQueueStatus,
}

export default feature
