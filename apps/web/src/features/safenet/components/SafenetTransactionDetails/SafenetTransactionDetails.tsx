import useChainId from '@/hooks/useChainId'
import { useGetSafenetTransactionDetailsQuery, type SafenetTransactionDetails } from '@/store/safenet'
import { Box, CircularProgress, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import TokenAmount from '@/components/common/TokenAmount'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import useAsync from '@/hooks/useAsync'
import ChainIndicator from '@/components/common/ChainIndicator'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useChain } from '@/hooks/useChains'
import { SafenetSettlementLink } from './SafenetSettlementLink'
import { formatTimeInWords } from '@/utils/date'
import SafenetIcon from '@/public/images/safenet-token.svg'
import SandclockIcon from '@/public/images/common/sandclock.svg'
import ClockIcon from '@/public/images/common/clock.svg'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import css from './styles.module.css'
import { Divider } from '@/components/tx/DecodedTx'

const CHALLENGE_PERIOD = (60 * 10 + 15) * 1000 // 10mins + 15s delay for indexing / execution

const useDebitChainTokenInfo = (chainId: string, token: string) => {
  const debitChainConfig = useChain(chainId)

  const web3Provider = useMemo(() => {
    if (!debitChainConfig) {
      return undefined
    }
    return createWeb3ReadOnly(debitChainConfig)
  }, [debitChainConfig])

  return useAsync(() => getERC20TokenInfoOnChain(token, web3Provider), [token, web3Provider])
}

const DebitTokenAmount = ({ debit }: { debit: SafenetTransactionDetails['debits'][number] }) => {
  // We need to fetch the token info on the debit chain
  const [tokenInfo, , isLoading] = useDebitChainTokenInfo(debit.chainId.toString(), debit.token)
  if (isLoading) {
    return <Skeleton />
  }

  return <TokenAmount value={debit.amount} decimals={tokenInfo?.decimals} tokenSymbol={tokenInfo?.symbol} />
}

const DebitDetails = ({ debit }: { debit: SafenetTransactionDetails['debits'][number] }) => {
  return (
    <Box>
      {debit.executionTxHash ? (
        <SafenetSettlementLink debit={debit} />
      ) : debit.initAt ? (
        <Box className={css.expectedSettlementPill}>
          <Typography
            variant="caption"
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ color: ({ palette }) => palette.info.main }}
            data-testid="debit-status-label"
          >
            <ClockIcon />
            Settlement {formatTimeInWords(new Date(debit.initAt).getTime() + CHALLENGE_PERIOD)}
          </Typography>
        </Box>
      ) : (
        <Box className={css.awaitingSettlementPill}>
          <Typography
            color="text.secondary"
            variant="caption"
            display="flex"
            alignItems="center"
            gap={1}
            data-testid="debit-status-label"
          >
            <SandclockIcon />
            Awaiting settlement
          </Typography>
        </Box>
      )}
    </Box>
  )
}

const debitHeaderCells = [
  { id: 'chainId', label: 'Debits' },
  { id: 'amount', label: '' },
  { id: 'details', label: '' },
]

const SafenetTransactionDetails = ({ safeTxHash }: { safeTxHash: string }) => {
  const chainId = useChainId()
  const { data, isLoading } = useGetSafenetTransactionDetailsQuery(
    { chainId, safeTxHash },
    {
      pollingInterval: 5000,
    },
  )

  const rows: EnhancedTableProps['rows'] = useMemo(() => {
    return (data?.debits ?? []).map((debit) => ({
      cells: {
        chainId: { rawValue: debit.chainId, content: <ChainIndicator chainId={debit.chainId.toString()} /> },
        amount: {
          rawValue: debit.amount,
          content: <DebitTokenAmount debit={debit} />,
        },
        details: { rawValue: '', content: <DebitDetails debit={debit} /> },
      },
    }))
  }, [data?.debits])

  if (isLoading) {
    return <CircularProgress />
  }

  if (!data) {
    return null
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1}>
        <SafenetIcon />
        <Typography variant="subtitle1" fontWeight={700}>
          Safenet
        </Typography>
      </Stack>
      <EnhancedTable
        rows={rows}
        headCells={debitHeaderCells}
        headerClassName={css.debitTableHead}
        tableClassName={css.debitTable}
      />
      <Divider />
    </Box>
  )
}
export default SafenetTransactionDetails
