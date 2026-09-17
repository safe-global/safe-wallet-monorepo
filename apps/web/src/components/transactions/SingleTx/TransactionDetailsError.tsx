import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia } from '@/components/ui/empty'
import { cn } from '@/utils/cn'
import css from './TransactionDetailsError.module.css'

export const TX_DETAILS_LOAD_ERROR = 'The website failed to load data. Please try again.'

const TransactionDetailsError = ({
  message = TX_DETAILS_LOAD_ERROR,
  onReload,
}: {
  message?: string
  /** Omitted when reloading cannot recover the state, e.g. a tx belonging to another Safe. */
  onReload?: () => void
}): ReactElement => (
  <Empty data-testid="tx-details-error">
    <EmptyMedia>
      <span className="relative flex items-center justify-center">
        <span aria-hidden className={cn('absolute size-40 rounded-full', css.halo)} />
        <img src="/images/logo-no-text.svg" alt="" className="size-[72px] dark:hidden" />
        <span aria-hidden className={cn('hidden size-[72px] dark:block', css.logoDarkFill)} />
      </span>
    </EmptyMedia>

    <EmptyDescription>{message}</EmptyDescription>

    {onReload && (
      <EmptyContent>
        <Button variant="outline" onClick={onReload}>
          Reload
        </Button>
      </EmptyContent>
    )}
  </Empty>
)

export default TransactionDetailsError
