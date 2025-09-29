import { Box, Button, CircularProgress, SvgIcon, Typography } from '@mui/material'
import { useCsvExportGetExportStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'
import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import ExportIcon from '@/public/images/common/export.svg'
import CsvTxExportModal from '../CsvTxExportModal'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { OnboardingTooltip } from '@/components/common/OnboardingTooltip'
import { Chip } from '@/components/common/Chip'
import { useDarkMode } from '@/hooks/useDarkMode'
import OnlyOwner from '@/components/common/OnlyOwner'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

const getCsvExportFileName = () => {
  const today = new Date().toISOString().slice(0, 10)
  return `transaction-export-${today}.csv`
}

const LS_CSVEXPORT_ONBOARDING = 'csvExport_onboarding'

type CsvExportReturnValue = {
  downloadUrl?: string
}

type CsvTxExportProps = {
  hasActiveFilter: boolean
}

const CsvTxExportButton = ({ hasActiveFilter }: CsvTxExportProps): ReactElement => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()

  const [openExportModal, setOpenExportModal] = useState(false)
  const [exportJobId, setExportJobId] = useState<string | null>(null)
  const exportTimeout = useRef<NodeJS.Timeout | null>(null)

  const { data: exportStatus, error } = useCsvExportGetExportStatusV1Query(
    { jobId: exportJobId as string },
    { skip: !exportJobId, pollingInterval: 2000 },
  )

  const chipStyles = isDarkMode
    ? { backgroundColor: 'static.main', color: 'secondary.main' }
    : { backgroundColor: 'secondary.main', color: 'static.main' }

  const onClick = () => {
    setOpenExportModal(true)
    trackEvent(TX_LIST_EVENTS.CSV_EXPORT_CLICKED)
  }

  useEffect(() => {
    if (exportJobId && !exportTimeout.current) {
      // Set a timeout to stop polling after 15 minutes
      const timeout = setTimeout(
        () => {
          setExportJobId(null)
        },
        15 * 60 * 1000,
      )
      exportTimeout.current = timeout
    }
    if (!exportJobId && exportTimeout.current) {
      clearTimeout(exportTimeout.current)
      exportTimeout.current = null
    }
    // Cleanup
    return () => {
      if (exportTimeout.current) {
        clearTimeout(exportTimeout.current)
      }
    }
  }, [exportJobId])

  useEffect(() => {
    const triggerDownload = (url: string) => {
      try {
        const link = document.createElement('a')
        link.download = getCsvExportFileName()
        link.href = url
        link.target = '_blank'

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

    const url = (exportStatus?.returnValue as CsvExportReturnValue)?.downloadUrl
    if (url) {
      successNotification()
      triggerDownload(url)
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
      <OnboardingTooltip
        widgetLocalStorageId={LS_CSVEXPORT_ONBOARDING}
        iconShown={false}
        placement="bottom-end"
        titleProps={{ flexDirection: 'column', alignItems: 'flex-end', maxWidth: 263 }}
        text={
          <Box mt={1}>
            <Chip sx={{ borderRadius: 1, ...chipStyles }} fontWeight="normal" />
            <Typography mt={1} variant="body2">
              Export your transaction history for financial reporting.
            </Typography>
          </Box>
        }
      >
        <div>
          <OnlyOwner placement="top">
            {(isOk) => (
              <Button
                variant="contained"
                onClick={onClick}
                size="small"
                sx={{ height: 38 }}
                endIcon={
                  exportJobId ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />
                  )
                }
                disabled={!isOk || !!exportJobId}
              >
                {exportJobId ? 'Exporting' : 'Export CSV'}
              </Button>
            )}
          </OnlyOwner>
        </div>
      </OnboardingTooltip>

      {openExportModal && (
        <CsvTxExportModal
          onClose={() => setOpenExportModal(false)}
          hasActiveFilter={hasActiveFilter}
          onExport={(job) => setExportJobId(job.id)}
        />
      )}
    </>
  )
}

export default CsvTxExportButton
