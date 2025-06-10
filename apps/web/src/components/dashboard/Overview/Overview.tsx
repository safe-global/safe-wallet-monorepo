import BuyCryptoButton from '@/components/common/BuyCryptoButton'
import TokenAmount from '@/components/common/TokenAmount'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/sidebar/QrCodeButton'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import SwapIcon from '@/public/images/common/swap.svg'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import Link from 'next/link'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import ArrowIconNW from '@/public/images/common/arrow-top-right.svg'
import ArrowIconSE from '@/public/images/common/arrow-se.svg'
import FiatValue from '@/components/common/FiatValue'
import { AppRoutes } from '@/config/routes'
import { Button, Card, Grid, Box, Skeleton, Typography, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { type ReactElement, useContext } from 'react'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import NewsCarousel, { BannerItem } from '@/components/dashboard/NewsCarousel'
import EarnBanner from '@/components/dashboard/NewsCarousel/banners/EarnBanner'
import SpacesBanner from '@/components/dashboard/NewsCarousel/banners/SpacesBanner'
import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const SkeletonOverview = (
  <>
    <Grid
      container
      sx={{
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Grid item>
        <Skeleton variant="text" width={100} height={30} />
        <Skeleton variant="rounded" width={160} height={40} />
      </Grid>

      <Grid item>
        <Grid
          container
          sx={{
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Skeleton variant="rounded" width="115px" height="40px" />
          <Skeleton variant="rounded" width="115px" height="40px" />
        </Grid>
      </Grid>
    </Grid>
  </>
)

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnFeatureEnabled = useIsEarnFeatureEnabled()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)

  const banners = [
    isEarnFeatureEnabled && { id: 'earnBanner', element: <EarnBanner /> },
    isSpacesFeatureEnabled && { id: 'spacesBanner', element: <SpacesBanner /> },
  ].filter(Boolean) as BannerItem[]

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const handleOnSend = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }

  return (
    <Card sx={{ border: 0, p: 3 }}>
      <Box>
        {isLoading ? (
          SkeletonOverview
        ) : (
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography color="primary.light" fontWeight="bold" mb={1}>
                Total asset value
              </Typography>
              <Typography component="div" variant="h1" fontSize="44px" lineHeight="40px">
                {safe.deployed ? (
                  <FiatValue value={balances.fiatTotal} maxLength={20} precise />
                ) : (
                  <TokenAmount
                    value={balances.items[0]?.balance}
                    decimals={balances.items[0]?.tokenInfo.decimals}
                    tokenSymbol={balances.items[0]?.tokenInfo.symbol}
                  />
                )}
              </Typography>
            </Box>

            {safe.deployed && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box flexShrink="0">
                  <BuyCryptoButton />
                </Box>

                <Button
                  onClick={handleOnSend}
                  size="compact"
                  variant="contained"
                  color="background"
                  disableElevation
                  startIcon={<ArrowIconNW fontSize="small" />}
                  sx={{ height: '42px' }}
                  fullWidth
                >
                  Send
                </Button>

                <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
                  <QrCodeButton>
                    <Button
                      size="compact"
                      variant="contained"
                      color="background"
                      disableElevation
                      startIcon={<ArrowIconSE fontSize="small" />}
                      sx={{ height: '42px' }}
                      fullWidth
                    >
                      Receive
                    </Button>
                  </QrCodeButton>
                </Track>

                {isSwapFeatureEnabled && (
                  <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                    <Link href={{ pathname: AppRoutes.swap, query: router.query }} passHref type="button">
                      <Button
                        data-testid="overview-swap-btn"
                        size="compact"
                        variant="contained"
                        color="background"
                        disableElevation
                        startIcon={<SwapIcon fontSize="small" />}
                        sx={{ height: '42px' }}
                        fullWidth
                      >
                        Swap
                      </Button>
                    </Link>
                  </Track>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <NewsCarousel banners={banners} />
    </Card>
  )
}

export default Overview
