import type { ComponentProps, ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import ExternalLink from '@/components/common/ExternalLink'

export type ExecTransactionViewProps = {
  decodedNestedTxDataBlock?: ReactNode
  openSafeHref?: ComponentProps<typeof Link>['href']
  hasError: boolean
  renderErrorMessage: (children: ReactNode) => ReactNode
}

export const ExecTransactionView = ({
  decodedNestedTxDataBlock,
  openSafeHref,
  hasError,
  renderErrorMessage,
}: ExecTransactionViewProps): ReactElement => {
  return decodedNestedTxDataBlock ? (
    <>
      {decodedNestedTxDataBlock}

      {openSafeHref && (
        <div>
          <Link href={openSafeHref} passHref legacyBehavior>
            <ExternalLink>Open Safe</ExternalLink>
          </Link>
        </div>
      )}
    </>
  ) : hasError ? (
    <>{renderErrorMessage('Could not load details on executed transaction.')}</>
  ) : (
    <Skeleton className="h-5 w-full" />
  )
}
