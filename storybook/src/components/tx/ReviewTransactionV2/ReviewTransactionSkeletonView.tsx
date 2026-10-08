import type { ReactNode } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'

export type ReviewTransactionSkeletonViewProps = {
  spinner: ReactNode
}

export const ReviewTransactionSkeletonView = ({ spinner }: ReviewTransactionSkeletonViewProps) => (
  <TxCard>
    <div className="mb-10 flex min-h-[38svh] items-center justify-center">{spinner}</div>
  </TxCard>
)
