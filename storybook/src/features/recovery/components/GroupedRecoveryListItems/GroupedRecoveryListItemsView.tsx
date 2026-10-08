import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'
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

export type GroupedRecoveryListItemsViewProps = {
  isMalicious: boolean
  cancellations: Array<{ key: string; content: ReactNode }>
  recoveries: ReactNode
}

export function GroupedRecoveryListItemsView({
  isMalicious,
  cancellations,
  recoveries,
}: GroupedRecoveryListItemsViewProps): ReactElement {
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
          <div key={tx.key}>{tx.content}</div>
        ))}

        {recoveries}
      </div>
    </div>
  )
}
