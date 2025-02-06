import ExplorerButton from '@/components/common/ExplorerButton'
import { AppRoutes } from '@/config/routes'
import useAsync from '@/hooks/useAsync'
import { useChain } from '@/hooks/useChains'
import { type SafenetTransactionDetails } from '@/store/safenet'
import { getModuleTransactions } from '@safe-global/safe-gateway-typescript-sdk'

import Link from 'next/link'

export const SafenetSettlementLink = ({ debit }: { debit: SafenetTransactionDetails['debits'][number] }) => {
  const chainConfig = useChain(debit.chainId.toString())
  const [moduleTxs] = useAsync(async () => {
    if (!debit.executionTxHash) {
      return undefined
    }
    return getModuleTransactions(debit.chainId.toString(), debit.safe, { transaction_hash: debit.executionTxHash })
  }, [debit.chainId, debit.executionTxHash, debit.safe])

  if (!chainConfig || !moduleTxs || moduleTxs.results.length === 0) {
    return null
  }
  const firstTx = moduleTxs.results[moduleTxs.results.length - 1]
  return (
    <Link
      passHref
      href={{
        pathname: AppRoutes.transactions.tx,
        query: {
          safe: `${chainConfig.shortName}:${debit.safe}`,
          id: firstTx.transaction.id,
        },
      }}
      legacyBehavior
    >
      <ExplorerButton isCompact={false} label="View settlement" />
    </Link>
  )
}
