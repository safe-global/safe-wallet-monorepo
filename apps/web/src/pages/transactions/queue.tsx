import GnosisPayBanner from '@/features/gnosispay/public/components/GnosisPayBanner'
import GnosisPayQueue from '@/features/gnosispay/public/components/GnosisPayQueue'
import { useId } from 'react'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { BatchExecuteHoverProvider } from '@safe-global/views/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import RecoveryList from '@/features/recovery/public/components/RecoveryList'
import { BRAND_NAME } from '@/config/constants'
import { useIsHypernativeEligible } from '@/features/hypernative/public/hooks/useIsHypernativeEligible'
import { useIsHypernativeQueueScanFeature } from '@/features/hypernative/public/hooks/useIsHypernativeQueueScanFeature'
import { useHnQueueAssessment } from '@/features/hypernative/public/hooks/useHnQueueAssessment'
import HnLoginCard from '@/features/hypernative/public/components/HnLoginCard'

const Queue = () => {
  const showPending = useShowUnsignedQueue()
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
          {showHnLoginCard && <HnLoginCard />}
          <BatchExecuteButton />
        </TxHeader>

        <main>
          <div className="mb-8">
            <GnosisPayBanner />

            <RecoveryList />

            <GnosisPayQueue />

            {/* Pending unsigned transactions */}
            {showPending && (
              <PaginatedTxns
                useTxns={usePendingTxsQueue}
                onPagesChange={(pages) => setQueuePages(pages, pendingSourceId)}
              />
            )}

            {/* The main queue of signed transactions */}
            <PaginatedTxns useTxns={useTxQueue} onPagesChange={(pages) => setQueuePages(pages, queueSourceId)} />
          </div>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
