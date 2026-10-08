import { type ReactElement, type ReactNode } from 'react'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import classnames from 'classnames'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

/* Between 900px and 1200px the rail collapses to icons only so the transaction card — the point of
   the screen — keeps its width instead of the header wrapping mid-word. `sr-only` rather than
   `hidden` so the step names stay in the accessibility tree at every width. Below 900px
   TxLayoutBase drops the rail entirely. */
const StatusLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={cn('sr-only min-[1200px]:not-sr-only min-[1200px]:truncate text-xs leading-4 font-normal', className)}
  >
    {children}
  </span>
)

export type TxStatusWidgetViewProps = {
  isBatch: boolean
  isMessage: boolean
  isLastStep: boolean
  canConfirm: boolean
  canSign: boolean
  nonceNeeded: boolean | undefined
  confirmationsSubmitted: number
  threshold: number
  hasSigned: boolean
  showSignStep: boolean
  isAwaitingExecution: boolean
}

export const TxStatusWidgetView = ({
  isBatch,
  isMessage,
  isLastStep,
  canConfirm,
  canSign,
  nonceNeeded,
  confirmationsSubmitted,
  threshold,
  hasSigned,
  showSignStep,
  isAwaitingExecution,
}: TxStatusWidgetViewProps): ReactElement => {
  return (
    <div className="bg-transparent">
      <ul className={css.status}>
        <li className={css.item}>
          <span className={css.itemIcon}>
            <CreatedIcon />
          </span>

          <StatusLabel>{isBatch ? 'Queue transactions' : 'Create'}</StatusLabel>
        </li>

        <li className={classnames(css.item, { [css.incomplete]: !canConfirm && !isBatch })}>
          <span className={css.itemIcon}>
            <SignedIcon />
          </span>

          <StatusLabel>
            {isBatch ? (
              'Create batch'
            ) : !nonceNeeded ? (
              'Confirmed'
            ) : isMessage ? (
              'Collect signatures'
            ) : (
              <>
                Confirmed ({confirmationsSubmitted} of {threshold}){canSign && <span className={css.badge}>+1</span>}
              </>
            )}
          </StatusLabel>
        </li>

        {showSignStep && (
          <li className={classnames(css.item, { [css.incomplete]: !hasSigned })}>
            <span className={css.itemIcon}>
              <SignedIcon />
            </span>

            <StatusLabel>Sign</StatusLabel>
          </li>
        )}

        <li className={classnames(css.item, { [css.incomplete]: !(isAwaitingExecution && isLastStep) })}>
          <span className={css.itemIcon}>
            <SignedIcon />
          </span>

          <StatusLabel>{isMessage ? 'Done' : 'Execute'}</StatusLabel>
        </li>
      </ul>
    </div>
  )
}
