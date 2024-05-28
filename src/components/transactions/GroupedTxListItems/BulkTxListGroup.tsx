import type { ReactElement } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import type { Transaction } from '@safe-global/safe-gateway-typescript-sdk'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@/config/constants'

const Disclaimer = () => (
  <Typography>
    <b>Conflicting transactions</b>. Executing one will automatically replace the others.{' '}
    <ExternalLink
      href={HelpCenterArticle.CONFLICTING_TRANSACTIONS}
      title="Why are transactions with the same nonce conflicting with each other?"
      noIcon
    >
      Why did this happen?
    </ExternalLink>
  </Typography>
)

const TxGroup = ({ groupedListItems }: { groupedListItems: Transaction[] }): ReactElement => {
  const nonce = isMultisigExecutionInfo(groupedListItems[0].transaction.executionInfo)
    ? groupedListItems[0].transaction.executionInfo.nonce
    : undefined

  const isConflictGroup =
    groupedListItems.filter((item) => isMultisigExecutionInfo(item.transaction.executionInfo)).length > 0

  return (
    <Paper className={css.container}>
      <Typography gridArea="nonce">{nonce}</Typography>

      <Box gridArea="warning" className={css.disclaimerContainer}>
        <Disclaimer />
      </Box>

      <Box gridArea="line" className={css.line} />

      <Box gridArea="items" className={css.txItems}>
        {groupedListItems.map((tx) => (
          <div key={tx.transaction.id}>
            <ExpandableTransactionItem item={tx} isGrouped />
          </div>
        ))}
      </Box>
    </Paper>
  )
}

const GroupedTxListItems = ({
  groupedListItems,
  transactionHash,
}: {
  groupedListItems: Transaction[]
  transactionHash: string
}): ReactElement | null => {
  if (groupedListItems.length === 0) return null

  return <TxGroup groupedListItems={groupedListItems} />
}

export default GroupedTxListItems
