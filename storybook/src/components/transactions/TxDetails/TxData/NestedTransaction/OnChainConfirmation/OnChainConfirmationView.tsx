import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export type OnChainConfirmationViewProps = {
  nestedTxData?: ReactNode
  hasError: boolean
  renderErrorMessage: (children: ReactNode) => ReactNode
}

export const OnChainConfirmationView = ({
  nestedTxData,
  hasError,
  renderErrorMessage,
}: OnChainConfirmationViewProps): ReactElement => {
  return nestedTxData ? (
    <>{nestedTxData}</>
  ) : hasError ? (
    <>{renderErrorMessage('Could not load details on hash to approve.')}</>
  ) : (
    <Skeleton className="h-5 w-full" />
  )
}
