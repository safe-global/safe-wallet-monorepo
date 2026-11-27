import { useEffect, useRef, useState } from 'react'

import type { ReportsPageProps } from '@safe-global/views/features/spaces/components/Reports/ReportsPage'

import { toCsv } from '../reportCsv'
import type { ReportScenario } from '../reportScenario'
import type { Snapshot } from '../reportSnapshots'
import { reportFileName, toBalanceStatement } from '../reportView'

const PREPARE_MS = 900

const EXPORT_ERRORS: Partial<Record<ReportScenario, string>> = {
  exportFails: 'Export failed. Nothing was downloaded. Try again.',
  exportLimitReached: 'You reached the export limit. Try again in 10 minutes.',
}

const saveFile = (name: string, content: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

type ReportExport = Pick<
  ReportsPageProps,
  'exportingRowId' | 'exportError' | 'statement' | 'onExport' | 'onCloseStatement' | 'onDownload'
>

export const useReportExport = (scenario: ReportScenario, snapshots: Snapshot[]): ReportExport => {
  const [exportingRowId, setExportingRowId] = useState<string>()
  const [exportError, setExportError] = useState<string>()
  const [openSnapshotId, setOpenSnapshotId] = useState<string>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const openSnapshot = snapshots.find((snapshot) => snapshot.month.id === openSnapshotId)

  return {
    exportingRowId,
    exportError,
    statement: openSnapshot && toBalanceStatement(openSnapshot),
    onExport: (id) => {
      setExportError(undefined)
      setExportingRowId(id)
      timer.current = setTimeout(() => {
        setExportingRowId(undefined)
        const error = EXPORT_ERRORS[scenario]
        if (error) setExportError(error)
        else setOpenSnapshotId(id)
      }, PREPARE_MS)
    },
    onCloseStatement: () => setOpenSnapshotId(undefined),
    onDownload: () => openSnapshot && saveFile(reportFileName(openSnapshot), toCsv(openSnapshot)),
  }
}
