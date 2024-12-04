import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import SvgIcon from '@mui/material/SvgIcon'

import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { SAFE_FEATURES } from '@safe-global/protocol-kit/dist/src/utils/safeVersions'
import { hasSafeFeature } from '@/utils/safe-versions'
import { HelpCenterArticle } from '@/config/constants'
import DeleteIcon from '@/public/images/common/delete.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveGuardFlow } from '@/components/tx-flow/flows'

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

  const isVersionWithGuards = safeLoaded && hasSafeFeature(SAFE_FEATURES.SAFE_TX_GUARDS, safe.version)

  if (!isVersionWithGuards) {
    return null
  }

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid container direction="row" justifyContent="space-between" spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight={700}>
            Transaction guards
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              Transaction guards impose additional constraints that are checked prior to executing a Safe transaction.
              Transaction guards are potentially risky, so make sure to only use transaction guards from trusted
              sources. Learn more about transaction guards{' '}
              <ExternalLink href={HelpCenterArticle.TRANSACTION_GUARD}>here</ExternalLink>.
            </Typography>
            {safe.guard ? (
              <GuardDisplay guardAddress={safe.guard.value} chainId={safe.chainId} />
            ) : (
              <NoTransactionGuard />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default TransactionGuards
