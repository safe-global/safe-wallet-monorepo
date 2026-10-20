import type { SafenetChecksContract } from './types'
import SafenetAuditRow from './components/SafenetAuditRow'
import SafenetBatchWarning from './components/SafenetBatchWarning'
import SafenetChecksSection from './components/SafenetChecksSection'
import SafenetDetailsCard from './components/SafenetDetailsCard'
import SafenetRiskChip from './components/SafenetRiskChip'

const feature: SafenetChecksContract = {
  SafenetAuditRow,
  SafenetBatchWarning,
  SafenetChecksSection,
  SafenetDetailsCard,
  SafenetRiskChip,
}

export default feature
