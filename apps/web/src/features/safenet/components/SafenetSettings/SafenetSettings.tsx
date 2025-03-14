import ChainIndicator from '@/components/common/ChainIndicator'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import { SafenetGuardDisplay, SafenetModuleDisplay } from '@/features/safenet/components/SafenetContractDisplay'
import useSafeInfo from '@/hooks/useSafeInfo'
import SafenetLogo from '@/public/images/logo-safenet.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { useGetSafenetAccountQuery, useGetSafenetConfigQuery } from '@/store/safenet'
import CheckIcon from '@mui/icons-material/Check'
import { Alert, Box, Button, Grid, Paper, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useContext, useMemo, useState } from 'react'
import useHasSafenetFeature from '../../hooks/useHasSafenetFeature'
import useIsSafenetEnabled from '../../hooks/useIsSafenetEnabled'
import DisableSafenetModal from './DisableSafenetModal'
import css from './styles.module.css'
import { TxModalContext } from '@/components/tx-flow'
import EnableSafenetFlow from '../tx-flow/EnableSafenet'
import { skipToken } from '@reduxjs/toolkit/query'

const MultichainIndicator = ({ chains }: { chains: Pick<ChainInfo, 'chainId'>[] }) => (
  <Tooltip
    title={
      <Box>
        {chains.map((safeItem) => (
          <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
            <ChainIndicator chainId={safeItem.chainId} />
          </Box>
        ))}
      </Box>
    }
    arrow
  >
    <Box className={css.multiChains}>
      <NetworkLogosList networks={chains} showHasMore />
    </Box>
  </Tooltip>
)

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
        <Stack direction="row" gap={1} alignItems="center">
          Disable Safenet on
          <ChainIndicator chainId={chainId} className={css.chainIndicator} />
        </Stack>
      </Button>
      <Stack direction="row" spacing={1}>
        <SvgIcon fontSize="small" component={InfoIcon} inheritViewBox />
        <Typography variant="body2">
          To disable Safenet on other networks, you need to switch to each network individually and disable it
          separately.
        </Typography>
      </Stack>
      {openSafenetModal && <DisableSafenetModal onClose={() => setOpenSafenetModal(false)} />}
    </Stack>
  )
}

const SafenetDisabled = () => {
  const { safe } = useSafeInfo()
  const { chainId, address } = safe
  const hasSafenetFeature = useHasSafenetFeature()
  const isSafenetEnabled = useIsSafenetEnabled()

  const { setTxFlow } = useContext(TxModalContext)

  const { data: safenetAccounts } = useGetSafenetAccountQuery(
    { safeAddress: address.value },
    { skip: !hasSafenetFeature },
  )

  const { data: safenetConfig } = useGetSafenetConfigQuery(hasSafenetFeature ? undefined : skipToken)

  const safenetChains = useMemo(
    () => (safenetAccounts ? safenetAccounts.safes.map((safe) => ({ chainId: safe.chainId.toString() })) : []),
    [safenetAccounts],
  )

  const enableSafenet = () => {
    if (!safenetConfig) {
      return
    }
    setTxFlow(
      <EnableSafenetFlow
        guardAddress={safenetConfig.guards[chainId]}
        moduleAddress={safenetConfig.settlementEngines[chainId]}
      />,
    )
  }

  return (
    <Stack spacing={2}>
      {hasSafenetFeature && !isSafenetEnabled && (
        <Alert icon={<SvgIcon component={InfoIcon} inheritViewBox color="primary" />} className={css.alert}>
          <Stack flexDirection="row" alignItems="center" gap={1}>
            <Typography fontWeight={700}>Safenet is disabled on</Typography>
            <Box className={css.chainChip}>
              <ChainIndicator chainId={chainId} className={css.chainIndicator} />
            </Box>
            {safenetChains.length > 0 && (
              <>
                <Typography>but enabled on </Typography>
                <MultichainIndicator chains={safenetChains} />
              </>
            )}
          </Stack>
        </Alert>
      )}
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
        <Stack direction="row" gap={1} alignItems="center">
          Enable Safenet on
          <ChainIndicator chainId={chainId} className={css.chainIndicator} />
        </Stack>
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
