import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { Box } from '@mui/material'
import { useState } from 'react'
import Button from '@mui/material/Button'
import FilterIcon from '@mui/icons-material/FilterList'
import TxFilterForm from '@/components/transactions/TxFilterForm'
import TrustedToggle from '@/components/transactions/TrustedToggle'
import { useTxFilter } from '@/utils/tx-history-filter'
import { BRAND_NAME } from '@/config/constants'
import CsvTxExportButton from '@/components/transactions/CsvTxExportButton'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const History: NextPage = () => {
  const [filter] = useTxFilter()
  const isCsvExportEnabled = useHasFeature(FEATURES.CSV_TX_EXPORT)

  const [showFilter, setShowFilter] = useState(false)

  const toggleFilter = () => {
    setShowFilter((prev) => !prev)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction history`}</title>
      </Head>

      <TxHeader>
        <TrustedToggle />

        <Button
          variant="contained"
          onClick={toggleFilter}
          size="small"
          // endIcon={<ExpandIcon />}
          startIcon={<FilterIcon />}
        >
          {filter?.type ?? 'Filter'}
        </Button>
        {isCsvExportEnabled && <CsvTxExportButton hasActiveFilter={!!filter} />}
      </TxHeader>

      <main>
        {showFilter && <TxFilterForm toggleFilter={toggleFilter} />}

        <Box mb={4}>
          <PaginatedTxns useTxns={useTxHistory} />
        </Box>
      </main>
    </>
  )
}

export default History
