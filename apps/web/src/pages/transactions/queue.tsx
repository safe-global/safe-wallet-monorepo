import { useId } from 'react'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { BatchExecuteHoverProvider } from '@safe-global/views/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import RecoveryList from '@/features/recovery/public/RecoveryList'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { BRAND_NAME } from '@/config/constants'
import { useIsHypernativeEligible } from '@/features/hypernative/hooks/useIsHypernativeEligible'
import { useIsHypernativeQueueScanFeature } from '@/features/hypernative/hooks/useIsHypernativeQueueScanFeature'
import { HypernativeFeature } from '@/features/hypernative'
import { useHnQueueAssessment } from '@/features/hypernative/hooks/useHnQueueAssessment'

const Queue = () => {
  const showPending = useShowUnsignedQueue()
  const hn = useLoadFeature(HypernativeFeature)
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
          <div className="mb-8">
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
          </div>
        </main>
      </BatchExecuteHoverProvider>
    </>
  )
}

export default Queue
