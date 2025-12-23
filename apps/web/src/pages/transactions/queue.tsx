import type { NextPage } from 'next'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { Box } from '@mui/material'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import RecoveryList from '@/features/recovery/components/RecoveryList'
import { BRAND_NAME } from '@/config/constants'
import { useBannerVisibility } from '@/features/hypernative/hooks'
import { BannerType } from '@/features/hypernative/hooks/useBannerStorage'
import { HnBannerForQueue } from '@/features/hypernative/components/HnBanner'

const Queue: NextPage = () => {
  const showPending = useShowUnsignedQueue()
  const { showBanner: showHnBanner, loading: hnLoading } = useBannerVisibility(BannerType.Promo)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction queue`}</title>
      </Head>

      <BatchExecuteHoverProvider>
        <TxHeader>
          <BatchExecuteButton />
        </TxHeader>

        <main>
          <Box mb={4}>
            {showHnBanner && !hnLoading && (
              <Box mb={3}>
                <HnBannerForQueue />
              </Box>
            )}

            <RecoveryList />

            {/* Pending unsigned transactions */}
            {showPending && <PaginatedTxns useTxns={usePendingTxsQueue} />}

            {/* The main queue of signed transactions */}
            <PaginatedTxns useTxns={useTxQueue} />
          </Box>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
