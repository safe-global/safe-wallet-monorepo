import type { ReactElement } from 'react'
import RecoverAccountReview from '@/features/recovery/public/components/RecoverAccountReview'
import type { RecoverAccountFlowProps } from '.'
import { RecoverAccountFlowFields } from '.'

export function RecoverAccountFlowReview({ params }: { params: RecoverAccountFlowProps }): ReactElement | null {
  return (
    <RecoverAccountReview
      threshold={params[RecoverAccountFlowFields.threshold]}
      owners={params[RecoverAccountFlowFields.owners]}
    />
  )
}
