import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { Box, CircularProgress, SvgIcon } from '@mui/material'
import ExportIcon from '@/public/images/common/export.svg'
import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TxFilterForm from '@/components/transactions/TxFilterForm'
import TrustedToggle from '@/components/transactions/TrustedToggle'
import { useTxFilter } from '@/utils/tx-history-filter'
import { BRAND_NAME } from '@/config/constants'
import CsvExportModal from '@/components/transactions/CsvExportModal'
import { useCsvExportGetExportStatusV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/csv-export'

const History: NextPage = () => {
  const [filter] = useTxFilter()

  const [showFilter, setShowFilter] = useState(false)
  const [openExportModal, setOpenExportModal] = useState(false)
  const [exportJobId, setExportJobId] = useState<string | null>(null)
  const [exportTimeout, setExportTimeout] = useState<NodeJS.Timeout | null>(null)

  const { data: exportStatus, error } = useCsvExportGetExportStatusV1Query(
    { jobId: exportJobId as string },
    { skip: !exportJobId, pollingInterval: 2000 },
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
    if (!exportStatus && !error) return

    const url = (exportStatus?.returnValue as { downloadUrl?: string })?.downloadUrl
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      setExportJobId(null)
    } else if (error || exportStatus?.failedReason) {
      //TODO show error notification
      console.error('CSV export failed')
      setExportJobId(null)
    }
  }, [exportStatus, error])

  const toggleFilter = () => {
    setShowFilter((prev) => !prev)
  }

  const ExpandIcon = showFilter ? ExpandLessIcon : ExpandMoreIcon
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction history`}</title>
      </Head>

      <TxHeader>
        <TrustedToggle />

        <Button variant="outlined" onClick={toggleFilter} size="small" endIcon={<ExpandIcon />}>
          {filter?.type ?? 'Filter'}
        </Button>
        <Button
          variant="contained" //TODO looks smaller than outlined
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
      </TxHeader>

      <main>
        {showFilter && <TxFilterForm toggleFilter={toggleFilter} />}

        <Box mb={4}>
          <PaginatedTxns useTxns={useTxHistory} />
        </Box>
      </main>

      {openExportModal && (
        <CsvExportModal
          onClose={() => setOpenExportModal(false)}
          hasActiveFilter={!!filter}
          onExport={(job) => setExportJobId(job.id)}
        />
      )}
    </>
  )
}

export default History
