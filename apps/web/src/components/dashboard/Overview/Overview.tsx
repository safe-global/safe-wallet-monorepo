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
import { Button, Grid, Skeleton, Typography, useMediaQuery } from '@mui/material'
import { useRouter } from 'next/router'
import { type ReactElement, useContext } from 'react'
import { WidgetBody, WidgetContainer } from '../styled'
import { useTheme } from '@mui/material/styles'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'

const SkeletonOverview = (
  <>
    <Grid
      container
      sx={{
        pb: 2,
        mt: 3,
        gap: 2,
        alignItems: 'flex-end',
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
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const handleOnSend = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }

  const buttonWidth = isSwapFeatureEnabled ? 4 : 6

  return (
    <WidgetContainer>
      <WidgetBody>
        {isLoading ? (
          SkeletonOverview
        ) : (
          <>
            <Grid
              container
              sx={{
                pb: 2,
                mt: 3,
                gap: 2,
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <Grid item>
                <Typography
                  sx={{
                    color: 'primary.light',
                    fontWeight: 'bold',
                    mb: 1,
                  }}
                >
                  Total asset value
                </Typography>
                <Typography
                  component="div"
                  variant="h1"
                  sx={{
                    fontSize: 44,
                    lineHeight: '40px',
                  }}
                >
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
              </Grid>

              {safe.deployed && (
                <Grid
                  item
                  container
                  spacing={1}
                  xs={12}
                  sm
                  sx={{
                    justifyContent: 'flex-end',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
                  <Grid item xs={12} sm="auto">
                    <BuyCryptoButton />
                  </Grid>

                  <Grid item xs={buttonWidth} sm="auto">
                    <Button
                      onClick={handleOnSend}
                      size={isSmallScreen ? 'medium' : 'small'}
                      variant="outlined"
                      color="primary"
                      startIcon={<ArrowIconNW />}
                      fullWidth
                    >
                      Send
                    </Button>
                  </Grid>
                  <Grid item xs={buttonWidth} sm="auto">
                    <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
                      <QrCodeButton>
                        <Button
                          size={isSmallScreen ? 'medium' : 'small'}
                          variant="outlined"
                          color="primary"
                          startIcon={<ArrowIconSE />}
                          fullWidth
                        >
                          Receive
                        </Button>
                      </QrCodeButton>
                    </Track>
                  </Grid>

                  {isSwapFeatureEnabled && (
                    <Grid item xs={buttonWidth} sm="auto">
                      <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                        <Link href={{ pathname: AppRoutes.swap, query: router.query }} passHref type="button">
                          <Button
                            data-testid="overview-swap-btn"
                            size={isSmallScreen ? 'medium' : 'small'}
                            variant="outlined"
                            color="primary"
                            startIcon={<SwapIcon />}
                            fullWidth
                          >
                            Swap
                          </Button>
                        </Link>
                      </Track>
                    </Grid>
                  )}
                </Grid>
              )}
            </Grid>
          </>
        )}
      </WidgetBody>
    </WidgetContainer>
  )
}

export default Overview
