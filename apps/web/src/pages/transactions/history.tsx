import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { useState } from 'react'
import TxFilterForm from '@/components/transactions/TxFilterForm'
import TrustedToggle from '@/components/transactions/TrustedToggle'
import { useTxFilter } from '@/utils/tx-history-filter'
import { BRAND_NAME } from '@/config/constants'
import CsvTxExportButton from '@/components/transactions/CsvTxExportButton'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxFilterPopoverView } from '@views/pages/transactions/TxFilterPopoverView'
import { TxListMainView } from '@views/pages/transactions/TxListMainView'

const History: NextPage = () => {
  const [filter] = useTxFilter()
  const isCsvExportEnabled = useHasFeature(FEATURES.CSV_TX_EXPORT)

  const [open, setOpen] = useState(false)

  const handleFilterClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction history`}</title>
      </Head>

      <TxHeader>
        <TrustedToggle />

        <TxFilterPopoverView
          open={open}
          onOpenChange={setOpen}
          hasFilter={!!filter}
          filterType={filter?.type}
          filterForm={<TxFilterForm onClose={handleFilterClose} />}
        />

        {isCsvExportEnabled && <CsvTxExportButton hasActiveFilter={!!filter} />}
      </TxHeader>

      <TxListMainView>
        <PaginatedTxns useTxns={useTxHistory} />
      </TxListMainView>
    </>
  )
}

export default History
