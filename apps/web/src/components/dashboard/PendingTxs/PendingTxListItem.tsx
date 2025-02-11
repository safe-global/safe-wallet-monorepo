import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import ChevronRight from '@mui/icons-material/ChevronRight'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box } from '@mui/material'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import TxInfo from '@/components/transactions/TxInfo'
import TxType from '@/components/transactions/TxType'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import TxConfirmations from '@/components/transactions/TxConfirmations'

type PendingTxType = {
  transaction: TransactionSummary
}

const PendingTx = ({ transaction }: PendingTxType): ReactElement => {
  const router = useRouter()
  const { id } = transaction

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.tx,
      query: {
        id,
        safe: router.query.safe,
      },
    }),
    [router, id],
  )

  return (
    <NextLink data-testid="tx-pending-item" href={url} passHref>
      <Box className={css.container}>
        <Box className={css.innerContainer}>
          <Box sx={{ minWidth: 30 }}>
            {isMultisigExecutionInfo(transaction.executionInfo) && transaction.executionInfo.nonce}
          </Box>

          <Box sx={{ minWidth: 62 }}>
            <TxType tx={transaction} />
          </Box>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <TxInfo info={transaction.txInfo} />
          </Box>
        </Box>

        <Box alignSelf="flex-start" display="flex" flexWrap="nowrap" alignItems="center" gap={1.5}>
          {isMultisigExecutionInfo(transaction.executionInfo) && (
            <TxConfirmations
              submittedConfirmations={transaction.executionInfo.confirmationsSubmitted}
              requiredConfirmations={transaction.executionInfo.confirmationsRequired}
            />
          )}

          <ChevronRight color="border" />
        </Box>
      </Box>
    </NextLink>
  )
}

export default PendingTx
