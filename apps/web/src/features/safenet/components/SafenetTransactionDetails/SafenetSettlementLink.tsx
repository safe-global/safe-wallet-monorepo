import ExplorerButton from '@/components/common/ExplorerButton'
import { AppRoutes } from '@/config/routes'
import useAsync from '@/hooks/useAsync'
import { useChain } from '@/hooks/useChains'
import { type SafenetTransactionDetails } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import { Skeleton } from '@mui/material'
import {
  getModuleTransactions,
  TransactionInfoType,
  TransactionListItemType,
  TransactionTokenType,
} from '@safe-global/safe-gateway-typescript-sdk'

import Link from 'next/link'

export const SafenetSettlementLink = ({ debit }: { debit: SafenetTransactionDetails['debits'][number] }) => {
  const chainConfig = useChain(debit.chainId.toString())
  const [moduleTxs, , isLoading] = useAsync(async () => {
    if (!debit.executionTxHash) {
      return undefined
    }
    return getModuleTransactions(debit.chainId.toString(), debit.safe, { transaction_hash: debit.executionTxHash })
  }, [debit.chainId, debit.executionTxHash, debit.safe])

  if (isLoading) {
    return <Skeleton />
  }

  if (!chainConfig || !moduleTxs || moduleTxs.results.length === 0) {
    return null
  }
  const settlementTx = moduleTxs.results.find(
    (tx) =>
      tx.type === TransactionListItemType.TRANSACTION &&
      tx.transaction.txInfo.type === TransactionInfoType.TRANSFER &&
      tx.transaction.txInfo.transferInfo.type === TransactionTokenType.ERC20 &&
      tx.transaction.txInfo.transferInfo.value === debit.amount &&
      sameAddress(tx.transaction.txInfo.transferInfo.tokenAddress, debit.token),
  )

  // This tx should always be found
  if (!settlementTx) {
    return null
  }

  return (
    <Link
      passHref
      href={{
        pathname: AppRoutes.transactions.tx,
        query: {
          safe: `${chainConfig.shortName}:${debit.safe}`,
          id: settlementTx.transaction.id,
        },
      }}
      legacyBehavior
    >
      <ExplorerButton align="end" isCompact={false} label="View settlement" />
    </Link>
  )
}
