import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { Box, SvgIcon } from '@mui/material'
import ExportIcon from '@/public/images/common/export.svg'
import { useState } from 'react'
import Button from '@mui/material/Button'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TxFilterForm from '@/components/transactions/TxFilterForm'
import TrustedToggle from '@/components/transactions/TrustedToggle'
import { useTxFilter } from '@/utils/tx-history-filter'
import { BRAND_NAME } from '@/config/constants'
import CsvExportModal from '@/components/transactions/CsvExportModal'

const History: NextPage = () => {
  const [filter] = useTxFilter()

  const [showFilter, setShowFilter] = useState(false)
  const [openExportModal, setOpenExportModal] = useState(false)

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
          endIcon={<SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />}
        >
          Export CSV
        </Button>
      </TxHeader>

      <main>
        {showFilter && <TxFilterForm toggleFilter={toggleFilter} />}

        <Box mb={4}>
          <PaginatedTxns useTxns={useTxHistory} />
        </Box>
      </main>
      {openExportModal && <CsvExportModal onClose={() => setOpenExportModal(false)} hasActiveFilter={!!filter} />}
    </>
  )
}

export default History
