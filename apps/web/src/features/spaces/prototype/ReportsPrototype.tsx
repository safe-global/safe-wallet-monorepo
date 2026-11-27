import { ReportsPage } from '@safe-global/views/features/spaces/components/Reports/ReportsPage'

import { useReport } from './hooks/useReport'
import { useReportExport } from './hooks/useReportExport'
import type { ReportScenario } from './reportScenario'

type ReportsPrototypeProps = {
  scenario?: ReportScenario
  isAdmin?: boolean
  onChoosePlan?: () => void
  onUnavailableAction?: () => void
}

const noop = (): void => undefined

export const ReportsPrototype = ({
  scenario = 'active',
  isAdmin = true,
  onChoosePlan = noop,
  onUnavailableAction = noop,
}: ReportsPrototypeProps) => {
  const { snapshots, ...report } = useReport(scenario, isAdmin)
  const reportExport = useReportExport(scenario, snapshots)

  return (
    <ReportsPage {...report} {...reportExport} onChoosePlan={onChoosePlan} onUnavailableAction={onUnavailableAction} />
  )
}
