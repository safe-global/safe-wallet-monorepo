import classnames from 'classnames'
import NextLink from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import type { getTxLink } from '@/utils/tx-link'
import css from './styles.module.css'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import Track from '@/components/common/Track'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export type SuccessScreenViewProps = {
  spinner: ReactNode
  statusComponent: ReactNode
  stepper: ReactNode
  error?: Error
  isSwapOrder?: boolean
  txLink?: ReturnType<typeof getTxLink> | '' | null
  nestedSafeHref?: UrlObject
  isSuccess: boolean
  onClose: () => void
}

export const SuccessScreenView = ({
  spinner,
  statusComponent,
  stepper,
  error,
  isSwapOrder,
  txLink,
  nestedSafeHref,
  isSuccess,
  onClose,
}: SuccessScreenViewProps): ReactElement => {
  return (
    <div className="mx-auto w-full max-w-[825px] rounded-lg bg-[var(--color-background-paper)] text-center">
      <div className={css.row}>
        {spinner}
        {statusComponent}
      </div>

      {!error && (
        <>
          <Separator />
          <div className={css.row}>{stepper}</div>
        </>
      )}

      <Separator />

      <div className={classnames(css.row, css.buttons)}>
        {isSwapOrder && (
          <Button data-testid="finish-transaction-btn" variant="outline" size="sm" onClick={onClose}>
            Back to swaps
          </Button>
        )}

        {txLink && (
          <Button
            data-testid="view-transaction-btn"
            variant={isSwapOrder ? 'default' : 'outline'}
            size="sm"
            onClick={onClose}
            render={<NextLink {...txLink} target="_blank" rel="noreferrer" />}
          >
            View transaction
          </Button>
        )}

        {!isSwapOrder &&
          (nestedSafeHref ? (
            <Track {...NESTED_SAFE_EVENTS.OPEN_NESTED_SAFE} label={NESTED_SAFE_LABELS.success_screen}>
              <Button
                data-testid="open-nested-safe-btn"
                variant="default"
                size="sm"
                onClick={onClose}
                disabled={!isSuccess}
                render={<NextLink href={nestedSafeHref} />}
              >
                Go to Nested Safe
              </Button>
            </Track>
          ) : (
            <Button data-testid="finish-transaction-btn" variant="default" size="sm" onClick={onClose}>
              Finish
            </Button>
          ))}
      </div>
    </div>
  )
}
