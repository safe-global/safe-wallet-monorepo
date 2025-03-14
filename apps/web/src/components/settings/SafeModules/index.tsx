import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Box, Grid, IconButton, Paper, SvgIcon, Typography } from '@mui/material'

import CheckWallet from '@/components/common/CheckWallet'
import ExternalLink from '@/components/common/ExternalLink'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveModuleFlow, RemoveRecoveryFlow } from '@/components/tx-flow/flows'
import useRecovery from '@/features/recovery/hooks/useRecovery'
import { selectDelayModifierByAddress } from '@/features/recovery/services/selectors'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import DeleteIcon from '@/public/images/common/delete.svg'
import dynamic from 'next/dynamic'
import { useContext } from 'react'
import css from '../TransactionGuards/styles.module.css'

const SafenetModuleDisplay = dynamic(() =>
  import('@/features/safenet/components/SafenetContractDisplay').then((module) => module.SafenetModuleDisplay),
)

const NoModules = () => {
  return (
    <Typography mt={2} sx={{ color: ({ palette }) => palette.primary.light }}>
      No modules enabled
    </Typography>
  )
}

const ModuleDisplay = ({ moduleAddress, chainId, name }: { moduleAddress: string; chainId: string; name?: string }) => {
  const { setTxFlow } = useContext(TxModalContext)
  const [recovery] = useRecovery()
  const delayModifier = recovery && selectDelayModifierByAddress(recovery, moduleAddress)

  const onRemove = () => {
    if (delayModifier) {
      setTxFlow(<RemoveRecoveryFlow delayModifier={delayModifier} />)
    } else {
      setTxFlow(<RemoveModuleFlow address={moduleAddress} />)
    }
  }

  return (
    <Box className={css.guardDisplay}>
      <EthHashInfo
        name={name}
        shortAddress={false}
        address={moduleAddress}
        showCopyButton
        chainId={chainId}
        hasExplorer
      />
      <CheckWallet>
        {(isOk) => (
          <IconButton
            data-testid="module-remove-btn"
            onClick={onRemove}
            color="error"
            size="small"
            disabled={!isOk}
            title="Remove module"
          >
            <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
          </IconButton>
        )}
      </CheckWallet>
    </Box>
  )
}

const SafeModules = () => {
  const { safe } = useSafeInfo()
  const safeModules = safe.modules || []
  const isSafenetEnabled = useIsSafenetEnabled()

  return (
    <Paper sx={{ padding: 4, mb: 2 }}>
      <Grid container direction="row" justifyContent="space-between" spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight={700}>
            Safe modules
          </Typography>
        </Grid>

        <Grid item xs>
          <Box>
            <Typography>
              Modules allow you to customize the access-control logic of your Safe Account. Modules are potentially
              risky, so make sure to only use modules from trusted sources. Learn more about modules{' '}
              <ExternalLink href="https://docs.safe.global/safe-core-protocol/plugins">here</ExternalLink>
            </Typography>
            {safeModules.length === 0 ? (
              <NoModules />
            ) : isSafenetEnabled ? (
              <SafenetModuleDisplay
                name={safeModules[0].name}
                address={safeModules[0].value}
                chainId={safe.chainId}
                showTooltip
              />
            ) : (
              safeModules.map((module) => (
                <ModuleDisplay
                  key={module.value}
                  chainId={safe.chainId}
                  moduleAddress={module.value}
                  name={module.name}
                />
              ))
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SafeModules
