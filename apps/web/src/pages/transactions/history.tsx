import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { Badge, Box, Popover } from '@mui/material'
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

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction history`}</title>
      </Head>

      <TxHeader>
        <TrustedToggle />

        <Badge
          variant="dot"
          color="success"
          invisible={!filter}
          sx={{
            '& .MuiBadge-badge': {
              right: 8,
              top: 8,
            },
          }}
        >
          <Button variant="contained" onClick={handleFilterClick} size="small" startIcon={<FilterIcon />}>
            {filter?.type ?? 'Filter'}
          </Button>
        </Badge>
        {isCsvExportEnabled && <CsvTxExportButton hasActiveFilter={!!filter} />}
      </TxHeader>

      <main>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                maxWidth: '90vw',
                width: { xs: '100%', sm: '80%' },
              },
            },
          }}
        >
          <TxFilterForm onClose={handleFilterClose} />
        </Popover>

        <Box mb={4}>
          <PaginatedTxns useTxns={useTxHistory} />
        </Box>
      </main>
    </>
  )
}

export default History
