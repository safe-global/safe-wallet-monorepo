import { type ReactElement, useContext, useMemo, useCallback } from 'react'
import { Button, Card, Box, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/sidebar/QrCodeButton'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import SwapIcon from '@/public/images/common/swap.svg'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import ArrowIconNW from '@/public/images/common/arrow-top-right.svg'
import ArrowIconSE from '@/public/images/common/arrow-se.svg'
import { AppRoutes } from '@/config/routes'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import CheckWallet from '@/components/common/CheckWallet'
import OverviewSkeleton from './OverviewSkeleton'

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loaded: balancesLoaded, loading: balancesLoading } = useVisibleBalances()
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const handleOnSend = useCallback(() => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }, [setTxFlow])

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = balancesLoaded && items.length === 0

  if (isLoading) return <OverviewSkeleton />

  return (
    <Card sx={{ border: 0, px: 3, pt: 2.5, pb: 1.5 }} component="section">
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <TotalAssetValue fiatTotal={balances.fiatTotal} />

          {safe.deployed && (
            <Stack
              direction="row"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              gap={1}
              width={{ xs: 1, md: 'auto' }}
              mt={{ xs: 2, md: 0 }}
            >
              {!noAssets && (
                <Box flex={1}>
                  <CheckWallet>
                    {(isOk) => (
                      <Button
                        onClick={handleOnSend}
                        size="compact"
                        variant="contained"
                        disableElevation
                        startIcon={<ArrowIconNW fontSize="small" />}
                        sx={{ height: '42px' }}
                        fullWidth
                        disabled={!isOk}
                      >
                        Send
                      </Button>
                    )}
                  </CheckWallet>
                </Box>
              )}

              {isSwapFeatureEnabled && !noAssets && (
                <Box flex={1}>
                  <CheckWallet>
                    {(isOk) => {
                      const btn = (
                        <Button
                          data-testid="overview-swap-btn"
                          size="compact"
                          variant="contained"
                          color="background"
                          disableElevation
                          startIcon={<SwapIcon fontSize="small" />}
                          sx={{ height: '42px' }}
                          fullWidth
                          disabled={!isOk}
                        >
                          Swap
                        </Button>
                      )

                      return (
                        <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                          {isOk ? (
                            <Link href={{ pathname: AppRoutes.swap, query: router.query }} passHref type="button">
                              {btn}
                            </Link>
                          ) : (
                            btn
                          )}
                        </Track>
                      )
                    }}
                  </CheckWallet>
                </Box>
              )}

              <Box flex={1}>
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
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>
    </Card>
  )
}

export default Overview
