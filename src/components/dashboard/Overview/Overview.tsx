import QrCodeButton from '@/components/sidebar/QrCodeButton'
import { TxModalContext } from '@/components/tx-flow'
import NewTxMenu from '@/components/tx-flow/flows/NewTx'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency } from '@/utils/formatNumber'
import type { ReactElement } from 'react'
import { useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Box, Button, Divider, Grid, Skeleton, Typography } from '@mui/material'
import { Card, WidgetBody, WidgetContainer } from '../styled'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ChainIndicator from '@/components/common/ChainIndicator'
import { AppRoutes } from '@/config/routes'
import useCollectibles from '@/hooks/useCollectibles'
import type { UrlObject } from 'url'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import AddIcon from '@mui/icons-material/Add'
import ArrowIconNW from '@/public/images/common/arrow-top-right.svg'
import ArrowIconSE from '@/public/images/common/arrow-se.svg'

const ValueSkeleton = () => <Skeleton variant="text" width={20} />

const SkeletonOverview = (
  <Card>
    <Grid container>
      <Grid item xs={12}>
        <Box mb={2}>
          <Skeleton variant="text" width={100} height={21} />
          <Skeleton variant="text" width={120} height={40} />
        </Box>

        <Box position="absolute" right="24px" top="24px">
          <Skeleton variant="text" width="80px" />
        </Box>

        <Divider sx={{ mb: '12px' }} />
      </Grid>
    </Grid>
    <Grid container>
      <Grid item container xs={6} gap={2}>
        <Typography
          color="border.main"
          variant="caption"
          fontWeight="bold"
          display="flex"
          gap={1}
          textTransform="uppercase"
        >
          <ValueSkeleton /> Tokens
        </Typography>
        <Typography
          color="border.main"
          variant="caption"
          fontWeight="bold"
          display="flex"
          gap={1}
          textTransform="uppercase"
        >
          <ValueSkeleton /> NFTs
        </Typography>
      </Grid>
    </Grid>
    <Grid container mt={3} gap={1}>
      <Skeleton variant="rounded" width="115px" height="40px" />
      <Skeleton variant="rounded" width="115px" height="40px" />
    </Grid>
  </Card>
)

const Overview = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const router = useRouter()
  const { safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const [nfts, , nftsLoading] = useCollectibles()
  const chain = useCurrentChain()
  const { chainId } = chain || {}
  const { setTxFlow } = useContext(TxModalContext)
  const [apps] = useRemoteSafeApps()

  const fiatTotal = useMemo(
    () => (balances.fiatTotal ? formatCurrency(balances.fiatTotal, currency) : ''),
    [currency, balances.fiatTotal],
  )

  const rampSafeApp = apps?.find((app) => app.name === 'Ramp Network')

  const assetsLink: UrlObject = {
    pathname: AppRoutes.balances.index,
    query: { safe: router.query.safe },
  }
  const nftsLink: UrlObject = {
    pathname: AppRoutes.balances.nfts,
    query: { safe: router.query.safe },
  }

  // Native token is always returned even when its balance is 0
  const tokenCount = useMemo(() => balances.items.filter((token) => token.balance !== '0').length, [balances])
  const nftsCount = useMemo(() => (nfts ? `${nfts.next ? '>' : ''}${nfts.results.length}` : ''), [nfts])

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || nftsLoading || isInitialState

  const handleOnSend = () => {
    setTxFlow(<NewTxMenu />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }

  return (
    <WidgetContainer>
      <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
        Overview
      </Typography>

      <WidgetBody>
        {isLoading ? (
          SkeletonOverview
        ) : (
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Grid container pb={2}>
              <Grid item>
                <Typography variant="body2" color="primary.light">
                  Total asset value
                </Typography>
                <Typography variant="h2">{fiatTotal}</Typography>
              </Grid>
              <Grid item xs />

              <Grid item>
                <ChainIndicator chainId={chainId} inline />
              </Grid>
            </Grid>

            <Divider />

            <Grid container pt="12px">
              <Grid item container xs={6} gap={1}>
                <Link href={assetsLink} passHref>
                  <Box
                    sx={{
                      display: 'flex',
                      borderRight: '1px solid',
                      borderColor: ({ palette }) => palette.border.light,
                      gap: 0.5,
                      pr: 1,
                    }}
                  >
                    <Typography variant="caption" component="span">
                      {balancesLoading ? <ValueSkeleton /> : tokenCount}
                    </Typography>{' '}
                    <Typography
                      variant="caption"
                      component="span"
                      color="border.main"
                      textTransform="uppercase"
                      fontWeight="bold"
                    >
                      Tokens
                    </Typography>
                  </Box>
                </Link>

                <Link href={nftsLink} passHref>
                  <Box display="flex" pr={1} gap={0.5}>
                    <Typography variant="caption" component="span">
                      {nftsCount || <ValueSkeleton />}
                    </Typography>{' '}
                    <Typography
                      variant="caption"
                      component="span"
                      color="border.main"
                      textTransform="uppercase"
                      fontWeight="bold"
                    >
                      NFTs
                    </Typography>
                  </Box>
                </Link>
              </Grid>
            </Grid>
            <Grid item mt="auto">
              <Box display="flex" mt={3} gap={1} flexWrap="wrap">
                {rampSafeApp && (
                  <Link
                    href={{
                      pathname: AppRoutes.apps.open,
                      query: { safe: router.query.safe, appUrl: rampSafeApp.url },
                    }}
                    passHref
                    legacyBehavior
                  >
                    <Button size="small" variant="contained" color="primary" startIcon={<AddIcon />}>
                      Buy crypto
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={handleOnSend}
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowIconNW />}
                >
                  Send
                </Button>
                <QrCodeButton>
                  <Button size="small" variant="outlined" color="primary" startIcon={<ArrowIconSE />}>
                    Receive
                  </Button>
                </QrCodeButton>
              </Box>
            </Grid>
          </Card>
        )}
      </WidgetBody>
    </WidgetContainer>
  )
}

export default Overview
