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
  QueueAssessmentProvider,
  HypernativeFeature,
} from '@/features/hypernative'
import { useState, useCallback, useMemo } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const Queue: NextPage = () => {
  const { RecoveryList } = useLoadFeature(RecoveryFeature)
  const showPending = useShowUnsignedQueue()
  const hn = useLoadFeature(HypernativeFeature)
  const { showBanner: showHnBanner, loading: hnLoading } = useBannerVisibility(BannerType.Promo)
  const { isHypernativeEligible, loading: eligibilityLoading } = useIsHypernativeEligible()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()

  const showHnLoginCard = !eligibilityLoading && isHypernativeEligible && isHypernativeQueueScanEnabled

  // Collect pages from main queue for assessment provider
  const [mainQueuePages, setMainQueuePages] = useState<(QueuedItemPage | undefined)[]>([])
  const handleMainQueuePagesChange = useCallback((pages: (QueuedItemPage | undefined)[]) => {
    setMainQueuePages(pages)
  }, [])

  const [pendingQueuePages, setPendingQueuePages] = useState<(QueuedItemPage | undefined)[]>([])
  const handlePendingQueuePagesChange = useCallback((pages: (QueuedItemPage | undefined)[]) => {
    setPendingQueuePages(pages)
  }, [])

  // Combine pages (for now just main queue, pending queue can be added later if needed)
  const allPages = useMemo(() => {
    return [...mainQueuePages, ...pendingQueuePages]
  }, [mainQueuePages, pendingQueuePages])

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

            <QueueAssessmentProvider pages={allPages}>
              {/* Pending unsigned transactions */}
              {showPending && (
                <PaginatedTxns useTxns={usePendingTxsQueue} onPagesChange={handlePendingQueuePagesChange} />
              )}

              {/* The main queue of signed transactions */}
              <PaginatedTxns useTxns={useTxQueue} onPagesChange={handleMainQueuePagesChange} />
            </QueueAssessmentProvider>
          </Box>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
