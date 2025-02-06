import useChainId from '@/hooks/useChainId'
import css from './styles.module.css'
import { useGetSafenetTransactionDetailsQuery, type SafenetTransactionDetails } from '@/store/safenet'
import GradientBoxSafenet from '../GradientBoxSafenet'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  type Palette,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { groupBy } from 'lodash'
import { useMemo } from 'react'
import TokenAmount from '@/components/common/TokenAmount'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import useAsync from '@/hooks/useAsync'
import { TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import ChainIndicator from '@/components/common/ChainIndicator'
import EthHashInfo from '@/components/common/EthHashInfo'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useChain } from '@/hooks/useChains'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import ArrowDownwardIcon from '@/public/images/transactions/incoming.svg'
import { SafenetSettlementLink } from './SafenetSettlementLink'
import { formatTimeInWords } from '@/utils/date'

const CHALLENGE_PERIOD = (60 * 10 + 15) * 1000 // 10mins + 15s delay for indexing / execution

enum SafenetStatus {
  PROCESSING = 'Processing',
  FAILED = 'Failed',
  CHALLENGED = 'Challenged',
  SETTLED = 'Settled',
  PARTIALLY_SETTLED = 'Partially settled',
  AWAITING_SETTLEMENT = 'Awaiting settlement',
}

const PENDING_SAFENET_STATUS = [
  SafenetStatus.PROCESSING,
  SafenetStatus.AWAITING_SETTLEMENT,
  SafenetStatus.PARTIALLY_SETTLED,
  SafenetStatus.CHALLENGED,
]

const getSafenetTransactionStatusColor = (status: SafenetStatus, palette: Palette) => {
  switch (status) {
    case SafenetStatus.SETTLED:
      return palette.success.main
    case SafenetStatus.FAILED:
      return palette.error.main
    case SafenetStatus.CHALLENGED:
    case SafenetStatus.AWAITING_SETTLEMENT:
      return palette.warning.main
    default:
      return palette.primary.main
  }
}

const getDebitStatusColor = (status: SafenetTransactionDetails['debits'][number]['status'], palette: Palette) => {
  switch (status) {
    case 'EXECUTED':
      return palette.success.main
    case 'FAILED':
      return palette.error.main
    case 'CHALLENGED':
      return palette.warning.main
    case 'INITIATED':
    case 'READY':
      return palette.primary.main
  }
}

const mapDebitStatus: Record<SafenetTransactionDetails['debits'][number]['status'], string> = {
  CHALLENGED: 'Challenged',
  EXECUTED: 'Settled',
  FAILED: 'Failed',
  INITIATED: 'Initiated',
  PENDING: 'Pending',
  READY: 'Inititating',
}

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

const DebitRow = ({ debit }: { debit: SafenetTransactionDetails['debits'][number] }) => {
  // We need to fetch the token info on the debit chain
  const [tokenInfo, , isLoading] = useDebitChainTokenInfo(debit.chainId.toString(), debit.token)
  if (isLoading) {
    return <Skeleton />
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
      <ChainIndicator chainId={debit.chainId.toString()} />
      <Stack direction="row">
        <ArrowOutwardIcon />

        <TokenAmount
          value={debit.amount}
          decimals={tokenInfo?.decimals}
          direction={TransferDirection.OUTGOING}
          tokenSymbol={tokenInfo?.symbol}
        />
      </Stack>
      <Typography
        variant="caption"
        fontWeight="bold"
        display="flex"
        alignItems="center"
        textTransform="capitalize"
        gap={1}
        sx={{ color: ({ palette }) => getDebitStatusColor(debit.status, palette) }}
        data-testid="debit-status-label"
      >
        {mapDebitStatus[debit.status]}
      </Typography>
      <Box>
        <EthHashInfo address={debit.safe} chainId={debit.chainId.toString()} avatarSize={24} onlyName />
      </Box>
      <Box>
        {debit.executionTxHash ? (
          <SafenetSettlementLink debit={debit} />
        ) : debit.initAt ? (
          <Typography>~ {formatTimeInWords(new Date(debit.initAt).getTime() + CHALLENGE_PERIOD)}</Typography>
        ) : null}
      </Box>
    </Stack>
  )
}

const SpendRow = ({ spend }: { spend: SafenetTransactionDetails['spends'][number] }) => {
  // Spends use the token address on the Safe's chain
  const [tokenInfo, , isLoading] = useAsync(() => getERC20TokenInfoOnChain(spend.token), [spend.token])
  if (isLoading) {
    return <Skeleton />
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <ArrowDownwardIcon />
      <TokenAmount
        value={spend.amount}
        decimals={tokenInfo?.decimals}
        direction={TransferDirection.INCOMING}
        tokenSymbol={tokenInfo?.symbol}
      />
    </Stack>
  )
}

/**
 * To simplify following a Safenet action this function boils down the tx details to one status label
 *
 * Options are:
 * - Processing (tx is not executed yet)
 * - Failed (tx failed)
 * - Settled (all debits are executed)
 * - Partially settled (some debits are executed)
 * - Challenged (any debit got challenged)
 * - Awaiting settlement (Ready or initiated)
 *
 * @param details
 * @returns
 */
const useSafenetStatus = (details: SafenetTransactionDetails) => {
  const groupedDebits = useMemo(() => groupBy(details.debits, (debit) => debit.status), [details.debits])
  if (details.status === 'SUBMITTED') {
    return SafenetStatus.PROCESSING
  }
  if (details.status === 'FAILED') {
    return SafenetStatus.FAILED
  }
  // Check settlements
  const totalDebits = details.debits.length

  if (groupedDebits['CHALLENGED']?.length > 0) {
    return SafenetStatus.CHALLENGED
  }

  if (groupedDebits['EXECUTED']?.length === totalDebits) {
    return SafenetStatus.SETTLED
  }

  if (groupedDebits['EXECUTED']?.length > 0) {
    return SafenetStatus.PARTIALLY_SETTLED
  }

  return SafenetStatus.AWAITING_SETTLEMENT
}

const SafenetStatusLabel = ({ details }: { details: SafenetTransactionDetails }) => {
  const status = useSafenetStatus(details)

  return (
    <Typography
      variant="caption"
      fontWeight="bold"
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ color: ({ palette }) => getSafenetTransactionStatusColor(status, palette) }}
      data-testid="safenet-status-label"
    >
      {PENDING_SAFENET_STATUS.includes(status) && <CircularProgress size={14} color="inherit" />}
      {status}
    </Typography>
  )
}

const LoadingTxDetails = () => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="caption" fontWeight="bold">
        Loading
      </Typography>
      <CircularProgress />
    </Stack>
  )
}

const SafenetTransactionDetails = ({ safeTxHash }: { safeTxHash: string }) => {
  const chainId = useChainId()
  const { data, isLoading } = useGetSafenetTransactionDetailsQuery(
    { chainId, safeTxHash },
    {
      pollingInterval: 5000,
    },
  )

  return (
    <GradientBoxSafenet>
      {isLoading ? (
        <LoadingTxDetails />
      ) : (
        <Stack>
          <TxDataRow title="Status">
            {data ? (
              <SafenetStatusLabel details={data} />
            ) : (
              <Typography
                variant="caption"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={1}
                data-testid="safenet-status-label"
              >
                <CircularProgress size={14} color="inherit" />
                Submitting
              </Typography>
            )}
          </TxDataRow>

          <TxDataRow title="Spends">
            <Box className={css.debitContainer}>
              {data ? (
                <Accordion>
                  <AccordionSummary>
                    <Typography fontWeight={700} variant="overline">
                      {data.spends.length} spend{data.spends.length > 1 ? 's' : ''}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.spends.map((spend, idx) => (
                      <SpendRow spend={spend} key={idx} />
                    ))}
                  </AccordionDetails>
                </Accordion>
              ) : (
                '-'
              )}
            </Box>
          </TxDataRow>

          <TxDataRow title="Debits">
            <Box className={css.debitContainer}>
              {data ? (
                <Accordion>
                  <AccordionSummary>
                    <Typography fontWeight={700} variant="overline">
                      {data.debits.length} debit{data.debits.length > 1 ? 's' : ''}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.debits.map((debit, idx) => (
                      <DebitRow debit={debit} key={idx} />
                    ))}
                  </AccordionDetails>
                </Accordion>
              ) : (
                '-'
              )}
            </Box>
          </TxDataRow>
        </Stack>
      )}
    </GradientBoxSafenet>
  )
}
export default SafenetTransactionDetails
