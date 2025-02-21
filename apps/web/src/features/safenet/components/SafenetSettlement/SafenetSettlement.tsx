import ExplorerButton from '@/components/common/ExplorerButton'
import { TransferTx } from '@/components/transactions/TxInfo'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useGetSafenetTransactionDetailsBySettlementQuery } from '@/store/safenet'
import { Box, Stack, Typography } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query'
import { TransactionInfoType, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import Link from 'next/link'
import css from './styles.module.css'

import SafenetToken from '@/public/images/safenet-token.svg'

const SafenetTransactionLink = ({ data }: { data: TransactionDetails }) => {
  const chainId = useChainId()

  const { configs } = useChains()
  const { data: safenetTransaction } = useGetSafenetTransactionDetailsBySettlementQuery(
    data.txHash ? { chainId, settlementTxHash: data.txHash } : skipToken,
  )
  const chainInfo = safenetTransaction
    ? configs.find((config) => config.chainId === safenetTransaction.chainId.toString())
    : undefined

  if (!safenetTransaction || !chainInfo) {
    return null
  }

  return (
    <Box className={css.linkWrapper}>
      <SafenetToken />
      <Link
        passHref
        legacyBehavior
        href={{
          pathname: AppRoutes.transactions.tx,
          query: {
            safe: `${chainInfo.shortName}:${safenetTransaction.safe}`,
            id: `multisig_${safenetTransaction.safe}_${safenetTransaction.safeTxHash}`,
          },
        }}
      >
        <ExplorerButton label="Safenet transaction" isCompact={false} align="start" />
      </Link>
    </Box>
  )
}

const SafenetSettlement = ({ data }: { data: TransactionDetails }) => {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography>Debited</Typography>
        {data.txInfo.type === TransactionInfoType.TRANSFER && (
          <TransferTx info={data.txInfo} omitSign withLogo={false} />
        )}
        <Typography>for</Typography>
        <SafenetTransactionLink data={data} />
      </Stack>
    </Box>
  )
}

export default SafenetSettlement
