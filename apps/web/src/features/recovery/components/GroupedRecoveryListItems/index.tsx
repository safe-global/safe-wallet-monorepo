import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Typography } from '@/components/ui/typography'
import partition from 'lodash/partition'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import type { ReactElement } from 'react'
import type { AnyTransactionItem } from '@/utils/tx-list'

import { isRecoveryQueueItem } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import RecoveryListItem from '../RecoveryListItem'
import ExternalLink from '@/components/common/ExternalLink'

import css from '@/components/transactions/GroupedTxListItems/styles.module.css'
import customCss from './styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

function Disclaimer({ isMalicious }: { isMalicious: boolean }): ReactElement {
  return (
    <div className={css.disclaimerContainer}>
      <Typography>
        <span className="font-semibold">Cancelling {isMalicious ? 'malicious transaction' : 'Account recovery'}.</span>{' '}
        You will need to execute the cancellation.{' '}
        <Track {...RECOVERY_EVENTS.LEARN_MORE} label="tx-queue">
          <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
            Learn more
          </ExternalLink>
        </Track>
      </Typography>
    </div>
  )
}

export default function GroupedRecoveryListItems({
  items,
}: {
  items: Array<AnyTransactionItem | RecoveryQueueItem>
}): ReactElement {
  const [recoveries, cancellations] = partition(items, isRecoveryQueueItem) as [
    RecoveryQueueItem[],
    AnyTransactionItem[],
  ]

  // Should only be one recovery item but check array in case
  const isMalicious = recoveries.some((recovery) => recovery.isMalicious)

  return (
    <div
      className={['rounded-xl border border-border bg-card', css.container, customCss.recoveryGroupContainer].join(' ')}
    >
      <div style={{ gridArea: 'warning' }} className={css.disclaimerContainer}>
        <Disclaimer isMalicious={isMalicious} />
      </div>

      <div style={{ gridArea: 'line' }} className={css.line} />

      <div style={{ gridArea: 'items' }} className={css.txItems}>
        {cancellations.map((tx) => (
          <div key={tx.transaction.id}>
            <ExpandableTransactionItem item={tx} />
          </div>
        ))}

        {recoveries.map((recovery) => (
          <RecoveryListItem key={recovery.transactionHash} item={recovery} />
        ))}
      </div>
    </div>
  )
}
