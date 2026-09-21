import type { NextPage } from 'next'
import Head from 'next/head'
import useTxHistory from '@/hooks/useTxHistory'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ListFilter } from 'lucide-react'
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

        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative inline-flex">
            <PopoverTrigger
              render={
                <Button variant="outline" size="action">
                  <ListFilter />
                  {filter?.type ?? 'Filter'}
                </Button>
              }
            />
            {filter && (
              <span className="absolute -top-0.5 -left-0.5 size-2 rounded-full bg-[var(--color-success-main)]" />
            )}
          </div>

          <PopoverContent
            align="end"
            className="mt-1 w-[min(720px,calc(100vw-2rem))] max-w-[90vw] overflow-visible rounded-xl border border-border bg-card p-0 shadow-md ring-0"
          >
            <TxFilterForm onClose={handleFilterClose} />
          </PopoverContent>
        </Popover>

        {isCsvExportEnabled && <CsvTxExportButton hasActiveFilter={!!filter} />}
      </TxHeader>

      <main>
        <div className="mb-8">
          <PaginatedTxns useTxns={useTxHistory} />
        </div>
      </main>
    </>
  )
}

export default History
