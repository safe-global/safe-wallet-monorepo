import ChainIndicator from '@/components/common/ChainIndicator'
import { SafenetGuardDisplay, SafenetModuleDisplay } from '@/features/safenet/components/SafenetContractDisplay'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import SafenetLogo from '@/public/images/logo-safenet.svg'
import CheckIcon from '@mui/icons-material/Check'
import { Button, Grid, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import useIsSafenetEnabled from '../../hooks/useIsSafenetEnabled'
import DisableSafenetModal from './DisableSafenetModal'
import css from './styles.module.css'

const SafenetEnabled = () => {
  const { safe } = useSafeInfo()
  const { chainId, guard, modules } = safe

  const [openSafenetModal, setOpenSafenetModal] = useState<boolean>(false)

  // This condition should never be met
  if (!guard || !modules) return

  return (
    <Stack spacing={2}>
      <Typography>
        Safenet unlocks a unified and secure experience across networks, so you no longer need to worry about bridging.
      </Typography>
      <Typography>
        Safenet Guard and Module are enabled to enhance security and customization. Modules adjust access control, while
        Guards add extra security checks before transactions.
      </Typography>
      {modules.map((module) => (
        <SafenetModuleDisplay key={module.value} name={module.name} address={module.value} chainId={chainId} />
      ))}
      <SafenetGuardDisplay name={guard.name} address={guard.value} chainId={chainId} />
      <Button
        onClick={() => setOpenSafenetModal(true)}
        variant="outlined"
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        Disable Safenet on
        <ChainIndicator chainId={chainId} className={css.chainIndicator} />
      </Button>
      {openSafenetModal && <DisableSafenetModal onClose={() => setOpenSafenetModal(false)} />}
    </Stack>
  )
}

const SafenetDisabled = () => {
  const chainId = useChainId()

  const enableSafenet = () => {
    // TODO: Handle Safenet opt in
  }

  return (
    <Stack spacing={2}>
      <Typography>
        Safenet unlocks a unified and secure experience across networks, so you no longer need to worry about bridging.
      </Typography>
      <Typography fontWeight={700}>Safenet benefits:</Typography>
      <Stack flexDirection="row" gap={2}>
        <CheckIcon className={css.checkIcon} />
        <Typography>Aggregation of Ethereum&apos;s assets in the unified balance</Typography>
      </Stack>
      <Stack flexDirection="row" gap={2}>
        <CheckIcon className={css.checkIcon} />
        <Typography>Instant cross-chain transactions on Ethereum, without bridging</Typography>
      </Stack>
      <Stack flexDirection="row" gap={2}>
        <CheckIcon className={css.checkIcon} />
        <Typography>Sponsored transactions on Ethereum</Typography>
      </Stack>
      <Button onClick={enableSafenet} variant="contained" size="small" sx={{ alignSelf: 'flex-start' }}>
        Enable Safenet on
        <ChainIndicator chainId={chainId} className={css.chainIndicator} />
      </Button>
    </Stack>
  )
}

const SafenetSettings = () => {
  const isSafenetEnabled = useIsSafenetEnabled()

  return (
    <Paper sx={{ p: 4, mb: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <SafenetLogo />
        </Grid>
        <Grid item xs>
          {isSafenetEnabled ? <SafenetEnabled /> : <SafenetDisabled />}
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SafenetSettings
