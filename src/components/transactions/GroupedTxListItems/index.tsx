import { ReactElement, useContext } from 'react'
import { Box, Link, Paper, Typography } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Transaction } from '@gnosis.pm/safe-react-gateway-sdk'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import css from './styles.module.css'
import { WillReplaceContext, WillReplaceProvider } from './WillReplaceProvider'

const Disclaimer = ({ nonce }: { nonce?: number }) => (
  <Box className={css.disclaimerContainer}>
    <Typography alignSelf="flex-start">{nonce}</Typography>
    <Typography>
      These transactions conflict as they use the same nonce. Executing one will automatically replace the other(s).
    </Typography>

    <Link
      href="https://help.gnosis-safe.io/en/articles/4730252-why-are-transactions-with-the-same-nonce-conflicting-with-each-other"
      target="_blank"
      rel="noreferrer"
      title="Why are transactions with the same nonce conflicting with each other?"
      className={css.link}
    >
      Learn more
      <OpenInNewRoundedIcon fontSize="small" />
    </Link>
  </Box>
)

const TxGroup = ({ groupedListItems }: { groupedListItems: Transaction[] }): ReactElement => {
  const nonce = isMultisigExecutionInfo(groupedListItems[0].transaction.executionInfo)
    ? groupedListItems[0].transaction.executionInfo.nonce
    : undefined

  const { willReplace } = useContext(WillReplaceContext)

  return (
    <Paper className={css.container} variant="outlined">
      <Disclaimer nonce={nonce} />
      {groupedListItems.map((tx) => (
        <div key={tx.transaction.id} className={willReplace.includes(tx.transaction.id) ? css.willBeReplaced : ''}>
          <ExpandableTransactionItem item={tx} isGrouped />
        </div>
      ))}
    </Paper>
  )
}

const GroupedTxListItems = ({ groupedListItems }: { groupedListItems: Transaction[] }): ReactElement => {
  return (
    <WillReplaceProvider groupedListItems={groupedListItems}>
      <TxGroup groupedListItems={groupedListItems} />
    </WillReplaceProvider>
  )
}

export default GroupedTxListItems
