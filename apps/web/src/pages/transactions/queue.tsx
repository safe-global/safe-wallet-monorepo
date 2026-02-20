import { useId } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { Box, Skeleton } from '@mui/material'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import {
  useIsHypernativeEligible,
  useIsHypernativeQueueScanFeature,
  useBannerVisibility,
  BannerType,
  HnBannerForQueue,
  HypernativeFeature,
  useHnQueueAssessment,
} from '@/features/hypernative'

const Queue: NextPage = () => {
  const { RecoveryList } = useLoadFeature(RecoveryFeature)
  const showPending = useShowUnsignedQueue()
  const hn = useLoadFeature(HypernativeFeature)
  const { showBanner: showHnBanner, loading: hnLoading } = useBannerVisibility(BannerType.Promo)
  const { isHypernativeEligible, loading: eligibilityLoading } = useIsHypernativeEligible()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()
  const { setPages: setQueuePages } = useHnQueueAssessment()

  const pendingSourceId = useId()
  const queueSourceId = useId()

  const showHnLoginCard = !eligibilityLoading && isHypernativeEligible && isHypernativeQueueScanEnabled

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction queue`}</title>
      </Head>

      <BatchExecuteHoverProvider>
        <TxHeader>
          {showHnLoginCard && <hn.HnLoginCard />}
          <BatchExecuteButton />
        </TxHeader>

        <main>
          <Box mb={4}>
            {hnLoading && (
              <Box mb={3}>
                <Skeleton variant="rounded" height={30} />
              </Box>
            )}
            {showHnBanner && !hnLoading && (
              <Box mb={3}>
                <HnBannerForQueue />
              </Box>
            )}

            <RecoveryList />

            {/* Pending unsigned transactions */}
            {showPending && (
              <PaginatedTxns
                useTxns={usePendingTxsQueue}
                onPagesChange={(pages) => setQueuePages(pages, pendingSourceId)}
              />
            )}

            {/* The main queue of signed transactions */}
            <PaginatedTxns useTxns={useTxQueue} onPagesChange={(pages) => setQueuePages(pages, queueSourceId)} />
          </Box>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
