import { type ReactElement } from 'react'
import { Box, Typography, Skeleton, Alert, Accordion, AccordionSummary, AccordionDetails, Link as MuiLink } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Link from 'next/link'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import { useTransactionsGetIncomingTransfersV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useChainId } from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { TxTypeIcon } from '@/components/transactions/TxType'
import TokenAmount from '@/components/common/TokenAmount'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import DateTime from '@/components/common/DateTime'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getTxLink } from '@/utils/tx-link'
import css from './styles.module.css'

type TokenTransactionsProps = {
  tokenAddress: string
  tokenSymbol: string
  tokenDecimals: number
}

/** Display recent transactions for a specific token */
const TokenTransactions = ({ tokenAddress, tokenSymbol }: TokenTransactionsProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const chain = useCurrentChain()

  const { data, isLoading, isError } = useTransactionsGetIncomingTransfersV1Query({
    chainId,
    safeAddress,
    tokenAddress,
    trusted: undefined,
  })

  if (isLoading) {
    return (
      <Box className={css.transactionsContainer}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Transactions
        </Typography>
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={60} sx={{ mb: 1 }} />
          ))}
        </Box>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box className={css.transactionsContainer}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Transactions
        </Typography>
        <Alert severity="error">Failed to load transactions</Alert>
      </Box>
    )
  }

  if (data.results.length === 0) {
    return (
      <Box className={css.transactionsContainer}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No transactions found for this token
        </Typography>
      </Box>
    )
  }

  if (!chain) {
    return (
      <Box className={css.transactionsContainer}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Transactions
        </Typography>
        <Alert severity="error">Chain information not available</Alert>
      </Box>
    )
  }

  return (
    <Box className={css.transactionsContainer}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Recent Transactions
      </Typography>
      <Box>
        {data.results.slice(0, 10).map((transfer, index) => {
          const tx = transfer.transaction

          if (tx.txInfo.type !== 'Transfer') return null

          const transferInfo = tx.txInfo.transferInfo
          if (transferInfo.type !== 'ERC20' && transferInfo.type !== 'NATIVE_COIN') return null

          const txLink = getTxLink(tx.id, chain, safeAddress)

          return (
            <Accordion key={`${tx.id}-${index}`} disableGutters elevation={0} className={css.transactionAccordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className={css.transactionSummaryGrid}
                sx={{
                  minHeight: 'auto',
                  '&.Mui-expanded': { minHeight: 'auto' },
                  '.MuiAccordionSummary-content': {
                    margin: '0',
                    display: 'contents'
                  },
                  '.MuiAccordionSummary-expandIconWrapper': {
                    position: 'absolute',
                    right: 0,
                  }
                }}
              >
                <Box className={css.txTypeIcon}>
                  <TxTypeIcon tx={tx as unknown as TransactionSummary} />
                </Box>

                <Box className={css.txInfo}>
                  <TokenAmount
                    value={transferInfo.value || '0'}
                    decimals={transferInfo.type === 'ERC20' ? transferInfo.decimals ?? undefined : undefined}
                    tokenSymbol={tokenSymbol}
                    logoUri={transferInfo.type === 'ERC20' ? transferInfo.logoUri ?? undefined : undefined}
                    direction={
                      tx.txInfo.direction === 'INCOMING'
                        ? TransferDirection.INCOMING
                        : tx.txInfo.direction === 'OUTGOING'
                          ? TransferDirection.OUTGOING
                          : TransferDirection.UNKNOWN
                    }
                  />
                </Box>

                <Box className={css.txDate}>
                  <DateTime value={tx.timestamp} />
                </Box>

                <Box className={css.txStatus}>
                  <TxStatusLabel tx={tx as unknown as TransactionSummary} />
                </Box>
              </AccordionSummary>

              <AccordionDetails className={css.transactionDetails}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>From:</strong> {shortenAddress(tx.txInfo.sender.value)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>To:</strong> {shortenAddress(tx.txInfo.recipient.value)}
                  </Typography>
                  {tx.txHash && (
                    <Typography variant="body2">
                      <strong>Hash:</strong> {shortenAddress(tx.txHash)}
                    </Typography>
                  )}
                  <MuiLink
                    component={Link}
                    href={txLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 1,
                      cursor: 'pointer',
                    }}
                  >
                    View Transaction <OpenInNewIcon fontSize="small" />
                  </MuiLink>
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </Box>
  )
}

export default TokenTransactions
