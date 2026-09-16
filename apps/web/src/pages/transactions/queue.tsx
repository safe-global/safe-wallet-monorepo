import { useId } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import TxHeader from '@/components/transactions/TxHeader'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { usePendingTxsQueue, useShowUnsignedQueue } from '@/hooks/usePendingTxs'
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import {
  useIsHypernativeEligible,
  useIsHypernativeQueueScanFeature,
  HypernativeFeature,
  useHnQueueAssessment,
} from '@/features/hypernative'

const Queue: NextPage = () => {
  const { RecoveryList } = useLoadFeature(RecoveryFeature)
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
