import NextLink, { type LinkProps } from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { DateTime } from '@/components/common/DateTime/DateTime'
import css from './styles.module.css'

export type PendingTxListItemViewProps = {
  url: LinkProps['href']
  timestamp: number
  txTypeIcon: ReactNode
  txTypeText: ReactNode
  txInfo: ReactNode
  confirmations?: { submitted: number; required: number }
}

export function PendingTxListItemView({
  url,
  timestamp,
  txTypeIcon,
  txTypeText,
  txInfo,
  confirmations,
}: PendingTxListItemViewProps): ReactElement {
  return (
    <NextLink data-testid="tx-pending-item" href={url} passHref>
      <div className={css.container}>
        <div className="flex min-w-0 flex-row items-center gap-3">
          <div className={css.iconWrapper}>{txTypeIcon}</div>
          <div className="min-w-0">
            <Typography as="div" className={css.txDescription}>
              {txTypeText}
              {txInfo}
            </Typography>
            <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
              <DateTime value={timestamp} showDateTime={false} showTime={false} />
            </Typography>
          </div>
        </div>

        <div className={css.confirmations}>
          {confirmations && (
            <TxConfirmations
              submittedConfirmations={confirmations.submitted}
              requiredConfirmations={confirmations.required}
            />
          )}
        </div>
      </div>
    </NextLink>
  )
}
