import ExplorerButton from '@/components/common/ExplorerButton'
import TransferTxInfo from '@/components/transactions/TxDetails/TxData/Transfer'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useGetSafenetTransactionDetailsBySettlementQuery } from '@/store/safenet'
import { Box, Typography } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query'
import { TransactionInfoType, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import Link from 'next/link'
import GradientBoxSafenet from '../GradientBoxSafenet'

const SafenetTransactionLink = ({ data }: { data: TransactionDetails }) => {
  const chainId = useChainId()

  const { configs } = useChains()
  const { data: safenetTransaction } = useGetSafenetTransactionDetailsBySettlementQuery(
    data.txHash ? { chainId, settlementTxHash: data.txHash } : skipToken,
  )
  const shortName = safenetTransaction
    ? configs.find((config) => config.chainId === safenetTransaction.chainId.toString())
    : undefined

  if (!safenetTransaction || !shortName) {
    return null
  }

  return (
    <Link
      passHref
      legacyBehavior
      href={{
        pathname: AppRoutes.transactions.tx,
        query: {
          safe: `${shortName}:${safenetTransaction.safe}`,
          id: `multisig_${safenetTransaction.safe}_${safenetTransaction.safeTxHash}`,
        },
      }}
    >
      <ExplorerButton label="View Safenet action" isCompact={false} />
    </Link>
  )
}

export const SafenetSettlement = ({ data }: { data: TransactionDetails }) => {
  return (
    <Box mt={2}>
      <GradientBoxSafenet heading="Settlement transaction">
        <Box p={1}>
          <Typography variant="h5"></Typography>
          {data.txInfo.type === TransactionInfoType.TRANSFER && (
            <TransferTxInfo txInfo={data.txInfo} txStatus={data.txStatus} trusted={true} imitation={false} />
          )}
          <SafenetTransactionLink data={data} />
        </Box>
      </GradientBoxSafenet>
    </Box>
  )
}
