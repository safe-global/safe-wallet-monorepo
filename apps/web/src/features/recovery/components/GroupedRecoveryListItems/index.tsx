import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Box, Paper, Typography } from '@mui/material'
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
    <Box
      className={css.disclaimerContainer}
      sx={{ bgcolor: ({ palette }) => `${palette.warning.background} !important` }}
    >
      <Typography>
        <Typography component="span" fontWeight={700}>
          Cancelling {isMalicious ? 'malicious transaction' : 'Account recovery'}.
        </Typography>{' '}
        You will need to execute the cancellation.{' '}
        <Track {...RECOVERY_EVENTS.LEARN_MORE} label="tx-queue">
          <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
            Learn more
          </ExternalLink>
        </Track>
      </Typography>
    </Box>
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
    <Paper className={[css.container, customCss.recoveryGroupContainer].join(' ')}>
      <Box gridArea="warning" className={css.disclaimerContainer}>
        <Disclaimer isMalicious={isMalicious} />
      </Box>

      <Box gridArea="line" className={css.line} />

      <Box gridArea="items" className={css.txItems}>
        {cancellations.map((tx) => (
          <div key={tx.transaction.id}>
            <ExpandableTransactionItem item={tx} />
          </div>
        ))}

        {recoveries.map((recovery) => (
          <RecoveryListItem key={recovery.transactionHash} item={recovery} />
        ))}
      </Box>
    </Paper>
  )
}
