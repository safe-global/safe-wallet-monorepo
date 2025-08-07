import { Button, CircularProgress, SvgIcon } from '@mui/material'
import { useCsvExportGetExportStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import ExportIcon from '@/public/images/common/export.svg'
import CsvExportModal from '../CsvExportModal'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

const getExportFileName = () => {
  const today = new Date().toISOString().slice(0, 10)
  return `transaction-export-${today}.csv`
}

type ExportTxProps = {
  hasActiveFilter: boolean
}

const ExportTxButton = ({ hasActiveFilter }: ExportTxProps): ReactElement => {
  const dispatch = useAppDispatch()

  const [openExportModal, setOpenExportModal] = useState(false)
  const [exportJobId, setExportJobId] = useState<string | null>(null)
  const [exportTimeout, setExportTimeout] = useState<NodeJS.Timeout | null>(null)

  const { data: exportStatus, error } = useCsvExportGetExportStatusV1Query(
    { jobId: exportJobId as string },
    { skip: !exportJobId, pollingInterval: 5000 },
  )

  useEffect(() => {
    if (exportJobId && !exportTimeout) {
      // Set a timeout to stop polling after 15 minutes
      const timeout = setTimeout(
        () => {
          setExportJobId(null)
        },
        15 * 60 * 1000,
      )
      setExportTimeout(timeout)
    }
    if (!exportJobId && exportTimeout) {
      clearTimeout(exportTimeout)
      setExportTimeout(null)
    }
    // Cleanup
    return () => {
      if (exportTimeout) {
        clearTimeout(exportTimeout)
      }
    }
  }, [exportJobId, exportTimeout])

  useEffect(() => {
    const triggerDownload = (url: string) => {
      try {
        const link = document.createElement('a')
        link.download = getExportFileName()
        link.href = url

        link.dispatchEvent(new MouseEvent('click'))
      } catch (e) {
        errorNotification()
      }
    }

    const successNotification = () => {
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'export-csv-success',
          title: 'Export successful',
          message: 'Transactions successfully exported to CSV.',
        }),
      )
    }

    const errorNotification = () => {
      dispatch(
        showNotification({
          variant: 'error',
          groupKey: 'export-csv-error',
          title: 'Something went wrong',
          message: 'Please try exporting the CSV again.',
        }),
      )
    }

    if (!exportStatus && !error) return

    const url = (exportStatus?.returnValue as { downloadUrl?: string })?.downloadUrl
    if (url) {
      successNotification()
      triggerDownload(url)
      console.info('Export completed successfully:', url)
      setExportJobId(null)
      return
    }

    if (error || exportStatus?.failedReason) {
      errorNotification()
      setExportJobId(null)
    }
  }, [exportStatus, error, dispatch])

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenExportModal(true)}
        size="small"
        endIcon={
          exportJobId ? (
            <CircularProgress size={16} />
          ) : (
            <SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />
          )
        }
        disabled={!!exportJobId}
      >
        {exportJobId ? 'Exporting' : 'Export CSV'}
      </Button>

      {openExportModal && (
        <CsvExportModal
          onClose={() => setOpenExportModal(false)}
          hasActiveFilter={hasActiveFilter}
          onExport={(job) => setExportJobId(job.id)}
        />
      )}
    </>
  )
}

export default ExportTxButton
