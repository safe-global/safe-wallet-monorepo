import { useState, useEffect } from 'react'
import { Box, Container, Paper, Stack, SvgIcon, Typography } from '@mui/material'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import EthHashInfo from '@/components/common/EthHashInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useAddressBook from '@/hooks/useAddressBook'
import NestedSafeIcon from '@/public/images/transactions/nestedTx.svg'
import ArrowDownIcon from '@/public/images/common/arrow-down.svg'

import css from './styles.module.css'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import ExternalLink from '@/components/common/ExternalLink'
import { MODALS_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'
import { useCurrentChain } from '@/hooks/useChains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

type Props = {
  txId: string
}
const NestedTxSuccessScreen = ({ txId }: Props) => {
  const addressBook = useAddressBook()

  // _pendingTx eventually clears from the store, so we need to cache it
  const _pendingTx = useAppSelector((state) => (txId ? selectPendingTxById(state, txId) : undefined))
  const [cachedPendingTx, setCachedPendingTx] = useState(_pendingTx)
  useEffect(() => {
    if (_pendingTx) {
      setCachedPendingTx(_pendingTx)
    }
  }, [_pendingTx])

  const chain = useCurrentChain()

  // When the parent executed immediately (threshold 1), `txHashOrParentSafeTxHash` is a real
  // on-chain tx hash → link to the block explorer. Otherwise it is the parent's safeTxHash of a
  // queued tx → deep-link to the parent's transaction detail so it can be confirmed.
  const isExecuted = cachedPendingTx?.status === PendingStatus.NESTED_SIGNING && cachedPendingTx.executed
  const explorerLink =
    isExecuted && chain
      ? getExplorerLink(cachedPendingTx.txHashOrParentSafeTxHash, chain.blockExplorerUriTemplate)
      : undefined

  if (cachedPendingTx?.status !== PendingStatus.NESTED_SIGNING) {
    return <ErrorMessage>No transaction data found</ErrorMessage>
  }

  const currentSafeAddress = addressBook[cachedPendingTx.safeAddress]
  const parentSafeAddress = addressBook[cachedPendingTx.signerAddress]
  const isExecTransaction = cachedPendingTx.method === 'execTransaction'

  return (
    <Container
      component={Paper}
      disableGutters
      sx={{
        textAlign: 'center',
        maxWidth: `${900 - 75}px`, // md={11}
      }}
      maxWidth={false}
    >
      <Box padding={3} mt={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Box className={css.icon}>
          <SvgIcon component={NestedSafeIcon} inheritViewBox fontSize="large" alt="Nested Safe" />
        </Box>
        <Typography data-testid="transaction-status" variant="h6" marginTop={2} fontWeight={700}>
          {isExecuted ? 'Transaction submitted' : 'One more step in the parent Safe'}
        </Typography>
        <Typography variant="body2" mb={3}>
          {isExecuted
            ? 'The parent Safe executed this transaction on-chain.'
            : isExecTransaction
              ? "Executing as the parent Safe created a transaction inside it. The parent Safe's owners still need to confirm and execute that transaction before this Safe's transaction runs."
              : "Signing as the parent Safe created an approval transaction inside it. The parent Safe's owners still need to confirm and execute that transaction before it signs this Safe's transaction."}
        </Typography>
        <Stack spacing={2} width="70%">
          <Box display="flex" flexDirection="column" alignItems="start" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Parent Safe
            </Typography>
            <EthHashInfo address={cachedPendingTx.signerAddress} name={parentSafeAddress} shortAddress={false} />
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" pl={1}>
            <SvgIcon component={ArrowDownIcon} fontSize="medium" color="border" inheritViewBox />
            <Typography
              component="code"
              variant="body2"
              color="primary.light"
              sx={{
                backgroundColor: 'background.main',
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {cachedPendingTx.method}
            </Typography>
          </Stack>
          <Box display="flex" flexDirection="column" alignItems="start" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Current Safe
            </Typography>
            <EthHashInfo address={cachedPendingTx.safeAddress} name={currentSafeAddress} shortAddress={false} />
          </Box>
        </Stack>
        <Track {...MODALS_EVENTS.OPEN_PARENT_TX}>
          {explorerLink ? (
            <ExternalLink href={explorerLink.href} mode="button">
              Open the transaction
            </ExternalLink>
          ) : (
            <Link
              href={{
                pathname: AppRoutes.transactions.tx,
                query: {
                  safe: cachedPendingTx.signerAddress,
                  chainId: cachedPendingTx.chainId,
                  id: cachedPendingTx.txHashOrParentSafeTxHash,
                },
              }}
              passHref
              legacyBehavior
            >
              <ExternalLink mode="button">Open the transaction</ExternalLink>
            </Link>
          )}
        </Track>
      </Box>
    </Container>
  )
}

export default NestedTxSuccessScreen
