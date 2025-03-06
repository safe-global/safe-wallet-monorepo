import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Box, Grid, IconButton, Paper, Stack, SvgIcon, Typography } from '@mui/material'

import CheckWallet from '@/components/common/CheckWallet'
import ExternalLink from '@/components/common/ExternalLink'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveGuardFlow } from '@/components/tx-flow/flows'
import { HelpCenterArticle } from '@/config/constants'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import DeleteIcon from '@/public/images/common/delete.svg'
import { hasSafeFeature } from '@/utils/safe-versions'
import { SAFE_FEATURES } from '@safe-global/protocol-kit/dist/src/utils/safeVersions'
import dynamic from 'next/dynamic'
import { useContext } from 'react'
import css from './styles.module.css'

const SafenetGuardDisplay = dynamic(() =>
  import('@/features/safenet/components/SafenetContractDisplay').then((module) => module.SafenetGuardDisplay),
)

const NoTransactionGuard = () => {
  return (
    <Typography mt={2} sx={{ color: ({ palette }) => palette.primary.light }}>
      No transaction guard set
    </Typography>
  )
}

const GuardDisplay = ({ guardAddress, chainId }: { guardAddress: string; chainId: string }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <Box className={css.guardDisplay}>
      <EthHashInfo shortAddress={false} address={guardAddress} showCopyButton hasExplorer chainId={chainId} />
      <CheckWallet>
        {(isOk) => (
          <IconButton
            onClick={() => setTxFlow(<RemoveGuardFlow address={guardAddress} />)}
            color="error"
            size="small"
            disabled={!isOk}
          >
            <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
          </IconButton>
        )}
      </CheckWallet>
    </Box>
  )
}

const TransactionGuards = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const isSafenetEnabled = useIsSafenetEnabled()

  const isVersionWithGuards = safeLoaded && hasSafeFeature(SAFE_FEATURES.SAFE_TX_GUARDS, safe.version)

  if (!isVersionWithGuards) {
    return null
  }

  return (
    <Paper sx={{ padding: 4, mb: 2 }}>
      <Grid container direction="row" justifyContent="space-between" spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight={700}>
            Transaction guards
          </Typography>
        </Grid>

        <Grid item xs>
          <Stack spacing={2}>
            <Typography>
              Transaction guards impose additional constraints that are checked prior to executing a Safe transaction.
              Transaction guards are potentially risky, so make sure to only use transaction guards from trusted
              sources. Learn more about transaction guards{' '}
              <ExternalLink href={HelpCenterArticle.TRANSACTION_GUARD}>here</ExternalLink>.
            </Typography>
            {!safe.guard ? (
              <NoTransactionGuard />
            ) : isSafenetEnabled ? (
              <SafenetGuardDisplay
                name={safe.guard.name}
                address={safe.guard.value}
                chainId={safe.chainId}
                showTooltip
              />
            ) : (
              <GuardDisplay guardAddress={safe.guard.value} chainId={safe.chainId} />
            )}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default TransactionGuards
