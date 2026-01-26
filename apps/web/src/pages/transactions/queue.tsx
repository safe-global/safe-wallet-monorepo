import type { NextPage } from 'next'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { Box, Skeleton } from '@mui/material'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import RecoveryList from '@/features/recovery/components/RecoveryList'
import { BRAND_NAME } from '@/config/constants'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature, BannerType } from '@/features/hypernative'
import { useState, useCallback, useMemo } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const Queue: NextPage = () => {
  const showPending = useShowUnsignedQueue()
  const hypernative = useLoadFeature(HypernativeFeature)

  // Use hypernative hooks via feature handle
  const bannerVisibility = hypernative?.hooks.useBannerVisibility(BannerType.Promo)
  const showHnBanner = bannerVisibility?.showBanner ?? false
  const hnLoading = bannerVisibility?.loading ?? true

  const eligibility = hypernative?.hooks.useIsHypernativeEligible()
  const isHypernativeEligible = eligibility?.isHypernativeEligible ?? false
  const eligibilityLoading = eligibility?.loading ?? true

  const isHypernativeQueueScanEnabled = hypernative?.hooks.useIsHypernativeQueueScanFeature() ?? false

  const showHnLoginCard = !eligibilityLoading && isHypernativeEligible && isHypernativeQueueScanEnabled && hypernative

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
          {showHnLoginCard && <hypernative.components.HnLoginCard />}
          <BatchExecuteButton />
        </TxHeader>

        <main>
          <Box mb={4}>
            {hnLoading && (
              <Box mb={3}>
                <Skeleton variant="rounded" height={30} />
              </Box>
            )}
            {showHnBanner && !hnLoading && hypernative && (
              <Box mb={3}>
                <hypernative.components.HnBannerForQueue />
              </Box>
            )}

            <RecoveryList />

            {hypernative ? (
              <hypernative.components.QueueAssessmentProvider pages={allPages}>
                {/* Pending unsigned transactions */}
                {showPending && (
                  <PaginatedTxns useTxns={usePendingTxsQueue} onPagesChange={handlePendingQueuePagesChange} />
                )}

                {/* The main queue of signed transactions */}
                <PaginatedTxns useTxns={useTxQueue} onPagesChange={handleMainQueuePagesChange} />
              </hypernative.components.QueueAssessmentProvider>
            ) : (
              <>
                {/* Pending unsigned transactions */}
                {showPending && (
                  <PaginatedTxns useTxns={usePendingTxsQueue} onPagesChange={handlePendingQueuePagesChange} />
                )}

                {/* The main queue of signed transactions */}
                <PaginatedTxns useTxns={useTxQueue} onPagesChange={handleMainQueuePagesChange} />
              </>
            )}
          </Box>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
