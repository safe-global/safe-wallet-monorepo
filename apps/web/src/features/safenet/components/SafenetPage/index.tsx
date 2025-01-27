import { TxModalContext } from '@/components/tx-flow'
import { EnableSafenetFlow } from '@/components/tx-flow/flows'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { ExtendedSafeInfo } from '@/store/safeInfoSlice'
import type { SafenetConfigEntity } from '@/store/safenet'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import { hasSafeFeature } from '@/utils/safe-versions'
import { Button, CircularProgress, Grid, Paper, SvgIcon, Tooltip, Typography } from '@mui/material'
import { SAFE_FEATURES } from '@safe-global/protocol-kit/dist/src/utils'
import type { NextPage } from 'next'
import { useContext } from 'react'

const SafenetContent = ({ safenetConfig, safe }: { safenetConfig: SafenetConfigEntity; safe: ExtendedSafeInfo }) => {
  const isVersionWithGuards = hasSafeFeature(SAFE_FEATURES.SAFE_TX_GUARDS, safe.version)
  const safenetGuardAddress = safenetConfig.guards[safe.chainId]
  const safenetModuleAddress = safenetConfig.settlementEngines[safe.chainId]
  const isSafenetGuardEnabled = isVersionWithGuards && sameAddress(safe.guard?.value, safenetGuardAddress)
  const chainSupported = safenetConfig.chains.includes(Number(safe.chainId))
  const { setTxFlow } = useContext(TxModalContext)

  switch (true) {
    case !chainSupported:
      return (
        <Typography>
          Safenet is not supported on this chain. List of supported chains ids: {safenetConfig.chains.join(', ')}
        </Typography>
      )
    case !isVersionWithGuards:
      return <Typography>Please upgrade your Safe to the latest version to use Safenet</Typography>
    case isSafenetGuardEnabled:
      return <Typography>Safenet is enabled. Enjoy your unified experience.</Typography>
    case !isSafenetGuardEnabled:
      return (
        <div>
          <Typography>Safenet is not enabled. Enable it to enhance your Safe experience.</Typography>
          <Button
            variant="contained"
            onClick={() =>
              setTxFlow(<EnableSafenetFlow guardAddress={safenetGuardAddress} moduleAddress={safenetModuleAddress} />)
            }
            sx={{ mt: 2 }}
          >
            Enable
          </Button>
        </div>
      )
    default:
      return null
  }
}

const SafenetPage: NextPage = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const { data: safenetConfig, isLoading: safenetConfigLoading, error: safenetConfigError } = useGetSafenetConfigQuery()

  if (!safeLoaded || safenetConfigLoading) {
    return <CircularProgress />
  }

  if (safenetConfigError) {
    return <Typography>Error loading Safenet config</Typography>
  }

  if (!safenetConfig) {
    // Should never happen, making TS happy
    return <Typography>No Safenet config found</Typography>
  }

  const safenetContent = <SafenetContent safenetConfig={safenetConfig} safe={safe} />

  return (
    <main>
      <Paper data-testid="setup-section" sx={{ p: 4, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item lg={4} xs={12}>
            <Typography variant="h4" fontWeight={700}>
              <Tooltip
                placement="top"
                title="Safenet enhances your Safe experience by providing additional security features."
              >
                <span>
                  Safenet Status
                  <SvgIcon
                    component={InfoIcon}
                    inheritViewBox
                    fontSize="small"
                    color="border"
                    sx={{ verticalAlign: 'middle', ml: 0.5 }}
                  />
                </span>
              </Tooltip>
            </Typography>
          </Grid>

          <Grid item xs>
            {safenetContent}
          </Grid>
        </Grid>
      </Paper>
    </main>
  )
}

export default SafenetPage
